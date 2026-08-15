from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path("artifacts/home-cinematic")
sections = ["hero", "method", "destinations", "cta", "footer"]
columns = [("desktop", "Desktop · 1280 px"), ("mobile", "Mobile · 375 px")]
thumb_w = 460
label_h = 42
padding = 18
images = {}

for breakpoint, section_label in columns:
    for section in sections:
        source = Image.open(root / f"{breakpoint}-{section}.png").convert("RGB")
        scale = thumb_w / source.width
        images[breakpoint, section] = source.resize((thumb_w, round(source.height * scale)))

thumb_h = max(image.height for image in images.values())
sheet = Image.new("RGB", (padding * 3 + thumb_w * 2, padding * (len(sections) + 2) + (thumb_h + label_h) * len(sections)), "#061108")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default()

for column_index, (_, heading) in enumerate(columns):
    x = padding + column_index * (thumb_w + padding)
    draw.text((x, padding), heading, fill="#dfffe8", font=font)

for row_index, section in enumerate(sections):
    y = padding * 2 + 14 + row_index * (thumb_h + label_h + padding)
    for column_index, (breakpoint, _) in enumerate(columns):
        x = padding + column_index * (thumb_w + padding)
        draw.text((x, y), section.title(), fill="#8bffac", font=font)
        sheet.paste(images[breakpoint, section], (x, y + label_h))

sheet.save(root / "contact-sheet.png")
