FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# curriculum.json is mounted at runtime for the in-memory retrieval fallback.
ENV CURRICULUM_PATH=/app/curriculum.json

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
