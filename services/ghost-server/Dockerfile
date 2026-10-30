FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN pip install --no-cache-dir fastapi uvicorn[standard]

# Copy application code
COPY ghost_api.py /app/ghost_api.py
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 5905

ENV GHOST_PORT=5905

ENTRYPOINT ["/entrypoint.sh"]
