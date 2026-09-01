#!/usr/bin/env python3
"""Deterministic cover generator for 2026-08-31-engenharia-de-loop.

Emits blog-covers-src/2026-08-31-engenharia-de-loop.svg (committed source)
and, when Pillow is available, the 1200x630 PNG for upload. Every geometry
value derives from DATA below (the real findings-per-round series of the
ADR 0006 Checkpoint A review); there is no randomness and no text, per the
Pattern A cover contract (abstract, dark, brand-consistent, no text).

Usage: python3 blog-covers-src/2026-08-31-engenharia-de-loop.gen.py [png-out]
"""
import sys
from pathlib import Path

# Findings per round, rounds 1..58 (round 58 passed with zero).
DATA = [12, 7, 6, 7, 5, 5, 8, 5, 5, 4, 5, 6, 2, 3, 2, 4, 4, 5, 5, 5,
        3, 2, 3, 4, 5, 4, 4, 5, 7, 6, 8, 5, 5, 7, 4, 6, 5, 5, 5, 4,
        5, 3, 4, 4, 3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 3, 2, 0]
# Rounds where a deliberate design withdrawal happened.
WITHDRAWALS = {19, 20, 21, 30, 31, 34, 40, 45}

W, H = 1200, 630
BG = "#0B100E"          # dark ground
BAR = "#A34A2A"         # findings rust
BAR_DIM = "#6B3B28"     # secondary rust for non-withdrawal bars
DOT = "#4CC38A"         # pass green
GRID = "#1C2620"        # faint grid

PAD_X, BASE_Y, TOP_Y = 90, 508, 150
MAXV = 12
N = len(DATA)
GAP = 4.0
BW = (W - 2 * PAD_X - GAP * (N - 1)) / N


def bars():
    out = []
    for i, v in enumerate(DATA):
        r = i + 1
        x = PAD_X + i * (BW + GAP)
        if v > 0:
            h = (v / MAXV) * (BASE_Y - TOP_Y)
            fill = BAR if r in WITHDRAWALS else BAR_DIM
            out.append((round(x, 2), round(BASE_Y - h, 2), round(BW, 2),
                        round(h, 2), fill, False))
        else:  # the passing round: an open green outline where a bar would be
            out.append((round(x, 2), BASE_Y - 64, round(BW, 2), 64, DOT, True))
    return out


def svg():
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="{BG}"/>',
    ]
    for gy in (TOP_Y, (TOP_Y + BASE_Y) // 2):
        parts.append(f'<line x1="{PAD_X}" y1="{gy}" x2="{W - PAD_X}" '
                     f'y2="{gy}" stroke="{GRID}" stroke-width="1"/>')
    parts.append(f'<line x1="{PAD_X}" y1="{BASE_Y}" x2="{W - PAD_X}" '
                 f'y2="{BASE_Y}" stroke="{DOT}" stroke-width="2" '
                 f'opacity="0.55"/>')
    for x, y, w, h, fill, outline in bars():
        if outline:
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
                         f'rx="2" fill="none" stroke="{fill}" '
                         f'stroke-width="3"/>')
        else:
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
                         f'rx="2" fill="{fill}"/>')
    for i in range(N):
        if (i + 1) in WITHDRAWALS:
            cx = PAD_X + i * (BW + GAP) + BW / 2
            parts.append(f'<circle cx="{round(cx, 2)}" cy="{BASE_Y + 26}" '
                         f'r="7" fill="{DOT}"/>')
    parts.append('</svg>')
    return "\n".join(parts)


def png(path):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    for gy in (TOP_Y, (TOP_Y + BASE_Y) // 2):
        d.line([(PAD_X, gy), (W - PAD_X, gy)], fill=GRID, width=1)
    d.line([(PAD_X, BASE_Y), (W - PAD_X, BASE_Y)], fill="#2E7355", width=2)
    for x, y, w, h, fill, outline in bars():
        box = [x, y, x + w, y + h]
        if outline:
            d.rounded_rectangle(box, radius=2, outline=fill, width=3)
        else:
            d.rounded_rectangle(box, radius=2, fill=fill)
    for i in range(N):
        if (i + 1) in WITHDRAWALS:
            cx = PAD_X + i * (BW + GAP) + BW / 2
            d.ellipse([cx - 7, BASE_Y + 19, cx + 7, BASE_Y + 33], fill=DOT)
    im.save(path, "PNG")


if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    (here / "2026-08-31-engenharia-de-loop.svg").write_text(svg() + "\n")
    print("svg written")
    out = sys.argv[1] if len(sys.argv) > 1 else None
    if out:
        png(out)
        print(f"png written: {out}")
