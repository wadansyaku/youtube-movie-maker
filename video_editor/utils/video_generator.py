"""
Video generation utilities for creating videos from text scripts.
"""

import os
import tempfile
from typing import List, Tuple, Optional
import random

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    TextClip,
    concatenate_videoclips
)


# Default video dimensions (1080p)
DEFAULT_WIDTH = 1920
DEFAULT_HEIGHT = 1080
DEFAULT_FPS = 24
DEFAULT_SLIDE_DURATION = 5


def get_random_color() -> Tuple[int, int, int]:
    """
    Generate a random background color (avoiding too dark/light).
    
    Returns:
        RGB tuple
    """
    return (
        random.randint(50, 200),
        random.randint(50, 200),
        random.randint(50, 200)
    )


def create_background_image(
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    color: Optional[Tuple[int, int, int]] = None
) -> Image.Image:
    """
    Create a solid color background image.
    
    Args:
        width: Image width
        height: Image height
        color: Optional RGB color tuple
        
    Returns:
        PIL Image object
    """
    if color is None:
        color = get_random_color()
    
    image = Image.new("RGB", (width, height), color)
    return image


def create_gradient_background(
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    color1: Optional[Tuple[int, int, int]] = None,
    color2: Optional[Tuple[int, int, int]] = None
) -> Image.Image:
    """
    Create a gradient background image.
    
    Args:
        width: Image width
        height: Image height
        color1: Top color (optional)
        color2: Bottom color (optional)
        
    Returns:
        PIL Image object
    """
    if color1 is None:
        color1 = get_random_color()
    if color2 is None:
        color2 = get_random_color()
    
    image = Image.new("RGB", (width, height))
    
    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        
        for x in range(width):
            image.putpixel((x, y), (r, g, b))
    
    return image


def create_text_overlay(
    text: str,
    duration: float,
    size: Tuple[int, int] = (DEFAULT_WIDTH, DEFAULT_HEIGHT),
    fontsize: int = 48,
    color: str = "white",
    bg_color: Optional[str] = "black",
    position: str = "bottom"
) -> TextClip:
    """
    Create a text overlay clip for subtitles.
    
    Args:
        text: Text to display
        duration: Duration in seconds
        size: Video size tuple
        fontsize: Font size
        color: Text color
        bg_color: Background color (None for transparent)
        position: Position ('bottom', 'center', 'top')
        
    Returns:
        MoviePy TextClip
    """
    txt_clip = TextClip(
        text,
        fontsize=fontsize,
        color=color,
        bg_color=bg_color,
        size=(size[0] - 100, None),
        method="caption"
    ).set_duration(duration)
    
    # Position the text
    if position == "bottom":
        txt_clip = txt_clip.set_position(("center", size[1] - 150))
    elif position == "center":
        txt_clip = txt_clip.set_position("center")
    else:
        txt_clip = txt_clip.set_position(("center", 50))
    
    return txt_clip


def assemble_video(
    segments: List[Tuple[str, str, float]],
    output_path: Optional[str] = None,
    size: Tuple[int, int] = (DEFAULT_WIDTH, DEFAULT_HEIGHT),
    fps: int = DEFAULT_FPS,
    add_subtitles: bool = True
) -> str:
    """
    Assemble video from text and audio segments.
    
    Args:
        segments: List of (text, audio_path, duration) tuples
        output_path: Optional output path
        size: Video dimensions
        fps: Frames per second
        add_subtitles: Whether to add subtitle overlays
        
    Returns:
        Path to generated video
    """
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
    
    clips = []
    
    for i, (text, audio_path, duration) in enumerate(segments):
        # Create background
        bg_color = get_random_color()
        bg_image = create_background_image(size[0], size[1], bg_color)
        
        # Save to temp file
        bg_temp = tempfile.mktemp(suffix=".png")
        bg_image.save(bg_temp)
        
        # Create video clip from image
        video_clip = ImageClip(bg_temp).set_duration(duration)
        
        # Add audio
        audio_clip = AudioFileClip(audio_path)
        video_clip = video_clip.set_audio(audio_clip)
        
        # Add subtitle if enabled
        if add_subtitles:
            subtitle = create_text_overlay(text, duration, size)
            video_clip = CompositeVideoClip([video_clip, subtitle])
        
        clips.append(video_clip)
        
        # Cleanup temp file
        try:
            os.remove(bg_temp)
        except:
            pass
    
    # Concatenate all clips
    final_video = concatenate_videoclips(clips, method="compose")
    
    # Write output
    final_video.write_videofile(
        output_path,
        fps=fps,
        codec="libx264",
        audio_codec="aac",
        verbose=False,
        logger=None
    )
    
    # Cleanup
    final_video.close()
    for clip in clips:
        clip.close()
    
    return output_path


def generate_video_from_script(
    script: str,
    language: str = "ja",
    output_path: Optional[str] = None,
    add_subtitles: bool = True
) -> str:
    """
    Generate a complete video from a text script.
    
    Args:
        script: Text script to convert
        language: Language for TTS
        output_path: Optional output path
        add_subtitles: Whether to add subtitles
        
    Returns:
        Path to generated video
    """
    from .tts_generator import generate_script_audio
    
    # Generate audio for each sentence
    segments = generate_script_audio(script, language)
    
    # Assemble video
    video_path = assemble_video(
        segments,
        output_path=output_path,
        add_subtitles=add_subtitles
    )
    
    return video_path


def generate_video_from_slides(
    slide_paths: List[str],
    durations: Optional[List[float]] = None,
    output_path: Optional[str] = None,
    fps: int = DEFAULT_FPS,
    audio_path: Optional[str] = None
) -> str:
    """
    Generate a video from rendered slide images.
    """
    if not slide_paths:
        raise ValueError("No slide images provided")

    if durations is None or len(durations) == 0:
        durations = [DEFAULT_SLIDE_DURATION] * len(slide_paths)

    if len(durations) != len(slide_paths):
        raise ValueError("Durations must match slide count")

    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)

    clips = []
    for slide_path, duration in zip(slide_paths, durations):
        clip = ImageClip(slide_path).set_duration(duration)
        clips.append(clip)

    final_video = concatenate_videoclips(clips, method="compose")

    if audio_path:
        audio_clip = AudioFileClip(audio_path)
        final_video = final_video.set_audio(audio_clip.subclip(0, final_video.duration))

    final_video.write_videofile(
        output_path,
        fps=fps,
        codec="libx264",
        audio_codec="aac",
        verbose=False,
        logger=None
    )

    final_video.close()
    for clip in clips:
        clip.close()

    return output_path
