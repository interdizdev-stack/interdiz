"""Rebuild the mobile case artwork from the numbered desktop sheets (requires Pillow).

Coordinates below are original pixels, with the right and bottom edges exclusive.
Join adjacent sheets before cropping so photographs and lettering keep one scale.
"""

from functools import lru_cache
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "dist/assets/cases/mama"
OUT = ROOT / "mobile-art"


@lru_cache
def sheet(number):
    with Image.open(ROOT / f"{number}.webp") as source:
        return source.convert("RGB")


def region(name, first, last, left, top, right, bottom, *, clear=None, lettering=False):
    # top is relative to the first sheet, bottom to the last.
    parts = []
    for n in range(first, last + 1):
        image = sheet(n)
        box = (left, top if n == first else 0, right, bottom if n == last else image.height)
        assert 0 <= box[0] < box[2] <= image.width and 0 <= box[1] < box[3] <= image.height
        parts.append(image.crop(box))
    result = Image.new("RGB", (right - left, sum(p.height for p in parts)))
    offset = 0
    for part in parts:
        result.paste(part, (0, offset))
        offset += part.height
    if clear:
        # The first line of desktop body copy shares a row with the left cloud.
        # Only remove the copy: its accessible mobile counterpart follows the image.
        result.paste("#fff6e9", clear)
    result.save(OUT / f"{name}.webp", lossless=lettering, quality=94, method=6)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    region("about", 1, 1, 0, 0, 1200, 950, clear=(500, 914, 1200, 950))
    region("computer", 2, 2, 0, 71, 1200, 1001)
    region("goal", 2, 3, 425, 1174, 1096, 130, lettering=True)
    region("confidence", 3, 4, 0, 690, 1200, 203)
    region("phone-and-strategy", 4, 5, 0, 374, 1200, 1060)
    region("ux", 6, 6, 425, 362, 1132, 767, lettering=True)
    region("landing-phone", 6, 9, 786, 1245, 1123, 729)
    region("landing-desktop", 6, 8, 77, 1245, 700, 380)
    region("tone", 9, 10, 0, 920, 1200, 550)
    region("laptop", 10, 11, 0, 996, 1200, 920)
    region("result", 11, 11, 386, 1093, 1126, 1220, lettering=True)
    region("devices", 12, 12, 0, 500, 1200, 1140)
    region("promo", 13, 13, 510, 10, 1082, 138, lettering=True)
    for i, (l, r) in enumerate([(69, 415), (424, 770), (779, 1125)], 1):
        region(f"card-{i}", 13, 14, l, 600, r, 42)
        region(f"card-{i + 3}", 14, 14, l, 65, r, 803)
    region("care", 14, 15, 0, 1020, 1200, 545)
    region("thanks", 15, 15, 0, 879, 1200, 1296)
