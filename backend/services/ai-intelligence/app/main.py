"""Temporary placeholder for the ai-intelligence service.

TODO — REPLACE WITH MERAJ'S IMPLEMENTATION

This stub exists only so `docker compose up --build` works while the real
service is under development. It starts, exposes GET /health, and answers
POST /internal/* with a clearly marked stub body. It contains NO LLM code,
RAG, embeddings, evaluation, or feedback logic.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SERVICE = "ai-intelligence"
STUB_NOTE = "TODO - REPLACE WITH MERAJ'S IMPLEMENTATION"


class StubHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if self.path == "/health":
            return self._send(
                200, {"status": "ok", "service": SERVICE, "stub": True}
            )
        self._send(
            404,
            {"error": {"code": "NOT_FOUND", "message": "not found", "detail": {}}},
        )

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(length)
        self._send(
            200,
            {
                "stub": True,
                "service": SERVICE,
                "note": STUB_NOTE,
                "context": [],
                "source": "fallback",
            },
        )

    def log_message(self, *args) -> None:
        pass


if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", "8002"))
    ThreadingHTTPServer(("0.0.0.0", port), StubHandler).serve_forever()
