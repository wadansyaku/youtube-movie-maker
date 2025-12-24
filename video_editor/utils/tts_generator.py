"""
Text-to-Speech generation utilities using gTTS.
"""

import os
import tempfile
import re
from typing import List, Tuple, Optional

from gtts import gTTS
from pydub import AudioSegment


def split_script(text: str) -> List[str]:
    """
    Split script text into sentences.
    
    Args:
        text: Input text to split
        
    Returns:
        List of sentences
    """
    # Split on sentence-ending punctuation
    # Handles Japanese and English punctuation
    sentences = re.split(r'(?<=[。．.!?！？])\s*', text.strip())
    
    # Filter empty strings and strip whitespace
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences


def generate_audio_segment(
    text: str,
    output_path: Optional[str] = None,
    language: str = "ja"
) -> str:
    """
    Generate audio from text using gTTS.
    
    Args:
        text: Text to convert to speech
        output_path: Optional output file path
        language: Language code (ja, en, etc.)
        
    Returns:
        Path to generated audio file
    """
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
    
    tts = gTTS(text=text, lang=language, slow=False)
    tts.save(output_path)
    
    return output_path


def get_audio_duration(audio_path: str) -> float:
    """
    Get duration of an audio file in seconds.
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        Duration in seconds
    """
    audio = AudioSegment.from_file(audio_path)
    return len(audio) / 1000.0


def generate_script_audio(
    script: str,
    language: str = "ja",
    output_dir: Optional[str] = None
) -> List[Tuple[str, str, float]]:
    """
    Generate audio for each sentence in a script.
    
    Args:
        script: Full script text
        language: Language code
        output_dir: Optional directory for output files
        
    Returns:
        List of (sentence, audio_path, duration) tuples
    """
    if output_dir is None:
        output_dir = tempfile.mkdtemp()
    
    sentences = split_script(script)
    results = []
    
    for i, sentence in enumerate(sentences):
        output_path = os.path.join(output_dir, f"audio_{i:03d}.mp3")
        generate_audio_segment(sentence, output_path, language)
        duration = get_audio_duration(output_path)
        results.append((sentence, output_path, duration))
    
    return results


def concatenate_audio(
    audio_paths: List[str],
    output_path: Optional[str] = None,
    gap_ms: int = 500
) -> str:
    """
    Concatenate multiple audio files with optional gaps.
    
    Args:
        audio_paths: List of audio file paths
        output_path: Optional output path
        gap_ms: Gap between segments in milliseconds
        
    Returns:
        Path to concatenated audio file
    """
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
    
    combined = AudioSegment.empty()
    gap = AudioSegment.silent(duration=gap_ms)
    
    for i, path in enumerate(audio_paths):
        audio = AudioSegment.from_file(path)
        combined += audio
        if i < len(audio_paths) - 1:
            combined += gap
    
    combined.export(output_path, format="mp3")
    return output_path
