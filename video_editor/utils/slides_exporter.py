"""
Export utilities for slide decks.
"""

import json
import zipfile
from pathlib import Path
from typing import Optional, Dict, Any


def load_deck(slides_dir: str) -> Dict[str, Any]:
    deck_path = Path(slides_dir) / "deck.json"
    if not deck_path.exists():
        raise FileNotFoundError(f"Deck manifest not found: {deck_path}")

    with deck_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def package_slide_deck(
    slides_dir: str,
    output_dir: str,
    spec_path: Optional[str] = None
) -> Path:
    """
    Package a rendered slide deck into a zip archive.
    """
    slides_path = Path(slides_dir)
    if not slides_path.exists():
        raise FileNotFoundError(f"Slides directory not found: {slides_path}")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    archive_name = f"{slides_path.name}.zip"
    archive_path = output_path / archive_name

    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in slides_path.rglob("*"):
            if file_path.is_file():
                arcname = f"{slides_path.name}/{file_path.relative_to(slides_path)}"
                archive.write(file_path, arcname)

        if spec_path:
            spec_file = Path(spec_path)
            if spec_file.exists() and spec_file.is_file():
                spec_name = f"{slides_path.name}/spec{spec_file.suffix}"
                archive.write(spec_file, spec_name)

    return archive_path
