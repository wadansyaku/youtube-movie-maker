"""
FastAPI Backend for AI Video Editor
====================================

Provides REST API and WebSocket endpoints for video processing.
"""

import os
import mimetypes
import uuid
import asyncio
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import aiofiles

# Import video processing utilities
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.transcription import extract_audio, transcribe_audio, format_segments_to_df
from utils.video_editor import cut_segments, remove_silence, get_video_info
from utils.tts_generator import generate_script_audio
from utils.video_generator import generate_video_from_script, generate_video_from_slides
from utils.slides import render_deck, load_deck_manifest
from utils.slides_exporter import package_slide_deck
from utils.exporter import get_temp_path, cleanup_temp_files


# ========================================
# Configuration
# ========================================

UPLOAD_DIR = Path(tempfile.gettempdir()) / "video_editor_uploads"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "video_editor_outputs"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
SLIDES_OUTPUT_ROOT = PROJECT_ROOT / "out" / "slides"
SLIDES_PACKAGE_ROOT = PROJECT_ROOT / "out" / "slides_packages"
VIDEO_OUTPUT_ROOT = PROJECT_ROOT / "out"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
SLIDES_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
SLIDES_PACKAGE_ROOT.mkdir(parents=True, exist_ok=True)
VIDEO_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Store job progress
job_progress: Dict[str, Dict[str, Any]] = {}


# ========================================
# Pydantic Models
# ========================================

class TranscriptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    include: bool = True


class TranscriptionResponse(BaseModel):
    job_id: str
    segments: List[TranscriptionSegment]
    duration: float
    video_path: str


class EditRequest(BaseModel):
    video_path: str
    segments: List[TranscriptionSegment]


class GenerateRequest(BaseModel):
    script: Optional[str] = None
    language: str = "ja"
    add_subtitles: bool = True
    dynamic_slides: bool = False
    slides_spec_path: Optional[str] = None
    slides_dir: Optional[str] = None
    template: Optional[str] = None


class SilenceRemovalRequest(BaseModel):
    video_path: str
    min_silence_len: int = 500
    silence_thresh: int = -40


class JobResponse(BaseModel):
    job_id: str
    status: str
    progress: int = 0
    message: str = ""
    result_path: Optional[str] = None


class SaveToLibraryRequest(BaseModel):
    video_path: str
    file_name: str
    project_id: Optional[str] = None
    source: str = "video_editor"
    description: Optional[str] = None


class SlideInfo(BaseModel):
    index: int
    title: str
    durationSec: float
    pngPath: str
    svgPath: Optional[str] = None


class SlidesRenderRequest(BaseModel):
    spec_path: str
    template: Optional[str] = None
    emit_svg: bool = False


class SlidesRenderResponse(BaseModel):
    outputDir: str
    slideCount: int
    slides: List[SlideInfo]


class SlidesSaveRequest(BaseModel):
    file_name: str
    slides_dir: Optional[str] = None
    spec_path: Optional[str] = None
    template: Optional[str] = None
    project_id: Optional[str] = None
    source: str = "dynamic_slides"
    description: Optional[str] = None


# Next.js API base URL
NEXTJS_API_BASE = "http://localhost:3000"


# ========================================
# Lifespan & App Setup
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Clean old temp files
    cleanup_temp_files(max_age_hours=24)
    yield
    # Shutdown: Clean temp files
    cleanup_temp_files(max_age_hours=1)


app = FastAPI(
    title="AI Video Editor API",
    description="REST API for video transcription, editing, and generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# Helper Functions
# ========================================

async def update_progress(job_id: str, progress: int, message: str, status: str = "processing"):
    """Update job progress and notify WebSocket clients."""
    job_progress[job_id] = {
        "status": status,
        "progress": progress,
        "message": message
    }
    
    # Send to WebSocket if connected
    if job_id in active_connections:
        try:
            await active_connections[job_id].send_json({
                "job_id": job_id,
                "status": status,
                "progress": progress,
                "message": message
            })
        except:
            pass


def run_sync(coro):
    """Run async code from sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def resolve_project_path(input_path: str) -> Path:
    path = Path(input_path)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    resolved = path.resolve()
    if PROJECT_ROOT not in resolved.parents and resolved != PROJECT_ROOT:
        raise HTTPException(status_code=400, detail="Path must be inside project root")
    return resolved


# ========================================
# API Endpoints
# ========================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Video Editor API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/video/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    allowed_types = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {allowed_types}"
        )
    
    # Generate unique filename
    job_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{job_id}{ext}"
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Get video info
    try:
        info = get_video_info(str(file_path))
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Invalid video file: {str(e)}")
    
    return {
        "job_id": job_id,
        "video_path": str(file_path),
        "filename": file.filename,
        "duration": info["duration"],
        "size": info["size"],
        "fps": info["fps"]
    }


@app.post("/api/video/transcribe", response_model=TranscriptionResponse)
async def transcribe_video(
    video_path: str,
    model_size: str = "base",
    language: Optional[str] = "ja",
    background_tasks: BackgroundTasks = None
):
    """Transcribe video audio to text with timestamps."""
    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    job_id = str(uuid.uuid4())
    
    try:
        # Extract audio
        audio_path = extract_audio(video_path)
        
        # Transcribe
        segments = transcribe_audio(audio_path, model_size, language)
        
        # Get video duration
        info = get_video_info(video_path)
        
        # Cleanup audio file
        Path(audio_path).unlink(missing_ok=True)
        
        # Format segments
        formatted_segments = [
            TranscriptionSegment(
                id=s["id"],
                start=s["start"],
                end=s["end"],
                text=s["text"],
                include=True
            )
            for s in segments
        ]
        
        return TranscriptionResponse(
            job_id=job_id,
            segments=formatted_segments,
            duration=info["duration"],
            video_path=video_path
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/api/video/edit")
async def edit_video(request: EditRequest):
    """Cut video based on selected segments."""
    if not Path(request.video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    job_id = str(uuid.uuid4())
    
    try:
        # Get segments to keep
        segments_to_keep = [
            (s.start, s.end)
            for s in request.segments
            if s.include
        ]
        
        if not segments_to_keep:
            raise HTTPException(status_code=400, detail="No segments selected")
        
        # Cut video
        output_path = str(OUTPUT_DIR / f"{job_id}_edited.mp4")
        cut_segments(request.video_path, segments_to_keep, output_path)
        
        # Get output info
        info = get_video_info(output_path)
        
        return {
            "job_id": job_id,
            "status": "completed",
            "output_path": output_path,
            "duration": info["duration"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")


@app.post("/api/video/remove-silence")
async def remove_video_silence(request: SilenceRemovalRequest):
    """Remove silent parts from video."""
    if not Path(request.video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    job_id = str(uuid.uuid4())
    
    try:
        output_path = str(OUTPUT_DIR / f"{job_id}_no_silence.mp4")
        result_path, silence_ranges = remove_silence(
            request.video_path,
            min_silence_len=request.min_silence_len,
            silence_thresh=request.silence_thresh,
            output_path=output_path
        )
        
        info = get_video_info(result_path)
        
        return {
            "job_id": job_id,
            "status": "completed",
            "output_path": result_path,
            "duration": info["duration"],
            "silence_removed_count": len(silence_ranges),
            "silence_ranges": silence_ranges
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Silence removal failed: {str(e)}")


@app.post("/api/slides/render", response_model=SlidesRenderResponse)
async def render_slides(request: SlidesRenderRequest):
    """Render slide deck to PNGs."""
    spec_path = resolve_project_path(request.spec_path)
    if not spec_path.exists():
        raise HTTPException(status_code=404, detail="Spec file not found")

    job_id = str(uuid.uuid4())
    output_dir = SLIDES_OUTPUT_ROOT / job_id

    try:
        result = render_deck(
            str(spec_path),
            str(output_dir),
            template=request.template,
            emit_svg=request.emit_svg
        )

        slides = [
            SlideInfo(
                index=slide["index"],
                title=slide["title"],
                durationSec=slide["durationSec"],
                pngPath=slide["pngPath"],
                svgPath=slide.get("svgPath")
            )
            for slide in result["slides"]
        ]

        return SlidesRenderResponse(
            outputDir=result["outputDir"],
            slideCount=result["slideCount"],
            slides=slides
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Slide render failed: {str(e)}")


@app.post("/api/slides/save-to-library")
async def save_slides_to_library(request: SlidesSaveRequest):
    """Package slide deck and save to Asset Library."""
    import httpx

    if not request.file_name.strip():
        raise HTTPException(status_code=400, detail="file_name is required")

    if not request.slides_dir and not request.spec_path:
        raise HTTPException(status_code=400, detail="slides_dir or spec_path is required")

    job_id = str(uuid.uuid4())
    spec_path = None

    try:
        if request.slides_dir:
            slides_dir = resolve_project_path(request.slides_dir)
            try:
                manifest = load_deck_manifest(str(slides_dir))
            except FileNotFoundError as exc:
                raise HTTPException(status_code=404, detail=str(exc)) from exc
            if request.spec_path:
                spec_path = resolve_project_path(request.spec_path)
            elif manifest.get("specPath"):
                try:
                    spec_path = resolve_project_path(manifest["specPath"])
                except HTTPException:
                    spec_path = None
        else:
            spec_path = resolve_project_path(request.spec_path)
            output_dir = SLIDES_OUTPUT_ROOT / job_id
            manifest = render_deck(
                str(spec_path),
                str(output_dir),
                template=request.template
            )
            slides_dir = Path(manifest["outputDir"])

        archive_path = package_slide_deck(
            str(slides_dir),
            str(SLIDES_PACKAGE_ROOT),
            spec_path=str(spec_path) if spec_path else None
        )

        file_size = archive_path.stat().st_size
        total_duration = sum(slide["durationSec"] for slide in manifest["slides"])
        resolution = f"{manifest['meta']['width']}x{manifest['meta']['height']}"

        file_name = request.file_name
        if not file_name.lower().endswith(".zip"):
            file_name = f"{file_name}.zip"

        asset_data = {
            "fileName": file_name,
            "filePath": str(archive_path),
            "type": "slides",
            "source": request.source,
            "fileSize": file_size,
            "mimeType": "application/zip",
            "duration": int(total_duration),
            "resolution": resolution,
            "metadata": {
                "slideCount": manifest["slideCount"],
                "slidesDir": str(slides_dir),
                "template": manifest["meta"].get("template"),
                "theme": manifest["meta"].get("theme"),
                "audio": manifest["meta"].get("audio"),
                "specPath": str(spec_path) if spec_path else None,
                "description": request.description or "",
            },
            "generationParams": {
                "specPath": str(spec_path) if spec_path else None,
                "template": manifest["meta"].get("template"),
                "theme": manifest["meta"].get("theme"),
                "slideCount": manifest["slideCount"],
            },
            "platform": "dynamic_slides",
            "projectId": request.project_id,
        }

        async with httpx.AsyncClient() as client:
            asset_response = await client.post(
                f"{NEXTJS_API_BASE}/api/assets",
                json=asset_data,
                timeout=30.0
            )

            if asset_response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=asset_response.status_code,
                    detail=f"Failed to create asset: {asset_response.text}"
                )

            asset = asset_response.json()

        return {
            "status": "success",
            "asset": asset,
            "archive_path": str(archive_path),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save slides failed: {str(e)}")


@app.post("/api/video/generate")
async def generate_video(request: GenerateRequest):
    """Generate video from script text or rendered slides."""
    job_id = str(uuid.uuid4())

    if request.dynamic_slides:
        try:
            if request.slides_dir:
                try:
                    slides_dir = resolve_project_path(request.slides_dir)
                    manifest = load_deck_manifest(str(slides_dir))
                except FileNotFoundError as exc:
                    raise HTTPException(status_code=404, detail=str(exc)) from exc
            elif request.slides_spec_path:
                spec_path = resolve_project_path(request.slides_spec_path)
                output_dir = SLIDES_OUTPUT_ROOT / job_id
                manifest = render_deck(
                    str(spec_path),
                    str(output_dir),
                    template=request.template
                )
            else:
                raise HTTPException(status_code=400, detail="slides_spec_path or slides_dir is required")

            slide_paths = [slide["pngPath"] for slide in manifest["slides"]]
            durations = [slide["durationSec"] for slide in manifest["slides"]]
            audio_path = manifest.get("meta", {}).get("audio")

            output_path = str(VIDEO_OUTPUT_ROOT / f"video_{job_id}.mp4")

            generate_video_from_slides(
                slide_paths,
                durations=durations,
                output_path=output_path,
                audio_path=audio_path
            )

            info = get_video_info(output_path)

            return {
                "job_id": job_id,
                "status": "completed",
                "output_path": output_path,
                "duration": info["duration"],
                "size": info["size"],
                "fps": info["fps"]
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    if not request.script or not request.script.strip():
        raise HTTPException(status_code=400, detail="Script cannot be empty")

    try:
        output_path = str(OUTPUT_DIR / f"{job_id}_generated.mp4")

        generate_video_from_script(
            request.script,
            language=request.language,
            output_path=output_path,
            add_subtitles=request.add_subtitles
        )

        info = get_video_info(output_path)

        return {
            "job_id": job_id,
            "status": "completed",
            "output_path": output_path,
            "duration": info["duration"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/api/video/download/{job_id}")
async def download_video(job_id: str):
    """Download processed video by job ID."""
    search_paths = [
        OUTPUT_DIR / f"{job_id}_edited.mp4",
        OUTPUT_DIR / f"{job_id}_no_silence.mp4",
        OUTPUT_DIR / f"{job_id}_generated.mp4",
        VIDEO_OUTPUT_ROOT / f"video_{job_id}.mp4",
    ]

    for file_path in search_paths:
        if file_path.exists():
            return FileResponse(
                file_path,
                media_type="video/mp4",
                filename=file_path.name
            )
    
    raise HTTPException(status_code=404, detail="Video not found")


@app.get("/api/video/serve")
async def serve_video(path: str):
    """Serve a media file for preview."""
    if not Path(path).exists():
        raise HTTPException(status_code=404, detail="File not found")

    media_type, _ = mimetypes.guess_type(path)
    return FileResponse(path, media_type=media_type or "application/octet-stream")


@app.get("/api/projects")
async def get_projects():
    """Get list of projects from Next.js API for project selection."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NEXTJS_API_BASE}/api/projects")
            if response.status_code == 200:
                data = response.json()
                # Return simplified project list
                projects = data.get("projects", [])
                return {
                    "projects": [
                        {"id": p["id"], "name": p["name"]}
                        for p in projects
                    ]
                }
            return {"projects": []}
    except Exception as e:
        # If Next.js API is not available, return empty list
        return {"projects": [], "error": str(e)}


@app.get("/api/scenes")
async def get_scenes(projectId: str):
    """Get scenes for a project from Next.js API."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{NEXTJS_API_BASE}/api/projects/{projectId}/scenes")
            if response.status_code == 200:
                scenes = response.json()
                return {
                    "scenes": [
                        {"id": s["id"], "name": s["title"], "orderIndex": s.get("orderIndex", 0)}
                        for s in scenes
                    ]
                }
            return {"scenes": []}
    except Exception as e:
        return {"scenes": [], "error": str(e)}


@app.get("/api/shots")
async def get_shots(sceneId: str, projectId: str):
    """Get shots for a scene from Next.js API."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NEXTJS_API_BASE}/api/projects/{projectId}/scenes/{sceneId}/shots"
            )
            if response.status_code == 200:
                shots = response.json()
                return {
                    "shots": [
                        {"id": s["id"], "name": s["name"], "orderIndex": s.get("orderIndex", 0)}
                        for s in shots
                    ]
                }
            return {"shots": []}
    except Exception as e:
        return {"shots": [], "error": str(e)}


@app.post("/api/video/save-to-shot")
async def save_to_shot(
    video_path: str,
    file_name: str,
    shot_id: str,
    project_id: str,
    scene_id: str
):
    """Save video directly to a Shot as ShotAsset."""
    import httpx
    import shutil
    
    if not Path(video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    try:
        # Get video info
        info = get_video_info(video_path)
        file_size = Path(video_path).stat().st_size
        
        # Generate a stable filename for storage
        job_id = str(uuid.uuid4())
        stored_filename = f"{job_id}.mp4"
        stored_path = str(OUTPUT_DIR / stored_filename)
        if video_path != stored_path:
            shutil.copy2(video_path, stored_path)
        
        # First, create the asset
        asset_data = {
            "fileName": file_name,
            "filePath": stored_path,
            "type": "video",
            "source": "video_editor",
            "fileSize": file_size,
            "mimeType": "video/mp4",
            "duration": int(info["duration"]),
            "resolution": f"{info['size'][0]}x{info['size'][1]}",
            "metadata": {
                "fps": info["fps"],
                "editor": "ai_video_editor",
                "shotId": shot_id,
                "sceneId": scene_id
            },
            "projectId": project_id
        }
        
        async with httpx.AsyncClient() as client:
            # Create asset first
            asset_response = await client.post(
                f"{NEXTJS_API_BASE}/api/assets",
                json=asset_data,
                timeout=30.0
            )
            
            if asset_response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=asset_response.status_code,
                    detail=f"Failed to create asset: {asset_response.text}"
                )
            
            asset = asset_response.json()
            asset_id = asset.get("id")
            
            # Link asset to shot
            shot_asset_response = await client.post(
                f"{NEXTJS_API_BASE}/api/projects/{project_id}/scenes/{scene_id}/shots/{shot_id}/assets",
                json={"assetId": asset_id},
                timeout=30.0
            )
            
            return {
                "status": "success",
                "message": "Video saved to shot",
                "asset_id": asset_id,
                "shot_id": shot_id,
                "asset": asset
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save to shot failed: {str(e)}")


@app.post("/api/script/improve")
async def improve_script(script: str, style: str = "casual", target_length: str = "same", language: str = "ja"):
    """Improve script using Next.js Gemini API."""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NEXTJS_API_BASE}/api/ai/improve-script",
                json={
                    "script": script,
                    "style": style,
                    "targetLength": target_length,
                    "language": language
                },
                timeout=60.0  # AI can take time
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=data.get("error", "AI improvement failed")
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI processing timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script improvement failed: {str(e)}")


@app.post("/api/video/save-to-library")
async def save_to_library(request: SaveToLibraryRequest):
    """Save edited video to Asset Library."""
    import httpx
    import shutil
    
    if not Path(request.video_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    try:
        # Get video info
        info = get_video_info(request.video_path)
        file_size = Path(request.video_path).stat().st_size
        
        # Generate a stable filename for storage
        job_id = str(uuid.uuid4())
        stored_filename = f"{job_id}.mp4"
        
        # For now, keep the file in OUTPUT_DIR (in production, upload to S3)
        stored_path = str(OUTPUT_DIR / stored_filename)
        if request.video_path != stored_path:
            shutil.copy2(request.video_path, stored_path)
        
        # Create asset via Next.js API
        asset_data = {
            "fileName": request.file_name,
            "filePath": stored_path,
            "type": "video",
            "source": request.source,
            "fileSize": file_size,
            "mimeType": "video/mp4",
            "duration": int(info["duration"]),
            "resolution": f"{info['size'][0]}x{info['size'][1]}",
            "metadata": {
                "fps": info["fps"],
                "editor": "ai_video_editor",
                "description": request.description or ""
            }
        }
        
        if request.project_id:
            asset_data["projectId"] = request.project_id
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NEXTJS_API_BASE}/api/assets",
                json=asset_data,
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                asset = response.json()
                return {
                    "status": "success",
                    "message": "Asset saved to library",
                    "asset_id": asset.get("id"),
                    "asset": asset
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to save asset: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Next.js API timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a processing job."""
    if job_id in job_progress:
        return job_progress[job_id]
    return {"status": "unknown", "progress": 0, "message": "Job not found"}


# ========================================
# WebSocket for Progress Updates
# ========================================

@app.websocket("/ws/progress/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time progress updates."""
    await websocket.accept()
    active_connections[job_id] = websocket
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        if job_id in active_connections:
            del active_connections[job_id]


# ========================================
# Main
# ========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8502, reload=True)
