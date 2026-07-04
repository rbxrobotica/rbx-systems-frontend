#!/usr/bin/env python3
"""Generate the default Open Graph image for RBX Systems."""
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630
BG = "#07080a"
CYAN = "#22e5e5"
FG = "#ececec"
FG_MUTED = "#b8bcc2"
BORDER = "#24282e"


def draw_gradient_background(draw, width, height):
    """Draw a subtle top-to-bottom gradient."""
    for y in range(height):
        factor = y / height
        r = int(7 + factor * 8)
        g = int(8 + factor * 9)
        b = int(10 + factor * 10)
        draw.line([(0, y), (width, y)], fill=(r, g, b))


def draw_grid(draw, width, height, step=60, color="#0b1218"):
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=color, width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=color, width=1)


def main():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)

    draw_gradient_background(draw, WIDTH, HEIGHT)
    draw_grid(draw, WIDTH, HEIGHT)

    # Border
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline=BORDER, width=2)

    # Accent line
    draw.rectangle([80, 80, 1120, 82], fill=CYAN)

    # Logo mark: stylised hexagon-ish square
    mark_size = 96
    mark_x, mark_y = 80, 120
    draw.rectangle(
        [mark_x, mark_y, mark_x + mark_size, mark_y + mark_size],
        fill=CYAN,
        outline=CYAN,
    )
    # Cutout detail
    draw.rectangle(
        [mark_x + mark_size // 2, mark_y, mark_x + mark_size, mark_y + mark_size // 2],
        fill=BG,
        outline=CYAN,
    )

    # Fonts
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 96)
        font_subtitle = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
        font_url = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 28)
    except OSError:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_url = ImageFont.load_default()

    # Title
    draw.text((80, 260), "RBX Systems", font=font_title, fill=FG)

    # Subtitle
    draw.text(
        (80, 390),
        "Systems engineering for operations that demand control",
        font=font_subtitle,
        fill=FG_MUTED,
    )

    # URL / brand anchor
    draw.text((80, 540), "rbxsystems.ch · rbx.ia.br", font=font_url, fill=CYAN)

    output_path = "static/brand/rbx-og.jpg"
    img.save(output_path, "JPEG", quality=92)
    print(f"Saved {output_path} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
