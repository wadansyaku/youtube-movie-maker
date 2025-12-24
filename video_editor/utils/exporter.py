"""
Export utilities for rendering and downloading videos.
"""

import os
import tempfile
from typing import Optional
import shutil


def get_temp_dir() -> str:
    """
    Get or create a temporary directory for exports.
    
    Returns:
        Path to temp directory
    """
    temp_dir = os.path.join(tempfile.gettempdir(), "video_editor_exports")
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir


def get_temp_path(suffix: str = ".mp4") -> str:
    """
    Generate a unique temporary file path.
    
    Args:
        suffix: File extension
        
    Returns:
        Path to temp file
    """
    temp_dir = get_temp_dir()
    fd, path = tempfile.mkstemp(suffix=suffix, dir=temp_dir)
    os.close(fd)
    return path


def cleanup_temp_files(max_age_hours: int = 24) -> int:
    """
    Clean up old temporary files.
    
    Args:
        max_age_hours: Maximum age of files to keep
        
    Returns:
        Number of files deleted
    """
    import time
    
    temp_dir = get_temp_dir()
    deleted = 0
    now = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(temp_dir):
        filepath = os.path.join(temp_dir, filename)
        if os.path.isfile(filepath):
            age = now - os.path.getmtime(filepath)
            if age > max_age_seconds:
                try:
                    os.remove(filepath)
                    deleted += 1
                except:
                    pass
    
    return deleted


def prepare_download(
    video_path: str,
    filename: str = "exported_video.mp4"
) -> bytes:
    """
    Read video file and return bytes for download.
    
    Args:
        video_path: Path to video file
        filename: Suggested filename for download
        
    Returns:
        Video file contents as bytes
    """
    with open(video_path, "rb") as f:
        return f.read()


def copy_to_output(
    source_path: str,
    output_dir: str,
    filename: Optional[str] = None
) -> str:
    """
    Copy video to output directory.
    
    Args:
        source_path: Source video path
        output_dir: Output directory
        filename: Optional output filename
        
    Returns:
        Path to copied file
    """
    os.makedirs(output_dir, exist_ok=True)
    
    if filename is None:
        filename = os.path.basename(source_path)
    
    output_path = os.path.join(output_dir, filename)
    shutil.copy2(source_path, output_path)
    
    return output_path
