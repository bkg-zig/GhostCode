import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


API_KEY = os.getenv("GHOST_API_KEY", "dev-key")
MAX_CODE_BYTES = int(os.getenv("GHOST_MAX_CODE_BYTES", "131072"))  # 128 KiB default
SUPPORTED_LANGS = {"python"}


class ExecuteRequest(BaseModel):
    cave_id: str = Field(..., min_length=1, max_length=128)
    language: str = Field("python", min_length=1, max_length=32)
    code: str = Field(..., min_length=1)

    @property
    def language_normalized(self) -> str:
        return self.language.strip().lower()


@dataclass
class JobState:
    job_id: str
    cave_id: str
    language: str
    created_at: float = field(default_factory=time.time)
    history: List[str] = field(default_factory=list)
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    finished: asyncio.Event = field(default_factory=asyncio.Event)
    return_code: Optional[int] = None
    error: Optional[str] = None
    subscribers: int = 0

    async def publish(self, payload: dict) -> None:
        message = json.dumps(payload)
        self.history.append(message)
        if self.subscribers > 0:
            await self.queue.put(message)


jobs: Dict[str, JobState] = {}

app = FastAPI(title="Ghost Code Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validate_authorization(authorization: Optional[str]) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid bearer token")


def _build_command(language: str, code: str) -> List[str]:
    lang = language.lower()
    if lang == "python":
        return ["python3", "-u", "-c", code]
    raise HTTPException(status_code=400, detail=f"Unsupported language '{language}'")


async def _run_job(job: JobState, request: ExecuteRequest) -> None:
    try:
        cmd = _build_command(request.language_normalized, request.code)
        await job.publish(
            {
                "type": "status",
                "stage": "starting",
                "jobId": job.job_id,
                "language": request.language_normalized,
            }
        )

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async def _pipe_stream(stream, stream_name: str) -> None:
            assert stream is not None
            while True:
                chunk = await stream.readline()
                if not chunk:
                    break
                await job.publish(
                    {
                        "type": "log",
                        "stream": stream_name,
                        "data": chunk.decode("utf-8", errors="replace"),
                        "timestamp": time.time(),
                    }
                )

        stdout_task = asyncio.create_task(_pipe_stream(process.stdout, "stdout"))
        stderr_task = asyncio.create_task(_pipe_stream(process.stderr, "stderr"))

        await asyncio.gather(stdout_task, stderr_task)
        return_code = await process.wait()
        job.return_code = return_code

        await job.publish(
            {
                "type": "status",
                "stage": "finished",
                "returnCode": return_code,
                "jobId": job.job_id,
            }
        )
    except Exception as exc:  # pragma: no cover - defensive
        job.error = str(exc)
        await job.publish(
            {
                "type": "status",
                "stage": "error",
                "error": job.error,
                "jobId": job.job_id,
            }
        )
    finally:
        job.finished.set()


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "timestamp": time.time()}


@app.post("/api/caves/execute")
async def execute(
    request: ExecuteRequest, authorization: Optional[str] = Header(default=None)
) -> dict:
    _validate_authorization(authorization)

    if request.language_normalized not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail="Language not supported yet")

    if len(request.code.encode("utf-8")) > MAX_CODE_BYTES:
        raise HTTPException(status_code=413, detail="Code payload too large")

    job_id = str(uuid.uuid4())
    job = JobState(job_id=job_id, cave_id=request.cave_id, language=request.language_normalized)
    jobs[job_id] = job

    asyncio.create_task(_run_job(job, request))

    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}")
async def job_status(job_id: str, authorization: Optional[str] = Header(default=None)) -> dict:
    _validate_authorization(authorization)
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "jobId": job.job_id,
        "caveId": job.cave_id,
        "language": job.language,
        "createdAt": job.created_at,
        "returnCode": job.return_code,
        "error": job.error,
        "finished": job.finished.is_set(),
    }


@app.websocket("/ws/logs/{job_id}")
async def websocket_logs(websocket: WebSocket, job_id: str) -> None:
    job = jobs.get(job_id)
    if not job:
        await websocket.close(code=4404)
        return

    await websocket.accept()
    job.subscribers += 1
    try:
        # Replay history first
        for message in job.history:
            await websocket.send_text(message)

        while True:
            if job.finished.is_set() and job.queue.empty():
                break
            try:
                message = await asyncio.wait_for(job.queue.get(), timeout=1)
            except asyncio.TimeoutError:
                continue
            await websocket.send_text(message)
    except WebSocketDisconnect:
        pass
    finally:
        job.subscribers -= 1
        if job.subscribers <= 0 and job.finished.is_set():
            jobs.pop(job_id, None)
        try:
            await websocket.close()
        except RuntimeError:
            # Already closed
            pass
