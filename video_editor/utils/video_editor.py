"""
Video editing utilities for cutting and processing video clips.
"""

import os
import tempfile
from typing import List, Tuple, Optional

from moviepy import (
    VideoFileClip,
    concatenate_videoclips,
    AudioFileClip
)
from pydub import AudioSegment
from pydub.silence import detect_silence


def cut_segments(
    video_path: str,
    segments_to_keep: List[Tuple[float, float]],
    output_path: Optional[str] = None
) -> str:
    """
    Cut video keeping only specified segments.
    
    Args:
        video_path: Path to the input video
        segments_to_keep: List of (start, end) time tuples to keep
        output_path: Optional output path
        
    Returns:
        Path to the edited video
    """
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
    
    video = VideoFileClip(video_path)
    
    clips = []
    for start, end in segments_to_keep:
        # Clamp to video duration
        start = max(0, start)
        end = min(video.duration, end)
        if start < end:
            clip = video.subclip(start, end)
            clips.append(clip)
    
    if not clips:
        video.close()
        raise ValueError("No segments to keep")
    
    final = concatenate_videoclips(clips, method="compose")
    final.write_videofile(
        output_path,
        codec="libx264",
        audio_codec="aac",
        verbose=False,
        logger=None
    )
    
    # Cleanup
    final.close()
    for clip in clips:
        clip.close()
    video.close()
    
    return output_path


def detect_silence_ranges(
    audio_path: str,
    min_silence_len: int = 500,
    silence_thresh: int = -40
) -> List[Tuple[float, float]]:
    """
    Detect silent parts in audio.
    
    Args:
        audio_path: Path to audio file
        min_silence_len: Minimum silence length in milliseconds
        silence_thresh: Silence threshold in dB
        
    Returns:
        List of (start, end) time tuples for silent parts (in seconds)
    """
    audio = AudioSegment.from_file(audio_path)
    
    silent_ranges = detect_silence(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=silence_thresh
    )
    
    # Convert milliseconds to seconds
    return [(start / 1000.0, end / 1000.0) for start, end in silent_ranges]


def invert_ranges(
    silence_ranges: List[Tuple[float, float]],
    total_duration: float
) -> List[Tuple[float, float]]:
    """
    Invert time ranges to get non-silent parts.
    
    Args:
        silence_ranges: List of (start, end) silent ranges
        total_duration: Total audio/video duration
        
    Returns:
        List of (start, end) tuples for non-silent parts
    """
    if not silence_ranges:
        return [(0, total_duration)]
    
    # Sort by start time
    sorted_ranges = sorted(silence_ranges, key=lambda x: x[0])
    
    non_silent = []
    prev_end = 0
    
    for start, end in sorted_ranges:
        if prev_end < start:
            non_silent.append((prev_end, start))
        prev_end = max(prev_end, end)
    
    if prev_end < total_duration:
        non_silent.append((prev_end, total_duration))
    
    return non_silent


def remove_silence(
    video_path: str,
    min_silence_len: int = 500,
    silence_thresh: int = -40,
    output_path: Optional[str] = None
) -> Tuple[str, List[Tuple[float, float]]]:
    """
    Remove silent parts from video.
    
    Args:
        video_path: Path to input video
        min_silence_len: Minimum silence length in ms
        silence_thresh: Silence threshold in dB
        output_path: Optional output path
        
    Returns:
        Tuple of (output_path, detected_silence_ranges)
    """
    from .transcription import extract_audio
    
    # Extract audio for silence detection
    audio_path = extract_audio(video_path)
    
    try:
        # Detect silence
        silence_ranges = detect_silence_ranges(
            audio_path,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh
        )
        
        # Get video duration
        video = VideoFileClip(video_path)
        duration = video.duration
        video.close()
        
        # Get non-silent ranges
        keep_ranges = invert_ranges(silence_ranges, duration)
        
        # Cut video
        if keep_ranges:
            result_path = cut_segments(video_path, keep_ranges, output_path)
        else:
            result_path = video_path
            
        return result_path, silence_ranges
        
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)


def get_video_info(video_path: str) -> dict:
    """
    Get video metadata.
    
    Args:
        video_path: Path to video file
        
    Returns:
        Dictionary with duration, size, fps
    """
    video = VideoFileClip(video_path)
    info = {
        "duration": video.duration,
        "size": video.size,
        "fps": video.fps
    }
    video.close()
    return info
