#!/usr/bin/env python3
"""
Ghost Server - Code Execution Sandbox
Provides REST API for cave management and code execution
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import docker
import os
import json
from typing import Optional, Dict, List

app = FastAPI(title="Ghost Server", version="0.2.0")

# Docker client
docker_client = docker.from_env()

# Cave storage
caves: Dict[str, dict] = {}

class CaveConfig(BaseModel):
    image: str = "python:3.11-slim"
    memory: Optional[int] = 512  # MB
    cpus: Optional[float] = 1.0
    volumes: Optional[List[str]] = []
    ports: Optional[List[str]] = []
    envs: Optional[List[str]] = []

class CaveStartRequest(BaseModel):
    cave: str
    namespace: str = "default"
    config: Optional[CaveConfig] = None

class CaveStopRequest(BaseModel):
    cave: str
    namespace: str = "default"

class CodeExecutionRequest(BaseModel):
    cave: str
    namespace: str = "default"
    code: str
    language: str = "python"

class CommandExecutionRequest(BaseModel):
    cave: str
    namespace: str = "default"
    command: str
    args: Optional[List[str]] = []

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ghost-server"}

@app.post("/caves/start")
async def start_cave(request: CaveStartRequest):
    """Start a new cave (isolated container)"""
    cave_id = f"{request.namespace}:{request.cave}"
    
    if cave_id in caves:
        raise HTTPException(status_code=400, detail="Cave already running")
    
    config = request.config or CaveConfig()
    
    try:
        container = docker_client.containers.run(
            config.image,
            command="sleep infinity",
            detach=True,
            name=cave_id.replace(":", "_"),
            mem_limit=f"{config.memory}m",
            nano_cpus=int(config.cpus * 1e9),
            environment={env.split("=")[0]: env.split("=")[1] for env in config.envs} if config.envs else {},
            network_mode="none" if os.getenv("GHOST_NETWORK_ISOLATED", "true") == "true" else "bridge"
        )
        
        caves[cave_id] = {
            "container_id": container.id,
            "namespace": request.namespace,
            "cave": request.cave,
            "config": config.dict()
        }
        
        return {"status": "started", "cave_id": cave_id, "container_id": container.short_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/caves/stop")
async def stop_cave(request: CaveStopRequest):
    """Stop and remove a cave"""
    cave_id = f"{request.namespace}:{request.cave}"
    
    if cave_id not in caves:
        raise HTTPException(status_code=404, detail="Cave not found")
    
    try:
        container = docker_client.containers.get(caves[cave_id]["container_id"])
        container.stop(timeout=10)
        container.remove()
        
        del caves[cave_id]
        
        return {"status": "stopped", "cave_id": cave_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/caves/execute")
async def execute_code(request: CodeExecutionRequest):
    """Execute code in a running cave"""
    cave_id = f"{request.namespace}:{request.cave}"
    
    if cave_id not in caves:
        raise HTTPException(status_code=404, detail="Cave not running. Start it first.")
    
    try:
        container = docker_client.containers.get(caves[cave_id]["container_id"])
        
        # Create temp file with code
        code_file = f"/tmp/code.{request.language}"
        container.exec_run(f"bash -c 'cat > {code_file}'", stdin=True, socket=True)
        
        # Execute based on language
        if request.language == "python":
            result = container.exec_run(f"python3 {code_file}")
        elif request.language in ["nodejs", "javascript"]:
            result = container.exec_run(f"node {code_file}")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")
        
        return {
            "status": "executed",
            "exit_code": result.exit_code,
            "output": result.output.decode("utf-8")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/caves/command")
async def execute_command(request: CommandExecutionRequest):
    """Execute shell command in a running cave"""
    cave_id = f"{request.namespace}:{request.cave}"
    
    if cave_id not in caves:
        raise HTTPException(status_code=404, detail="Cave not running")
    
    try:
        container = docker_client.containers.get(caves[cave_id]["container_id"])
        
        cmd = [request.command] + (request.args or [])
        result = container.exec_run(cmd)
        
        return {
            "status": "executed",
            "exit_code": result.exit_code,
            "output": result.output.decode("utf-8")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/caves/metrics")
async def get_metrics(namespace: str = "*", cave: Optional[str] = None):
    """Get metrics for caves"""
    results = []
    
    for cave_id, cave_data in caves.items():
        if namespace != "*" and cave_data["namespace"] != namespace:
            continue
        if cave and cave_data["cave"] != cave:
            continue
        
        try:
            container = docker_client.containers.get(cave_data["container_id"])
            stats = container.stats(stream=False)
            
            results.append({
                "name": cave_data["cave"],
                "namespace": cave_data["namespace"],
                "running": container.status == "running",
                "cpu_usage": stats.get("cpu_stats", {}).get("cpu_usage", {}).get("total_usage", 0),
                "memory_usage": stats.get("memory_stats", {}).get("usage", 0) / (1024*1024),  # MB
                "disk_usage": 0  # TODO: implement
            })
        except:
            results.append({
                "name": cave_data["cave"],
                "namespace": cave_data["namespace"],
                "running": False
            })
    
    return {"caves": results}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("GHOST_PORT", 5905))
    uvicorn.run(app, host="0.0.0.0", port=port)
