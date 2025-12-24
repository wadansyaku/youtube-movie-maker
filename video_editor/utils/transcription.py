"""
Transcription utilities using faster-whisper for speech-to-text.
"""

import os
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import pandas as pd
from moviepy import VideoFileClip


def extract_audio(video_path: str, output_path: Optional[str] = None) -> str:
    """
    Extract audio from a video file.
    
    Args:
        video_path: Path to the input video file
        output_path: Optional path for the output audio file
        
    Returns:
        Path to the extracted audio file
    """
    if output_path is None:
        # Create temp file
        fd, output_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
    
    video = VideoFileClip(video_path)
    video.audio.write_audiofile(output_path, verbose=False, logger=None)
    video.close()
    
    return output_path


def transcribe_audio(
    audio_path: str,
    model_size: str = "base",
    language: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Transcribe audio using faster-whisper.
    
    Args:
        audio_path: Path to the audio file
        model_size: Whisper model size (tiny, base, small, medium, large)
        language: Optional language code (e.g., 'ja' for Japanese, 'en' for English)
        
    Returns:
        List of segments with text, start, and end times
    """
    from faster_whisper import WhisperModel
    
    # Use CPU by default, can be changed to 'cuda' for GPU
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    segments_list = []
    segments, info = model.transcribe(
        audio_path,
        language=language,
        word_timestamps=False
    )
    
    for segment in segments:
        segments_list.append({
            "id": segment.id,
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
    
    return segments_list


def format_segments_to_df(segments: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert transcription segments to an editable DataFrame.
    
    Args:
        segments: List of segment dictionaries
        
    Returns:
        DataFrame with columns: id, start, end, text, include
    """
    if not segments:
        return pd.DataFrame(columns=["id", "start", "end", "text", "include"])
    
    df = pd.DataFrame(segments)
    df["include"] = True  # Default: include all segments
    
    # Format times for display
    df["start_str"] = df["start"].apply(format_time)
    df["end_str"] = df["end"].apply(format_time)
    
    return df


def format_time(seconds: float) -> str:
    """
    Format seconds to MM:SS.ms format.
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Formatted time string
    """
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes:02d}:{secs:05.2f}"


def parse_time(time_str: str) -> float:
    """
    Parse MM:SS.ms format to seconds.
    
    Args:
        time_str: Time string in MM:SS.ms format
        
    Returns:
        Time in seconds
    """
    parts = time_str.split(":")
    if len(parts) == 2:
        minutes, seconds = parts
        return int(minutes) * 60 + float(seconds)
    return float(time_str)


def get_segments_to_keep(df: pd.DataFrame) -> List[Tuple[float, float]]:
    """
    Get list of time ranges to keep based on DataFrame include column.
    
    Args:
        df: DataFrame with include column
        
    Returns:
        List of (start, end) tuples for segments to keep
    """
    included = df[df["include"] == True]
    return [(row["start"], row["end"]) for _, row in included.iterrows()]
