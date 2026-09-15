#!/usr/bin/env python3
"""Render deterministic, text-free covers for the RBX Journal.

The editorial source of truth is ``blog-covers-src/covers.json``. Every post
has a declarative visual specification and is rendered by this shared script;
a separate Python program per post is not required. The generated SVG is the
reviewable source and Chrome rasterizes that exact source for publication.

Examples:

    python3 scripts/generate-cover.py --slug 2026-09-15-the-bottleneck-moved
    python3 scripts/generate-cover.py --all --raster-dir /tmp/rbx-covers
    python3 scripts/generate-cover.py --all --source-only

The default source directory is ``blog-covers-src`` and the default raster
directory is ``/tmp/rbx-journal-covers``. Upload remains a separate, explicit
step through ``scripts/blog-cover-upload.sh``.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

WIDTH = 1200
HEIGHT = 630
ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CATALOG = ROOT / "blog-covers-src" / "covers.json"
DEFAULT_SOURCE_DIR = ROOT / "blog-covers-src"
DEFAULT_RASTER_DIR = Path("/tmp/rbx-journal-covers")

PALETTES = {
    "cyan": ("#22e5e5", "#0e7490"),
    "green": ("#55d98a", "#1f8f63"),
    "violet": ("#9b7cff", "#5b3fb8"),
    "amber": ("#f2b84b", "#a65f24"),
    "red": ("#f06a5f", "#923f3a"),
}


def _attrs(**attrs: object) -> str:
    return " ".join(
        f'{key.replace("_", "-")}="{value}"'
        for key, value in attrs.items()
        if value is not None
    )


def rect(x: float, y: float, w: float, h: float, **attrs: object) -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" {_attrs(**attrs)}/>'


def circle(x: float, y: float, r: float, **attrs: object) -> str:
    return f'<circle cx="{x}" cy="{y}" r="{r}" {_attrs(**attrs)}/>'


def line(x1: float, y1: float, x2: float, y2: float, **attrs: object) -> str:
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {_attrs(**attrs)}/>'


def path(d: str, **attrs: object) -> str:
    return f'<path d="{d}" {_attrs(**attrs)}/>'


def polygon(points: str, **attrs: object) -> str:
    return f'<polygon points="{points}" {_attrs(**attrs)}/>'


def group(items: list[str], **attrs: object) -> str:
    return f'<g {_attrs(**attrs)}>\n' + "\n".join(items) + "\n</g>"


def node(x: float, y: float, accent: str, r: float = 7, halo: bool = False) -> str:
    items = []
    if halo:
        items.append(circle(x, y, r * 4, fill=accent, opacity="0.09", filter="url(#blur)"))
    items.extend(
        [
            circle(x, y, r + 4, fill="#071014", stroke="#263642", stroke_width="1"),
            circle(x, y, r, fill=accent, opacity="0.92"),
        ]
    )
    return group(items)


def panel(x: float, y: float, w: float, h: float, accent: str, strong: bool = False) -> str:
    return rect(
        x,
        y,
        w,
        h,
        rx="10",
        fill="#091018",
        stroke=accent if strong else "#263642",
        stroke_width="2" if strong else "1.3",
        opacity="0.98",
    )


def arrow_head(x: float, y: float, accent: str, direction: str = "right") -> str:
    if direction == "right":
        pts = f"{x-15},{y-10} {x},{y} {x-15},{y+10}"
    elif direction == "left":
        pts = f"{x+15},{y-10} {x},{y} {x+15},{y+10}"
    elif direction == "up":
        pts = f"{x-10},{y+15} {x},{y} {x+10},{y+15}"
    else:
        pts = f"{x-10},{y-15} {x},{y} {x+10},{y-15}"
    return polygon(pts, fill=accent, opacity="0.9")


def _immutable_ledger(a: str, b: str) -> str:
    items = []
    for x, y in [(150, 150), (145, 315), (160, 480), (1040, 150), (1055, 315), (1040, 480)]:
        items.append(node(x, y, a if x < 600 else b, halo=y == 315))
        items.append(line(x + (12 if x < 600 else -12), y, 420 if x < 600 else 780, 315,
                          stroke=a if x < 600 else b, stroke_width="2", opacity="0.36"))
    for x in [420, 540, 660]:
        items.append(panel(x, 245, 100, 140, a, strong=x == 540))
        if x < 660:
            items.append(line(x + 100, 315, x + 120, 315, stroke=a, stroke_width="4", opacity="0.75"))
    items += [circle(600, 315, 44, fill="none", stroke=a, stroke_width="3"),
              rect(579, 300, 42, 39, rx="6", fill="#071014", stroke=a, stroke_width="3"),
              path("M588 300V286A12 12 0 0 1 612 286V300", fill="none", stroke=a, stroke_width="3")]
    return group(items)


def _resilient_layers(a: str, b: str) -> str:
    items = []
    widths = [780, 900, 720, 840]
    for i, w in enumerate(widths):
        x = (WIDTH - w) / 2
        y = 120 + i * 115
        items += [panel(x, y, w, 62, a, strong=i == 1),
                  line(x + 55, y + 31, x + w - 55, y + 31, stroke=a, stroke_width="2", opacity=str(0.35 + i * 0.1))]
        for j in range(5):
            items.append(circle(x + 90 + j * (w - 180) / 4, y + 31, 5, fill=a if (i+j) % 3 else b))
    for x in [280, 470, 730, 920]:
        items.append(path(f"M{x} 151C{x-45} 230 {x+50} 315 {x} 381S{x+35} 490 {x} 496", fill="none", stroke=b,
                          stroke_width="2", stroke_dasharray="6 8", opacity="0.65"))
    return group(items)


def _system_boundary(a: str, b: str) -> str:
    items = [circle(600, 315, 230, fill="none", stroke="#25303b", stroke_width="2"),
             circle(600, 315, 165, fill="none", stroke=b, stroke_width="2", stroke_dasharray="5 11", opacity="0.7"),
             rect(475, 215, 250, 200, rx="24", fill="#091018", stroke=a, stroke_width="2"),
             circle(600, 315, 48, fill="url(#accentGlow)", stroke=a, stroke_width="3")]
    for angle, x, y in [(0, 600, 85), (1, 830, 315), (2, 600, 545), (3, 370, 315), (4, 438, 153), (5, 762, 477)]:
        items += [node(x, y, b if angle % 2 else a), line(600, 315, x, y, stroke=b, stroke_width="1.5", opacity="0.3")]
    return group(items)


def _execution_unit(a: str, b: str) -> str:
    items = []
    for i, y in enumerate([145, 230, 315, 400, 485]):
        items += [circle(135, y, 5 + i % 2, fill=a, opacity="0.75"),
                  path(f"M145 {y}C300 {y} 330 {315+(y-315)*0.18} 450 315", fill="none", stroke=a,
                       stroke_width="2", opacity="0.45")]
    items += [panel(450, 185, 300, 260, a, strong=True),
              rect(490, 225, 220, 180, rx="14", fill="#071014", stroke=b, stroke_width="2"),
              circle(600, 315, 34, fill="url(#accentGlow)", stroke=a, stroke_width="3")]
    for y in [230, 315, 400]:
        items += [line(750, y, 1040, y, stroke=b, stroke_width="2", opacity="0.55"), node(1050, y, b)]
    return group(items)


def _execution_glue(a: str, b: str) -> str:
    items = []
    left = [(150, 170), (210, 315), (145, 465), (350, 230), (340, 410)]
    right = [(1050, 170), (990, 315), (1055, 465), (850, 230), (860, 410)]
    for points, color in [(left, a), (right, b)]:
        for x, y in points:
            items += [node(x, y, color), line(x, y, 510 if x < 600 else 690, 315, stroke=color, stroke_width="1.5", opacity="0.38")]
    items += [panel(510, 215, 180, 200, a, strong=True),
              path("M555 315L585 345L650 275", fill="none", stroke=a, stroke_width="8", stroke_linecap="round", stroke_linejoin="round")]
    return group(items)


def _validation_gates(a: str, b: str) -> str:
    items = [line(80, 315, 1120, 315, stroke="#263642", stroke_width="3")]
    for i, x in enumerate([250, 425, 600, 775, 950]):
        color = a if i < 4 else b
        items += [rect(x-24, 155, 48, 320, rx="8", fill="#091018", stroke=color, stroke_width="2"),
                  rect(x-9, 265, 18, 100, rx="6", fill=color, opacity=str(0.38 + i * 0.1)),
                  node(x, 315, color, 6, halo=i == 4)]
    items += [arrow_head(1120, 315, a)]
    return group(items)


def _capital_flow(a: str, b: str) -> str:
    items = []
    for y in [220, 265, 315, 365, 410]:
        items.append(path(f"M60 {y}C310 {y} 360 315 505 315", fill="none", stroke=a, stroke_width="2.5", opacity="0.45"))
    items += [circle(600, 315, 120, fill="none", stroke=b, stroke_width="28", opacity="0.16"),
              circle(600, 315, 95, fill="#091018", stroke=a, stroke_width="3"),
              path("M550 315L585 350L655 275", fill="none", stroke=a, stroke_width="10", stroke_linecap="round", stroke_linejoin="round"),
              line(695, 315, 1055, 315, stroke=a, stroke_width="5"), arrow_head(1070, 315, a), node(1110, 315, b, 10, True)]
    return group(items)


def _control_stack(a: str, b: str) -> str:
    items = []
    for i, (w, y) in enumerate([(780, 100), (900, 195), (690, 290), (840, 385), (740, 480)]):
        x = (1200-w)/2
        items += [panel(x, y, w, 58, a, strong=i == 2),
                  line(x+45, y+29, x+w-45, y+29, stroke=a if i == 2 else b, stroke_width="2", opacity="0.55")]
    items += [rect(565, 80, 70, 480, rx="12", fill="#080e14", stroke=a, stroke_width="3", opacity="0.92")]
    for y in [129, 224, 319, 414, 509]:
        items.append(node(600, y, a, 6, y == 319))
    return group(items)


def _persistent_stop(a: str, b: str) -> str:
    items = [rect(80, 420, 1040, 70, rx="16", fill="#100b0c", stroke=a, stroke_width="3"),
             line(110, 455, 1090, 455, stroke=a, stroke_width="8", opacity="0.6")]
    for i, x in enumerate([180, 340, 500, 680, 850, 1020]):
        items += [path(f"M{x-55} 50C{x+35} 150 {x-65} 270 {x} 405", fill="none", stroke=b if i % 2 else a,
                       stroke_width="3", opacity="0.65"), circle(x, 405, 9, fill=a),
                  line(x, 405, x, 442, stroke=a, stroke_width="3")]
    return group(items)


def _four_failures(a: str, b: str) -> str:
    items = [node(145, 315, b, 11, True), line(160, 315, 420, 315, stroke=b, stroke_width="4"), node(440, 315, b)]
    for i, y in enumerate([115, 245, 385, 515]):
        items += [path(f"M450 315C580 315 600 {y} 760 {y}H1030", fill="none", stroke=a, stroke_width="3", opacity=str(0.9-i*0.12)),
                  rect(1015, y-16, 32, 32, rx="4", fill="#130b0c", stroke=a, stroke_width="2"),
                  line(1023, y-8, 1039, y+8, stroke=a, stroke_width="2"), line(1039, y-8, 1023, y+8, stroke=a, stroke_width="2")]
    return group(items)


def _retest_buffer(a: str, b: str) -> str:
    items = [rect(100, 365, 1000, 100, rx="20", fill="#120e09", stroke=b, stroke_width="2"),
             line(120, 390, 1080, 390, stroke=a, stroke_width="5", opacity="0.7"),
             path("M120 320C270 80 450 100 520 300S720 525 820 270S1010 120 1080 280", fill="none", stroke=a,
                  stroke_width="5", stroke_linecap="round"),
             circle(520, 300, 11, fill=a), circle(820, 270, 11, fill=a),
             line(520, 300, 520, 390, stroke=a, stroke_width="2", stroke_dasharray="5 7"),
             line(820, 270, 820, 390, stroke=a, stroke_width="2", stroke_dasharray="5 7")]
    return group(items)


def _economic_pressure(a: str, b: str) -> str:
    items = []
    for i in range(8):
        y = 85 + i * 65
        items += [line(75, y, 330, y, stroke=a if i % 3 else b, stroke_width="3", opacity="0.55"), node(75, y, a, 5)]
    items += [polygon("350,70 850,235 850,395 350,560", fill="#110d09", stroke=b, stroke_width="2", opacity="0.9"),
              rect(820, 245, 100, 140, rx="18", fill="#091018", stroke=a, stroke_width="3"),
              line(920, 315, 1090, 315, stroke=a, stroke_width="4"), arrow_head(1110, 315, a)]
    return group(items)


def _risk_reserve(a: str, b: str) -> str:
    items = []
    for i, x in enumerate([140, 250, 360, 470]):
        h = 90 + i * 38
        items += [rect(x, 500-h, 70, h, rx="8", fill=b, opacity=str(0.25+i*0.12), stroke=a, stroke_width="1.5"),
                  path(f"M{x+35} {500-h}C{x+90} {320-i*18} 690 {340+i*12} 790 315", fill="none", stroke=a, stroke_width="2", opacity="0.5")]
    items += [circle(820, 315, 75, fill="#091018", stroke=a, stroke_width="3"),
              circle(820, 315, 32, fill="url(#accentGlow)", stroke=a, stroke_width="2"),
              line(895, 315, 1080, 315, stroke=a, stroke_width="4"), arrow_head(1100, 315, a)]
    return group(items)


def _audit_trigger(a: str, b: str) -> str:
    items = [line(90, 500, 1110, 500, stroke="#263642", stroke_width="2"),
             path("M100 485C270 470 330 425 430 440S610 360 690 365S830 185 1015 130", fill="none", stroke=a,
                  stroke_width="5", stroke_linecap="round"), node(690, 365, a, 9, True)]
    for i, x in enumerate([735, 805, 875, 945, 1015]):
        y = 420 - i * 43
        items += [rect(x-18, y, 36, 36, rx="5", fill="#091018", stroke=b, stroke_width="2"),
                  line(x, y+36, x, 500, stroke=b, stroke_width="1", stroke_dasharray="4 8", opacity="0.6")]
    return group(items)


def _fallback_route(a: str, b: str) -> str:
    items = [node(110, 315, a, 10, True), line(125, 315, 430, 315, stroke=a, stroke_width="5"),
             line(430, 315, 515, 315, stroke=a, stroke_width="5"),
             line(685, 315, 1070, 315, stroke="#263642", stroke_width="5", stroke_dasharray="10 12"),
             path("M430 315C480 120 720 120 770 315", fill="none", stroke=b, stroke_width="5", stroke_linecap="round"),
             line(770, 315, 1070, 315, stroke=b, stroke_width="5"), arrow_head(1090, 315, b), node(1120, 315, b, 9, True)]
    for x, y in [(540, 315), (580, 295), (620, 335), (660, 310)]:
        items.append(circle(x, y, 4, fill=a, opacity="0.45"))
    return group(items)


def _executable_brief(a: str, b: str) -> str:
    items = [panel(400, 110, 400, 410, a, strong=True), rect(440, 150, 320, 330, rx="12", fill="#071014", stroke=b, stroke_width="2")]
    for i, y in enumerate([205, 260, 315, 370, 425]):
        items += [circle(485, y, 8, fill=a if i < 4 else b), line(510, y, 690 + (i % 2) * 35, y, stroke="#41505d", stroke_width="4")]
    for x, y in [(160, 180), (160, 450), (1040, 180), (1040, 450)]:
        items += [node(x, y, b), path(f"M{x} {y}C{300 if x<600 else 900} {y} {330 if x<600 else 870} 315 {400 if x<600 else 800} 315", fill="none", stroke=b, stroke_width="2", opacity="0.5")]
    return group(items)


def _evidence_ledger(a: str, b: str) -> str:
    items = []
    for i in range(14):
        x = 80 + i * 34
        y = 140 + ((i * 67) % 330)
        items += [circle(x, y, 5, fill=b, opacity=str(max(0.12, 0.8-i*0.05))),
                  line(x, y, x+35, y+((i%3)-1)*28, stroke=b, stroke_width="1.5", opacity=str(max(0.08, 0.45-i*0.025)))]
    items += [line(555, 80, 555, 550, stroke=a, stroke_width="2", stroke_dasharray="6 10")]
    for i in range(5):
        x = 650 + i * 85
        y = 205 + (i % 2) * 110
        items += [panel(x, y, 70, 110, a, strong=i == 4), line(x+70, y+55, x+85, 315, stroke=a, stroke_width="3")]
    return group(items)


def _verified_node(a: str, b: str) -> str:
    items = []
    for i in range(7):
        x = 100 + i * 118
        y = 150 + (i % 2) * 95
        items += [rect(x, y, 88, 88, rx="10", fill="#0c1014", stroke=b, stroke_width="2"),
                  line(x+88, y+44, x+118, 194+(i%2)*95, stroke=b, stroke_width="3")]
    items += [circle(930, 315, 125, fill="url(#accentGlow)", stroke=a, stroke_width="3"),
              circle(930, 315, 62, fill="#091018", stroke=a, stroke_width="3")]
    for x, y in [(1050, 130), (1100, 315), (1035, 510)]:
        items += [line(980, 315, x, y, stroke=a, stroke_width="2", opacity="0.5"), node(x, y, a)]
    return group(items)


def _chain_tip(a: str, b: str) -> str:
    items = []
    positions = [(150, 500), (275, 440), (400, 390), (525, 320), (650, 270), (775, 195), (900, 145)]
    for i, (x, y) in enumerate(positions):
        items += [rect(x, y, 82, 62, rx="8", fill="#0c1014", stroke=a if i == len(positions)-1 else b, stroke_width="2"),
                  circle(x+41, y+31, 6, fill=a if i == len(positions)-1 else b)]
        if i:
            px, py = positions[i-1]
            items.append(line(px+82, py+31, x, y+31, stroke=b, stroke_width="3"))
    items += [circle(941, 176, 85, fill="url(#accentGlow)", opacity="0.6"), node(941, 176, a, 10, True)]
    return group(items)


def _governed_rag(a: str, b: str) -> str:
    items = []
    for y in [130, 225, 320, 415, 510]:
        items += [panel(90, y-32, 150, 64, b), path(f"M240 {y}C390 {y} 390 315 515 315", fill="none", stroke=b, stroke_width="2", opacity="0.45")]
    items += [rect(515, 100, 80, 430, rx="14", fill="#091018", stroke=a, stroke_width="3"),
              rect(538, 255, 34, 120, rx="8", fill=a, opacity="0.55")]
    for y in [210, 315, 420]:
        items += [line(595, y, 900, y, stroke=a, stroke_width="3", opacity="0.7"), node(920, y, a, 8, y == 315)]
    items += [line(920, 315, 1090, 315, stroke=a, stroke_width="3", stroke_dasharray="5 8"), panel(1090, 275, 45, 80, a, True)]
    return group(items)


def _audit_v_telemetry(a: str, b: str) -> str:
    items = [line(570, 70, 570, 560, stroke="#34414d", stroke_width="2")]
    for i in range(34):
        x = 80 + (i * 83) % 430
        y = 85 + (i * 137) % 465
        items += [circle(x, y, 3 + i % 5, fill=b if i % 3 else a, opacity=str(0.2 + (i % 6)*0.08))]
        if i % 4 == 0:
            items.append(line(x, y, 80+(i*149)%430, 85+(i*71)%465, stroke=b, stroke_width="1", opacity="0.18"))
    for i in range(6):
        x = 660 + i * 72
        items += [panel(x, 250, 54, 130, a, strong=i == 5), line(x+54, 315, x+72, 315, stroke=a, stroke_width="3")]
    return group(items)


def _governed_autonomy(a: str, b: str) -> str:
    items = []
    for y, color in [(105, a), (210, b), (315, a), (420, b), (525, a)]:
        items += [path(f"M20 {y}C250 {y+50} 420 {315+(y-315)*0.2} 555 315", fill="none", stroke=color, stroke_width="2.5", opacity="0.55"),
                  path(f"M645 315C800 {315+(y-315)*0.2} 950 {y-45} 1180 {y}", fill="none", stroke=color, stroke_width="2.5", opacity="0.55")]
    items += [rect(555, 120, 90, 390, rx="12", fill="#091018", stroke=a, stroke_width="3"),
              line(600, 155, 600, 475, stroke=a, stroke_width="4", stroke_dasharray="18 15"), node(600, 315, a, 11, True)]
    return group(items)


def _false_synced(a: str, b: str) -> str:
    items = []
    for row in range(6):
        for col in range(13):
            x = 120 + col * 80
            y = 85 + row * 58
            items.append(circle(x, y, 6, fill=a, opacity=str(0.35 + ((row+col)%4)*0.12)))
    items += [line(60, 505, 500, 505, stroke=b, stroke_width="7"),
              line(700, 505, 1140, 505, stroke=b, stroke_width="7")]
    for x, y in [(535, 490), (575, 520), (620, 495), (665, 515)]:
        items.append(circle(x, y, 4, fill=b, opacity="0.7"))
    return group(items)


def _broadcast(a: str, b: str) -> str:
    items = [node(285, 430, a, 10, True)]
    for r, opacity, color in [(90, .9, a), (155, .65, a), (225, .45, a), (300, .3, b)]:
        items.append(path(f"M285 {430-r}A{r} {r} 0 0 1 {285+r} 430", fill="none", stroke=color, stroke_width="3", opacity=str(opacity)))
    for x, y, color in [(950, 170, a), (1000, 315, a), (950, 480, b)]:
        items += [path(f"M390 390C600 {y} 760 {y} {x-30} {y}", fill="none", stroke=color, stroke_width="2", opacity="0.5"),
                  panel(x-25, y-25, 50, 50, color, True)]
    return group(items)


def _missing_slot(a: str, b: str) -> str:
    items = [line(80, 315, 1120, 315, stroke="#263642", stroke_width="3")]
    for i in range(11):
        x = 105 + i * 96
        if i == 6:
            items += [rect(x, 255, 58, 120, rx="8", fill="none", stroke=a, stroke_width="2", stroke_dasharray="7 9"),
                      circle(x+29, 315, 28, fill=a, opacity="0.07", filter="url(#blur)")]
        else:
            items += [rect(x, 275, 58, 80, rx="8", fill="#091018", stroke=b, stroke_width="2"), circle(x+29, 315, 5, fill=b)]
    return group(items)


def _common_ruler(a: str, b: str) -> str:
    items = [line(100, 500, 1100, 500, stroke=a, stroke_width="4")]
    for i in range(11):
        x = 100 + i * 100
        items.append(line(x, 485, x, 515 if i % 5 else 530, stroke=a, stroke_width="2"))
    for row, y in enumerate([130, 220, 310, 400]):
        offset = [55, 15, 75, 35][row]
        items += [line(160+offset, y, 980-offset, y, stroke=b, stroke_width="3", opacity="0.5"),
                  line(160+offset, y-14, 160+offset, y+14, stroke=b, stroke_width="3"),
                  line(980-offset, y-14, 980-offset, y+14, stroke=b, stroke_width="3"),
                  path(f"M{570+offset/4} {y}L600 500", fill="none", stroke=a, stroke_width="1.5", stroke_dasharray="5 8", opacity="0.55")]
    return group(items)


def _first_span(a: str, b: str) -> str:
    items = [line(160, 315, 1040, 315, stroke="#263642", stroke_width="2"),
             line(270, 315, 790, 315, stroke=a, stroke_width="6"),
             line(270, 230, 270, 400, stroke=a, stroke_width="3"), line(790, 230, 790, 400, stroke=a, stroke_width="3"),
             circle(270, 315, 16, fill="#091018", stroke=a, stroke_width="3"), circle(790, 315, 16, fill="#091018", stroke=a, stroke_width="3")]
    for x in range(320, 790, 47):
        items.append(line(x, 300, x, 330, stroke=b, stroke_width="2"))
    items += [arrow_head(285, 315, a, "left"), arrow_head(775, 315, a)]
    return group(items)


def _pruned_plan(a: str, b: str) -> str:
    items = []
    for row in range(4):
        for col in range(7):
            x = 95 + col * 145
            y = 90 + row * 120
            active = 2 <= col <= 4 and 1 <= row <= 2
            items.append(rect(x, y, 100, 70, rx="8", fill="#091018" if active else "none",
                              stroke=a if active else "#263642", stroke_width="2", opacity="1" if active else "0.28",
                              stroke_dasharray=None if active else "6 8"))
    items += [rect(355, 185, 490, 260, rx="26", fill="url(#accentGlow)", stroke=a, stroke_width="2", opacity="0.8"),
              node(600, 315, a, 12, True)]
    return group(items)


def _evidence_authority(a: str, b: str) -> str:
    items = [line(600, 65, 600, 565, stroke=a, stroke_width="3"),
             rect(570, 245, 60, 140, rx="12", fill="#091018", stroke=a, stroke_width="3")]
    for i in range(7):
        x = 100 + (i % 3) * 125
        y = 130 + (i // 3) * 135
        items += [panel(x, y, 80, 70, b), path(f"M{x+80} {y+35}C450 {y+35} 485 315 570 315", fill="none", stroke=b, stroke_width="2", opacity="0.5")]
    for i, y in enumerate([160, 315, 470]):
        items += [line(630, y, 960, y, stroke=a, stroke_width="2", opacity="0.5"), node(1000, y, a, 9, i == 1)]
    return group(items)


def _self_review(a: str, b: str) -> str:
    items = [circle(600, 315, 190, fill="none", stroke=b, stroke_width="5", stroke_dasharray="420 90"),
             arrow_head(452, 192, b, "up"), panel(510, 225, 180, 180, a, True),
             circle(600, 315, 45, fill="#091018", stroke=a, stroke_width="3"),
             path("M600 270C720 110 900 160 900 315S730 520 600 405", fill="none", stroke=a, stroke_width="4"),
             path("M560 280L640 350M640 280L560 350", fill="none", stroke=a, stroke_width="6", stroke_linecap="round")]
    return group(items)


def _over_rigorous(a: str, b: str) -> str:
    items = [line(60, 315, 1140, 315, stroke="#263642", stroke_width="3")]
    for i, x in enumerate(range(180, 1080, 110)):
        blocked = i in (5, 6)
        items += [rect(x-16, 150, 32, 330, rx="6", fill="#091018", stroke=a if blocked else b,
                       stroke_width="3" if blocked else "1.5", opacity="1" if blocked else "0.65"),
                  circle(x, 315, 7, fill=a if blocked else b)]
    items += [circle(115, 315, 12, fill=b), path("M115 315C230 70 850 70 1085 315", fill="none", stroke=a, stroke_width="3", stroke_dasharray="8 9", opacity="0.55")]
    return group(items)


def _backpressure(a: str, b: str) -> str:
    items = []
    for i in range(13):
        y = 75 + i * 40
        items += [path(f"M20 {y}C300 {y} 400 {315+(y-315)*0.28} 560 315", fill="none", stroke=a if i % 3 else b,
                       stroke_width=str(2 + (i%3)), opacity="0.55")]
    items += [rect(560, 95, 75, 440, rx="12", fill="#100b0c", stroke=a, stroke_width="4"),
              rect(584, 275, 27, 80, rx="8", fill=a, opacity="0.65")]
    for y in [245, 285, 325, 365, 405]:
        items += [path(f"M635 {315+(y-315)*0.2}C760 {315+(y-315)*0.2} 890 {y} 1160 {y}", fill="none", stroke=b, stroke_width="2.5", opacity="0.42")]
    return group(items)


def _recovery_cycle(a: str, b: str) -> str:
    items = [circle(600, 315, 205, fill="none", stroke="#263642", stroke_width="22", opacity="0.4")]
    for d, color in [("M430 210A200 200 0 0 1 770 210", a), ("M785 245A200 200 0 0 1 645 510", b), ("M560 510A200 200 0 0 1 415 255", "#55d98a")]:
        items.append(path(d, fill="none", stroke=color, stroke_width="6", stroke_linecap="round"))
    for x, y, color in [(430, 210, a), (780, 225, b), (605, 515, "#55d98a")]:
        items.append(node(x, y, color, 10, True))
    items += [panel(515, 230, 170, 170, a, True), circle(600, 315, 38, fill="url(#accentGlow)", stroke=a, stroke_width="3")]
    return group(items)


def _loop_decay(a: str, b: str) -> str:
    values = [12,7,6,7,5,5,8,5,5,4,5,6,2,3,2,4,4,5,5,5,3,2,3,4,3,4,4,5,7,8,5,5,7,7,3,3,3,3,4,4,4,4,2,2,2,3,2,0]
    items = [line(85, 510, 1115, 510, stroke=a, stroke_width="2", opacity="0.65")]
    bw = 16
    gap = (1030 - len(values)*bw)/(len(values)-1)
    for i, value in enumerate(values):
        x = 85 + i * (bw+gap)
        h = value * 28
        items.append(rect(round(x,2), 510-h, bw, h, rx="2", fill=a if i == len(values)-1 else b, opacity="0.78"))
    items += [circle(1098, 510, 18, fill="url(#accentGlow)", stroke=a, stroke_width="3")]
    return group(items)


def _moved_bottleneck(a: str, b: str) -> str:
    items = []
    for i in range(11):
        y = 70 + i * 49
        mid = 315 + (y-315)*0.16
        items += [path(f"M20 {y}C250 {y} 410 {mid} 555 {mid}", fill="none", stroke=a if i%2 else b,
                       stroke_width="2.5", opacity="0.5"),
                  path(f"M645 {mid}C790 {mid} 930 {y} 1180 {y}", fill="none", stroke=a if i%2 else b,
                       stroke_width="2.5", opacity="0.4")]
    items += [rect(555, 135, 90, 360, rx="14", fill="#091018", stroke=a, stroke_width="3"),
              rect(580, 265, 40, 100, rx="8", fill=a, opacity="0.52"), node(600, 315, a, 9, True),
              circle(850, 315, 125, fill="none", stroke="#30404d", stroke_width="2", stroke_dasharray="5 11"),
              node(850, 315, "#55d98a", 12, True),
              line(735, 315, 810, 315, stroke="#55d98a", stroke_width="2", stroke_dasharray="4 9", opacity="0.7")]
    return group(items)


MOTIFS = {
    "immutable-ledger": _immutable_ledger,
    "resilient-layers": _resilient_layers,
    "system-boundary": _system_boundary,
    "execution-unit": _execution_unit,
    "execution-glue": _execution_glue,
    "validation-gates": _validation_gates,
    "capital-flow": _capital_flow,
    "control-stack": _control_stack,
    "persistent-stop": _persistent_stop,
    "four-failures": _four_failures,
    "retest-buffer": _retest_buffer,
    "economic-pressure": _economic_pressure,
    "risk-reserve": _risk_reserve,
    "audit-trigger": _audit_trigger,
    "fallback-route": _fallback_route,
    "executable-brief": _executable_brief,
    "evidence-ledger": _evidence_ledger,
    "verified-node": _verified_node,
    "chain-tip": _chain_tip,
    "governed-rag": _governed_rag,
    "audit-v-telemetry": _audit_v_telemetry,
    "governed-autonomy": _governed_autonomy,
    "false-synced": _false_synced,
    "broadcast": _broadcast,
    "missing-slot": _missing_slot,
    "common-ruler": _common_ruler,
    "first-span": _first_span,
    "pruned-plan": _pruned_plan,
    "evidence-authority": _evidence_authority,
    "self-review": _self_review,
    "over-rigorous": _over_rigorous,
    "backpressure": _backpressure,
    "recovery-cycle": _recovery_cycle,
    "loop-decay": _loop_decay,
    "moved-bottleneck": _moved_bottleneck,
}


def _background(slug: str, accent: str) -> str:
    digest = hashlib.sha256(slug.encode("utf-8")).digest()
    dots = []
    for i in range(24):
        offset = (i * 2) % 31
        x = 55 + int.from_bytes(digest[offset:offset + 2], "big") % 1090
        y = 40 + digest[(i * 5 + 7) % 32] * 550 // 255
        r = 0.8 + digest[(i * 7 + 3) % 32] % 3 * 0.45
        dots.append(circle(x, y, r, fill=accent if i % 5 == 0 else "#34414d", opacity="0.28"))
    grid = []
    for x in range(75, 1200, 150):
        grid.append(line(x, 50, x, 580, stroke="#141b22", stroke_width="1", opacity="0.4"))
    for y in range(75, 630, 120):
        grid.append(line(45, y, 1155, y, stroke="#141b22", stroke_width="1", opacity="0.4"))
    return group(grid + dots)


def render_svg(spec: dict[str, str]) -> str:
    accent, secondary = PALETTES[spec["accent"]]
    motif = MOTIFS[spec["motif"]](accent, secondary)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#05070a"/>
    <stop offset="0.55" stop-color="#0a0e14"/>
    <stop offset="1" stop-color="#07090d"/>
  </linearGradient>
  <radialGradient id="accentGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="{accent}" stop-opacity="0.28"/>
    <stop offset="0.55" stop-color="{accent}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="{accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="8"/>
  </filter>
  <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.72">
    <stop offset="0.58" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#background)"/>
{_background(spec["slug"], accent)}
{motif}
<rect width="1200" height="630" fill="url(#vignette)" pointer-events="none"/>
<rect x="1" y="1" width="1198" height="628" fill="none" stroke="#1a222b" stroke-width="2"/>
</svg>
'''


def _chrome() -> str:
    for candidate in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        found = shutil.which(candidate)
        if found:
            return found
    raise RuntimeError("Chrome/Chromium is required to rasterize the generated SVG")


def rasterize(svg_path: Path, output_path: Path) -> None:
    try:
        from PIL import Image
    except ImportError as error:
        raise RuntimeError("Pillow is required to write PNG/JPEG cover files") from error

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="rbx-cover-") as temp_dir:
        screenshot = Path(temp_dir) / "cover.png"
        profile = Path(temp_dir) / "chrome-profile"
        subprocess.run(
            [
                _chrome(),
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                f"--user-data-dir={profile}",
                f"--screenshot={screenshot}",
                f"--window-size={WIDTH},{HEIGHT}",
                svg_path.resolve().as_uri(),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with Image.open(screenshot) as image:
            image = image.convert("RGB")
            if image.size != (WIDTH, HEIGHT):
                raise RuntimeError(f"unexpected raster size {image.size} for {svg_path.name}")
            if output_path.suffix.lower() == ".jpg":
                image.save(output_path, "JPEG", quality=92, optimize=False, progressive=False, subsampling=0)
            elif output_path.suffix.lower() == ".png":
                image.save(output_path, "PNG", optimize=False, compress_level=9)
            else:
                raise ValueError(f"unsupported output extension: {output_path.suffix}")


def load_catalog(path: Path) -> dict[str, dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("width") != WIDTH or payload.get("height") != HEIGHT:
        raise ValueError(f"catalog dimensions must be {WIDTH}x{HEIGHT}")
    result: dict[str, dict[str, str]] = {}
    for spec in payload.get("posts", []):
        slug = spec["slug"]
        if slug in result:
            raise ValueError(f"duplicate cover spec: {slug}")
        if spec.get("motif") not in MOTIFS:
            raise ValueError(f"unknown motif for {slug}: {spec.get('motif')}")
        if spec.get("accent") not in PALETTES:
            raise ValueError(f"unknown palette for {slug}: {spec.get('accent')}")
        if spec.get("extension") not in {"jpg", "png"}:
            raise ValueError(f"unsupported extension for {slug}: {spec.get('extension')}")
        if not isinstance(spec.get("revision"), int) or spec["revision"] < 1:
            raise ValueError(f"invalid asset revision for {slug}: {spec.get('revision')}")
        result[slug] = spec
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate deterministic, text-free RBX Journal covers")
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--slug", help="render one catalogued post")
    target.add_argument("--all", action="store_true", help="render every catalogued post")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--raster-dir", type=Path, default=DEFAULT_RASTER_DIR)
    parser.add_argument("--source-only", action="store_true", help="write SVG sources without rasterizing")
    args = parser.parse_args()

    catalog = load_catalog(args.catalog)
    if args.slug and args.slug not in catalog:
        parser.error(f"slug is not present in {args.catalog}: {args.slug}")
    specs = [catalog[args.slug]] if args.slug else list(catalog.values())
    args.source_dir.mkdir(parents=True, exist_ok=True)
    if not args.source_only:
        args.raster_dir.mkdir(parents=True, exist_ok=True)

    for spec in specs:
        svg_path = args.source_dir / f'{spec["slug"]}.svg'
        svg_path.write_text(render_svg(spec), encoding="utf-8", newline="\n")
        if args.source_only:
            print(f"source {svg_path}")
            continue
        output_path = args.raster_dir / (
            f'{spec["slug"]}-v{spec["revision"]}.{spec["extension"]}'
        )
        rasterize(svg_path, output_path)
        print(f"cover {output_path} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
