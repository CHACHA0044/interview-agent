# Single-container multi-service deployment for Render
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy service requirements and install dependencies
COPY services/gateway/requirements.txt /app/requirements-gateway.txt
COPY services/interview-agent/requirements.txt /app/requirements-agent.txt
COPY services/ai-intelligence/requirements.txt /app/requirements-ai.txt

RUN pip install --no-cache-dir \
    -r /app/requirements-gateway.txt \
    -r /app/requirements-agent.txt \
    -r /app/requirements-ai.txt

# Copy shared code, services, curriculum, candidates, and startup script
COPY shared /app/shared
COPY services /app/services
COPY curriculum.json /app/curriculum.json
COPY candidates.json /app/candidates.json
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

# Environment defaults for single-container Render deployment
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/shared:/app/services/gateway:/app/services/interview-agent:/app/services/ai-intelligence \
    CURRICULUM_PATH=/app/curriculum.json \
    CANDIDATES_PATH=/app/candidates.json \
    AGENT_SERVICE_URL=http://127.0.0.1:8001 \
    AI_SERVICE_URL=http://127.0.0.1:8002 \
    LLM_PROVIDER=fake \
    PORT=8000

EXPOSE 8000

CMD ["/app/start.sh"]
