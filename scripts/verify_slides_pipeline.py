"""
Minimal end-to-end check for Dynamic Slides.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(ROOT_DIR))

from video_editor.utils.slides import render_deck  # noqa: E402
from video_editor.utils.slides_exporter import package_slide_deck  # noqa: E402
from video_editor.utils.video_generator import generate_video_from_slides  # noqa: E402


def main() -> int:
    spec_path = ROOT_DIR / "slides" / "spec.yml"
    if not spec_path.exists():
        print(f"Spec not found: {spec_path}")
        return 1

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    slides_dir = ROOT_DIR / "out" / f"slides_e2e_{timestamp}"
    video_path = ROOT_DIR / "out" / f"video_e2e_{timestamp}.mp4"

    result = render_deck(
        str(spec_path),
        str(slides_dir),
        template=None,
        emit_svg=False
    )

    slide_paths = [slide["pngPath"] for slide in result["slides"]]
    durations = [slide["durationSec"] for slide in result["slides"]]

    generate_video_from_slides(
        slide_paths,
        durations=durations,
        output_path=str(video_path),
        audio_path=result.get("meta", {}).get("audio")
    )

    archive_path = package_slide_deck(
        str(slides_dir),
        str(ROOT_DIR / "out" / "slides_packages"),
        spec_path=str(spec_path),
    )

    if not video_path.exists():
        print("Video output not found")
        return 1

    if not archive_path.exists():
        print("Slides archive not found")
        return 1

    print(f"Slides: {slides_dir}")
    print(f"Video: {video_path}")
    print(f"Archive: {archive_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
