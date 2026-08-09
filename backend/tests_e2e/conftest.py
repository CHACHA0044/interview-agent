"""Pytest fixtures for the live e2e interview suite.

The stack fixture boots the real services once per pytest run and tears them
down afterwards. Transcripts are written under tests_e2e/transcripts/latest.
"""

from __future__ import annotations

import pathlib
import shutil
import sys
import time

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from harness import Stack, Transcript  # noqa: E402

RUN_DIR = pathlib.Path(__file__).resolve().parent / "transcripts" / "latest"


@pytest.fixture(scope="session")
def run_dir() -> pathlib.Path:
    if RUN_DIR.exists():
        shutil.rmtree(RUN_DIR)
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    return RUN_DIR


@pytest.fixture(scope="session")
def stack(run_dir: pathlib.Path):
    st = Stack(run_dir)
    started_at = time.time()
    st.start()
    (run_dir / "stack_ready_after_s.txt").write_text(
        f"{time.time() - started_at:.1f}\n", encoding="utf-8"
    )
    yield st
    st.stop()


@pytest.fixture(scope="session")
def transcript(stack: Stack) -> Transcript:
    return Transcript(stack.log_path)


@pytest.fixture(scope="session")
def sessions_dir(run_dir: pathlib.Path) -> pathlib.Path:
    path = run_dir / "sessions"
    path.mkdir(parents=True, exist_ok=True)
    return path
