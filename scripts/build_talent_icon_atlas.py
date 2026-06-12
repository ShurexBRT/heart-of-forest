#!/usr/bin/env python3
"""Normalize the generated 3x6 talent sheet into a compact game atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


COLS = 3
ROWS = 6
CELL_SIZE = 96
ICON_SIZE = 86


def build_atlas(source_path: Path, output_path: Path) -> None:
    source = Image.open(source_path).convert("RGBA")
    atlas = Image.new("RGBA", (COLS * CELL_SIZE, ROWS * CELL_SIZE), (0, 0, 0, 0))

    for row in range(ROWS):
        top = round(row * source.height / ROWS)
        bottom = round((row + 1) * source.height / ROWS)
        for col in range(COLS):
            left = round(col * source.width / COLS)
            right = round((col + 1) * source.width / COLS)
            cell = source.crop((left, top, right, bottom))
            alpha = cell.getchannel("A")
            bounds = alpha.getbbox()
            if not bounds:
                continue

            icon = cell.crop(bounds)
            icon.thumbnail((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
            paste_x = col * CELL_SIZE + (CELL_SIZE - icon.width) // 2
            paste_y = row * CELL_SIZE + (CELL_SIZE - icon.height) // 2
            atlas.alpha_composite(icon, (paste_x, paste_y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output_path, optimize=True)
    print(f"Wrote {output_path} ({atlas.width}x{atlas.height})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    build_atlas(args.input, args.out)


if __name__ == "__main__":
    main()
