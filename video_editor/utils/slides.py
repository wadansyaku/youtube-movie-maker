"""
Slide rendering utilities (YAML/JSON -> SVG/PNG via Node + Satori).
"""

import json
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

ROOT_DIR = Path(__file__).resolve().parents[2]
CLI_PATH = ROOT_DIR / "slides" / "cli.mjs"


def render_deck(
    spec_path: str,
    output_dir: str,
    template: Optional[str] = None,
    emit_svg: bool = False
) -> Dict[str, Any]:
    """
    Render slides via Node CLI and return manifest dict.
    """
    cmd = [
        "node",
        str(CLI_PATH),
        "--spec",
        spec_path,
        "--out",
        output_dir
    ]

    if template:
        cmd.extend(["--template", template])
    if emit_svg:
        cmd.append("--emit-svg")

    result = subprocess.run(
        cmd,
        cwd=ROOT_DIR,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"Slide render failed: {result.stderr.strip() or result.stdout.strip()}"
        )

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Slide render returned invalid JSON") from exc


def load_deck_manifest(slides_dir: str) -> Dict[str, Any]:
    """
    Load deck.json manifest from a rendered slides directory.
    """
    manifest_path = Path(slides_dir) / "deck.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    with manifest_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)
