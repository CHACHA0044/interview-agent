"""Shared helpers for the live e2e interview tests.

Spawns the real stack (ai-intelligence, interview-agent, recording proxy,
gateway) as subprocesses, drives interviews through the real public gateway
API, and reconstructs per-turn detail from the recording proxy's JSONL log.
"""

from __future__ import annotations

import json
import os
import pathlib
import socket
import subprocess
import time
import urllib.error
import urllib.request

import httpx

ROOT = pathlib.Path(__file__).resolve().parents[1]
VENV_PY = ROOT / ".venv" / "Scripts" / "python.exe"
CURRICULUM_PATH = ROOT / "curriculum.json"
CANDIDATES_PATH = ROOT / "candidates.json"
PROXY_SCRIPT = pathlib.Path(__file__).resolve().parent / "recording_proxy.py"

AI_PORT = 8012
AGENT_PORT = 8011
PROXY_PORT = 8013
GATEWAY_PORT = 8010
GATEWAY_URL = f"http://127.0.0.1:{GATEWAY_PORT}"

_CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def load_candidates() -> dict[str, dict]:
    data = json.loads(CANDIDATES_PATH.read_text(encoding="utf-8"))
    return {c["member"]["id"]: c for c in data["candidates"]}


def load_curriculum() -> dict:
    return json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))


def _http_get_json(url: str, timeout: float = 3.0) -> tuple[int, dict | None]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        except Exception:
            return exc.code, None
    except Exception as exc:
        return -1, {"_error": str(exc)}


def _wait_until(predicate, timeout: float, label: str, interval: float = 0.25) -> None:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        ok, last = predicate()
        if ok:
            return
        time.sleep(interval)
    raise TimeoutError(f"stack did not become ready: {label} (last={last!r})")


def _port_open(port: int) -> bool:
    s = socket.socket()
    try:
        s.settimeout(0.5)
        s.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def _pid_listening_on(port: int) -> int | None:
    if os.name != "nt":
        return None
    try:
        out = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, timeout=20
        ).stdout
    except Exception:
        return None
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[1].endswith(f":{port}") and parts[3] == "LISTENING":
            try:
                return int(parts[4])
            except ValueError:
                continue
    return None


def kill_stale_ports() -> None:
    """Terminate leftover processes from a previous crashed run."""
    for port in (AI_PORT, AGENT_PORT, PROXY_PORT, GATEWAY_PORT):
        pid = _pid_listening_on(port)
        if pid is not None:
            try:
                subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True, timeout=15)
            except Exception:
                pass


class Stack:
    """Manages the four subprocesses of the live stack."""

    def __init__(self, workdir: pathlib.Path) -> None:
        self.workdir = pathlib.Path(workdir)
        self.workdir.mkdir(parents=True, exist_ok=True)
        self.log_path = self.workdir / "proxy.jsonl"
        self.procs: list[subprocess.Popen] = []

    # ------------------------------------------------------------ lifecycle

    def start(self) -> None:
        kill_stale_ports()
        env = os.environ.copy()
        env["PYTHONUNBUFFERED"] = "1"

        self._spawn_service(
            "ai-intelligence",
            AI_PORT,
            env,
            {"LLM_PROVIDER": "fake", "CURRICULUM_PATH": str(CURRICULUM_PATH),
             "QDRANT_URL": "http://127.0.0.1:6398"},
        )
        self._spawn_service(
            "interview-agent",
            AGENT_PORT,
            env,
            {"AI_SERVICE_URL": f"http://127.0.0.1:{AI_PORT}",
             "CURRICULUM_PATH": str(CURRICULUM_PATH)},
        )
        proxy = subprocess.Popen(
            [
                str(VENV_PY), str(PROXY_SCRIPT),
                "--listen-port", str(PROXY_PORT),
                "--target-host", "127.0.0.1",
                "--target-port", str(AGENT_PORT),
                "--log-file", str(self.log_path),
            ],
            cwd=str(ROOT),
            env=env,
            stdout=self._log_handle("proxy"),
            stderr=subprocess.STDOUT,
            creationflags=_CREATE_NO_WINDOW,
        )
        self.procs.append(proxy)

        self._spawn_service(
            "gateway",
            GATEWAY_PORT,
            env,
            {
                "AGENT_SERVICE_URL": f"http://127.0.0.1:{PROXY_PORT}",
                "AI_SERVICE_URL": f"http://127.0.0.1:{AI_PORT}",
                "REDIS_URL": "redis://127.0.0.1:6399/0",
                "CONNECT_TIMEOUT_SECONDS": "1",
                "REQUEST_TIMEOUT_SECONDS": "30",
                "RETRIES": "0",
                "INTERNAL_API_TOKEN": "",
                "FRONTEND_ORIGINS": "http://localhost:5173",
                "LOG_LEVEL": "WARNING",
            },
        )

        self._wait_ready(
            "ai-intelligence", AI_PORT,
            expect=lambda st, body: st == 200 and (body or {}).get("status") == "ok",
        )
        self._wait_ready(
            "interview-agent", AGENT_PORT,
            expect=lambda st, body: st == 200 and (body or {}).get("status") == "ok",
        )
        _wait_until(lambda: (_port_open(PROXY_PORT), "proxy port"), 30.0, "recording proxy")
        # Gateway returns 503 when Redis is down (in-memory fallback); that is
        # our signal that it finished resolving the session store.
        self._wait_ready(
            "gateway", GATEWAY_PORT,
            expect=lambda st, body: st in (200, 503),
        )

    def stop(self) -> None:
        for proc in reversed(self.procs):
            try:
                proc.terminate()
            except Exception:
                pass
        for proc in reversed(self.procs):
            try:
                proc.wait(timeout=5)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

    # -------------------------------------------------------------- helpers

    def _log_handle(self, name: str):
        return open(self.workdir / f"{name}.log", "w", encoding="utf-8", errors="replace")

    def _spawn_service(self, service: str, port: int, env: dict, overrides: dict) -> None:
        service_env = dict(env)
        service_env.update(overrides)
        cwd = ROOT / "services" / service
        proc = subprocess.Popen(
            [
                str(VENV_PY), "-m", "uvicorn",
                "app.main:app",
                "--host", "127.0.0.1",
                "--port", str(port),
                "--log-level", "warning",
            ],
            cwd=str(cwd),
            env=service_env,
            stdout=self._log_handle(service),
            stderr=subprocess.STDOUT,
            creationflags=_CREATE_NO_WINDOW,
        )
        self.procs.append(proc)

    def _wait_ready(self, service: str, port: int, expect) -> None:
        url = f"http://127.0.0.1:{port}/health"

        def check():
            status, body = _http_get_json(url)
            return expect(status, body), (status, body)

        _wait_until(check, 60.0, f"{service} /health on :{port}")


class Transcript:
    """Reads the recording proxy JSONL and pulls per-session entries."""

    def __init__(self, path: pathlib.Path) -> None:
        self.path = pathlib.Path(path)

    def entries(self, session_id: str) -> list[dict]:
        if not self.path.exists():
            return []
        out = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            try:
                entry = json.loads(line)
            except ValueError:
                continue
            req = entry.get("request") or {}
            if req.get("sessionId") == session_id:
                out.append(entry)
        out.sort(key=lambda e: e["seq"])
        return out

    def poll(self, session_id: str, after_seq: int, timeout: float = 15.0) -> dict:
        deadline = time.time() + timeout
        while time.time() < deadline:
            newer = [e for e in self.entries(session_id) if e["seq"] > after_seq]
            if newer:
                return min(newer, key=lambda e: e["seq"])
            time.sleep(0.05)
        raise TimeoutError(
            f"no transcript entry for {session_id} after seq {after_seq} in {self.path}"
        )


# ------------------------------------------------------------------ policies

def strong_answer(ctx: dict) -> str:
    role, topic = ctx["role"], ctx["topic"]
    concepts = ctx["concepts"]
    parts = [f"As a {role}, here is how I would answer the question about {topic}."]
    for c in concepts:
        parts.append(
            f"On {c}: this concept is central to {topic} and it directly shapes the "
            "decisions I would make, so I would treat it as a key requirement from day one."
        )
    parts.append(
        "In production I would compare the trade-offs across cost, latency, reliability, "
        "maintainability and failure modes, choose the option that best fits the workload "
        "and the team's maturity, add monitoring and rollback so we can recover quickly, "
        "and document the decision so it can be revisited as requirements evolve."
    )
    return " ".join(parts)


def weak_answer(ctx: dict) -> str:
    return "I have not worked with this topic yet, so I am not sure how to answer."


class DifficultyProbePolicy:
    """Strong while the current question is not hard; once a hard question is
    asked, answer weakly so the difficulty adapts back down, then answer
    strongly again for the remainder."""

    def __init__(self) -> None:
        self.saw_hard = False

    def __call__(self, ctx: dict) -> str:
        if ctx["difficulty"] == "hard":
            self.saw_hard = True
            return weak_answer(ctx)
        if self.saw_hard:
            return strong_answer(ctx)
        return strong_answer(ctx)


# ------------------------------------------------------------- interview loop

def run_interview(
    stack: Stack,
    transcript: Transcript,
    session_id: str,
    candidate: dict,
    policy,
    out_path: pathlib.Path | None = None,
    max_turns: int = 60,
) -> dict:
    """Runs a full interview and returns the reconstructed per-session record."""
    rec: dict = {
        "sessionId": session_id,
        "candidateId": candidate["member"]["id"],
        "candidateName": candidate["member"]["name"],
        "jobRole": candidate["member"]["jobRole"],
        "turns": [],
    }
    after_seq = 0

    with httpx.Client(base_url=GATEWAY_URL, timeout=60) as client:
        start = client.post(
            "/api/interview", json={"sessionId": session_id, "candidate": candidate}
        )
        start.raise_for_status()
        pub = start.json()
        assert not pub["done"], "start should never complete the interview"

        entry = transcript.poll(session_id, after_seq)
        after_seq = entry["seq"]
        resp = entry["response"]
        ag = resp["agentState"]
        rec["startingDifficulty"] = ag["difficulty_state"]["current_difficulty"]
        rec["startingTier"] = ag["candidate_context"]["tier"]
        rec["plan"] = ag["interview_plan"]
        rec["startFollowUpContext"] = ag["follow_up_context"]
        rec["startSessionView"] = resp["sessionView"]

        current = {"text": pub["reply"], "question": resp["question"]}
        turn = 0
        while not pub.get("done"):
            assert turn < max_turns, "runaway interview loop"
            q = current["question"]
            ctx = {
                "role": candidate["member"]["jobRole"],
                "topic": q["topic"],
                "concepts": q.get("expectedConcepts") or [],
                "difficulty": q["difficulty"],
                "day": q["day"],
                "isFollowUp": q.get("followUpOf") is not None,
                "turn": turn,
            }
            answer = policy(ctx)
            step = client.post(
                "/api/interview", json={"sessionId": session_id, "message": answer}
            )
            step.raise_for_status()
            pub = step.json()

            entry = transcript.poll(session_id, after_seq)
            after_seq = entry["seq"]
            resp = entry["response"]
            ag = resp["agentState"]
            history = ag["history"]
            last_eval = history[-1] if history else {}

            rec["turns"].append(
                {
                    "turn": turn,
                    "questionText": current["text"],
                    "day": ctx["day"],
                    "topic": ctx["topic"],
                    "difficulty": ctx["difficulty"],
                    "isFollowUp": ctx["isFollowUp"],
                    "answer": answer,
                    "expectedConcepts": ctx["concepts"],
                    "score": last_eval.get("score"),
                    "coverage": last_eval.get("concept_coverage"),
                    "depth": last_eval.get("depth"),
                    "gaps": last_eval.get("gaps") or [],
                    "strengths": last_eval.get("strengths") or [],
                    "followUpContext": ag["follow_up_context"],
                    "difficultyState": ag["difficulty_state"],
                    "nextReply": pub["reply"],
                    "nextQuestion": resp["question"],
                    "nextDone": pub["done"],
                }
            )
            current = {"text": pub["reply"], "question": resp["question"]}
            turn += 1
            if pub.get("done"):
                rec["feedback"] = pub["feedback"]
                rec["finalSessionView"] = resp["sessionView"]
                rec["answerCount"] = len(rec["turns"])
                rec["finished"] = True
                break

    if out_path is not None:
        out_path = pathlib.Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(rec, indent=2), encoding="utf-8")
    return rec
