#!/usr/bin/env python3
"""Deterministic per-post blog cover generator for the RBX Journal.

Same visual language as the site OG card (`generate-og-image.py`): dark
gradient, faint grid, cyan accent, logo mark, DejaVu type. Unlike that script
this one is parameterized per post — title, kicker and slug in, a 1200x630
JPEG out — so a cover can be produced without an external image model.

The output is deterministic: identical inputs (and fonts) yield an identical
image, byte-for-byte-stable enough for review. Upload is a separate step and
needs S3 credentials the operator holds:

    python3 scripts/generate-cover.py \
        --title "When the environment says stop" \
        --kicker "Journal · Operator Edge" \
        --slug 2026-08-23-backpressure-fronteira-de-governanca \
        --out /tmp/cover-backpressure.jpg
    ./scripts/blog-cover-upload.sh /tmp/cover-backpressure.jpg <slug>
"""
from __future__ import annotations

import argparse

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630
BG = "#07080a"
CYAN = "#22e5e5"
FG = "#ececec"
FG_MUTED = "#b8bcc2"
BORDER = "#24282e"
GRID = "#0b1218"

MARGIN = 80
BRAND_URL = "rbxsystems.ch · rbx.ia.br"

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def _gradient(draw: ImageDraw.ImageDraw) -> None:
    for y in range(HEIGHT):
        f = y / HEIGHT
        draw.line(
            [(0, y), (WIDTH, y)],
            fill=(int(7 + f * 8), int(8 + f * 9), int(10 + f * 10)),
        )


def _grid(draw: ImageDraw.ImageDraw, step: int = 60) -> None:
    for x in range(0, WIDTH, step):
        draw.line([(x, 0), (x, HEIGHT)], fill=GRID, width=1)
    for y in range(0, HEIGHT, step):
        draw.line([(0, y), (WIDTH, y)], fill=GRID, width=1)


def _mark(draw: ImageDraw.ImageDraw, x: int, y: int, size: int = 72) -> None:
    """The stylised RBX square with a corner cutout."""
    draw.rectangle([x, y, x + size, y + size], fill=CYAN, outline=CYAN)
    draw.rectangle(
        [x + size // 2, y, x + size, y + size // 2], fill=BG, outline=CYAN
    )


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for w in words:
        trial = f"{line} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def render(title: str, kicker: str, out_path: str) -> str:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)

    _gradient(draw)
    _grid(draw)
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=BORDER, width=2)
    draw.rectangle([MARGIN, MARGIN, WIDTH - MARGIN, MARGIN + 2], fill=CYAN)

    _mark(draw, MARGIN, MARGIN + 34)

    f_kicker = _font(MONO, 26)
    f_url = _font(MONO, 26)

    # Kicker, aligned to the right of the logo mark.
    draw.text((MARGIN + 100, MARGIN + 52), kicker.upper(), font=f_kicker, fill=CYAN)

    # Title: shrink to fit at most 3 lines within the content width.
    max_w = WIDTH - 2 * MARGIN
    for size in (92, 82, 72, 64, 56):
        f_title = _font(BOLD, size)
        lines = _wrap(draw, title, f_title, max_w)
        if len(lines) <= 3:
            break
    line_h = int(size * 1.14)
    block_h = line_h * len(lines)
    y = HEIGHT - MARGIN - 70 - block_h
    for ln in lines:
        draw.text((MARGIN, y), ln, font=f_title, fill=FG)
        y += line_h

    draw.text((MARGIN, HEIGHT - MARGIN - 34), BRAND_URL, font=f_url, fill=FG_MUTED)

    img.save(out_path, "JPEG", quality=92)
    print(f"Saved {out_path} ({WIDTH}x{HEIGHT})")
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate a 1200x630 RBX Journal cover.")
    ap.add_argument("--title", required=True, help="Post title (wrapped to fit).")
    ap.add_argument("--kicker", default="RBX Journal", help="Small eyebrow above the title.")
    ap.add_argument("--slug", help="Post slug; defaults the output filename when --out is omitted.")
    ap.add_argument("--out", help="Output path (default: /tmp/cover-<slug>.jpg).")
    args = ap.parse_args()

    out = args.out or f"/tmp/cover-{args.slug or 'rbx-post'}.jpg"
    render(args.title, args.kicker, out)


if __name__ == "__main__":
    main()
