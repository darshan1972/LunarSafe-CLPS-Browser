"""
LunarSafe AI Sidecar — FastAPI Server
Team Rocket · AEROX Club · Parul University
Project Head: DARSHAN BAGUL (PATIL)

Runs on port 8000. Called by the TypeScript LunarSafe backend for 
external YOLO-based crater and boulder detection benchmarks.

IMPORTANT: This is a BENCHMARK service. Its output is NOT part of the 
deterministic hash chain. It is for comparison only and cannot modify 
any LunarSafe hazard classification or landing decision.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
import tempfile
import uvicorn

from model_loader import load_model, detect_hazards


app = FastAPI(
    title="LunarSafe AI Sidecar",
    description="External YOLO benchmark for lunar crater/boulder detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Check if model is loaded and service is ready."""
    try:
        model = load_model()
        names = model.names
        return {
            "status": "ok",
            "model": str(type(model).__name__),
            "classes": (names.tolist() if hasattr(names, "tolist") else names),
            "device": "cpu",
            "note": "External YOLO benchmark — not part of deterministic hash chain",
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": str(e)},
        )


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """Run YOLO crater/boulder detection on an uploaded image."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    suffix = Path(file.filename).suffix or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = detect_hazards(tmp_path)
        return {
            "status": "ok",
            "filename": file.filename,
            "source": "EXTERNAL_YOLO_BENCHMARK",
            "note": "Not part of deterministic hash chain",
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass


@app.post("/upscale")
async def upscale(file: UploadFile = File(...)):
    """Placeholder for super-resolution (not implemented in v1)."""
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "message": "Super-resolution will be added in Phase 8.",
        },
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
