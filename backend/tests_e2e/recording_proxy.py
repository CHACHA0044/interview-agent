"""Transparent recording reverse proxy for the gateway -> interview-agent hop.

The public gateway API only exposes {reply, done, feedback}, so per-turn scores,
days, difficulty and the full agent state are not visible to an external client.
This proxy sits between the gateway and the real interview-agent. Every request
is forwarded to the real agent (which itself calls the real ai-intelligence
service) and the JSON bodies are appended to a JSONL log. The e2e harness uses
that log to reconstruct the full AgentTurnResponse payload for assertions.

This is observability, not mocking: nothing is stubbed or replaced.
"""

import argparse
import http.client
import itertools
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_seq = itertools.count(1)
_lock = threading.Lock()
_log_path = ""
_target_host = "127.0.0.1"
_target_port = 0


def _log(entry: dict) -> None:
    with _lock:
        with open(_log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")


class _Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # silence default request logging
        pass

    def _handle(self) -> None:
        seq = next(_seq)
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length) if length else b""
        try:
            req_json = json.loads(body.decode("utf-8")) if body else None
        except (ValueError, UnicodeDecodeError):
            req_json = None

        status = 502
        resp_body = b""
        resp_headers = []
        conn = None
        try:
            conn = http.client.HTTPConnection(_target_host, _target_port, timeout=60)
            headers = {
                k: v
                for k, v in self.headers.items()
                if k.lower() not in ("host", "content-length", "connection", "transfer-encoding")
            }
            conn.request(self.command, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            status = resp.status
            resp_body = resp.read()
            resp_headers = [
                (k, v)
                for k, v in resp.getheaders()
                if k.lower() not in ("content-length", "transfer-encoding", "connection")
            ]
        except Exception as exc:  # forward a 502 so the gateway fails loudly, never silently
            resp_body = f"recording proxy upstream error: {exc}".encode("utf-8")
        finally:
            if conn is not None:
                conn.close()

        self.send_response(status)
        for k, v in resp_headers:
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(resp_body)))
        self.end_headers()
        if self.command != "HEAD":
            try:
                self.wfile.write(resp_body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        try:
            resp_json = json.loads(resp_body.decode("utf-8")) if resp_body else None
        except (ValueError, UnicodeDecodeError):
            resp_json = None

        _log(
            {
                "seq": seq,
                "ts": time.time(),
                "method": self.command,
                "path": self.path,
                "status": status,
                "request": req_json,
                "response": resp_json,
            }
        )

    do_POST = _handle
    do_GET = _handle


def main() -> None:
    global _log_path, _target_host, _target_port
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--listen-host", default="127.0.0.1")
    ap.add_argument("--listen-port", type=int, required=True)
    ap.add_argument("--target-host", default="127.0.0.1")
    ap.add_argument("--target-port", type=int, required=True)
    ap.add_argument("--log-file", required=True)
    args = ap.parse_args()
    _log_path = args.log_file
    _target_host = args.target_host
    _target_port = args.target_port
    httpd = ThreadingHTTPServer((args.listen_host, args.listen_port), _Handler)
    httpd.daemon_threads = True
    httpd.serve_forever()


if __name__ == "__main__":
    main()
