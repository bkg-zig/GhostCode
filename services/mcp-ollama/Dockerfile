# MCP Client for Ollama
# Based on: https://github.com/eyshoit-commits/mcp-client-for-ollama

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Clone mcp-client-for-ollama
RUN git clone https://github.com/eyshoit-commits/mcp-client-for-ollama.git .

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Create entrypoint script
RUN echo '#!/bin/bash\n\
echo "🚀 Starting MCP Client for Ollama..."\n\
echo "Ollama Host: ${OLLAMA_HOST:-http://ollama:11434}"\n\
echo "Model: ${OLLAMA_MODEL:-qwen2.5:1.5b-instruct}"\n\
echo ""\n\
echo "Checking Ollama availability..."\n\
curl -s ${OLLAMA_HOST}/api/tags | python -m json.tool || echo "⚠️  Ollama not yet available"\n\
echo ""\n\
echo "Starting MCP server..."\n\
exec ollmcp \\\n\
  --host ${OLLAMA_HOST:-http://ollama:11434} \\\n\
  --model ${OLLAMA_MODEL:-qwen2.5:1.5b-instruct} \\\n\
  --port 8080 \\\n\
  ${MCP_AUTO_DISCOVERY:+--auto-discovery} \\\n\
  --non-interactive' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app/entrypoint.sh"]
