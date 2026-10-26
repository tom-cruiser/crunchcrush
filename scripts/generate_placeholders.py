"""Generates placeholder icons and menu photos. Replace public/ files with real assets later.

Run: python3 scripts/generate_placeholders.py
"""
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
(PUBLIC / "icons").mkdir(parents=True, exist_ok=True)
(PUBLIC / "images" / "menu").mkdir(parents=True, exist_ok=True)

def font(size):
    for path in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def icon(size, padding_ratio, name):
    img = Image.new("RGB", (size, size), "#0a0a0a")
    d = ImageDraw.Draw(img)
    pad = int(size * padding_ratio)
    d.ellipse([pad, pad, size - pad, size - pad], outline="#ffffff", width=max(2, size // 40))
    f = font(int(size * 0.3))
    d.text((size / 2, size / 2), "CC", fill="#ffffff", font=f, anchor="mm")
    img.save(PUBLIC / "icons" / name)

icon(192, 0.1, "icon-192.png")
icon(512, 0.1, "icon-512.png")
icon(512, 0.22, "icon-maskable-512.png")
icon(180, 0.1, "apple-touch-icon.png")

(PUBLIC / "favicon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a0a0a"/>'
    '<circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-width="3"/>'
    '<text x="32" y="39" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="20" fill="#fff">CC</text></svg>\n'
)

(PUBLIC / "images" / "cover.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500"><defs><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse">'
    '<circle cx="20" cy="20" r="2" fill="#2a2a2a"/></pattern></defs><rect width="1200" height="500" fill="#0a0a0a"/><rect width="1200" height="500" fill="url(#p)"/>'
    '<text x="600" y="250" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="96" fill="#fff" letter-spacing="6">CRUNCH CRUST</text>'
    '<text x="600" y="320" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="32" fill="#a3a3a3" letter-spacing="8">TACOS · ROLL-EGGS · KIGALI</text></svg>\n'
)

LABELS = {"cat-tacos": "TACO", "cat-rolex": "ROLL", "cat-breakfast": "AM", "cat-combos": "COMBO", "cat-sides": "SIDE", "cat-drinks": "DRINK", "cat-desserts": "SWEET"}
source = (ROOT / "src" / "api" / "mock" / "menu.ts").read_text()
items = re.findall(r"item\(\{ id: '([^']+)', categoryId: '([^']+)', name: '([^']+)'", source)

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")

for item_id, category, name in items:
    words = name.split()
    lines, line = [], ""
    for w in words:
        if len(line) + len(w) > 14 and line:
            lines.append(line)
            line = w
        else:
            line = f"{line} {w}".strip()
    lines.append(line)
    text = "".join(
        f'<text x="200" y="{170 + i * 34 - (len(lines) - 1) * 17}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="28" fill="#fff">{esc(l)}</text>'
        for i, l in enumerate(lines)
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="1" stop-color="#3a3a3a"/></linearGradient></defs>'
        '<rect width="400" height="300" fill="url(#g)"/>'
        f'<text x="200" y="95" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="20" letter-spacing="6" fill="#737373">{LABELS.get(category, "")}</text>'
        f"{text}</svg>\n"
    )
    (PUBLIC / "images" / "menu" / f"{item_id}.svg").write_text(svg)

print(f"Generated icons and {len(items)} menu placeholders")
