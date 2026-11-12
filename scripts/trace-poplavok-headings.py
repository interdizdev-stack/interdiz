"""Trace the small original headings as scalable paths. Requires Pillow and NumPy."""

from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "dist/assets/cases/poplavok"
OUTPUT = ROOT / "headings"


def trace(source, box, filename):
    with Image.open(ROOT / f"{source}.webp") as image:
        crop = image.convert("RGB").crop(box)
    pixels = np.asarray(crop, dtype=float)
    luminance = pixels[:, :, 0] * .2126 + pixels[:, :, 1] * .7152 + pixels[:, :, 2] * .0722
    alpha = np.uint8(np.clip((224 - luminance) * 255 / (224 - 45), 0, 255))
    enlarged = Image.fromarray(alpha).resize((crop.width * 4, crop.height * 4), Image.Resampling.LANCZOS)
    mask = np.pad(np.asarray(enlarged) > 95, 1)
    edges = defaultdict(list)
    for y, x in np.argwhere(mask):
        if not mask[y - 1, x]:
            edges[(x, y)].append((x + 1, y))
        if not mask[y, x + 1]:
            edges[(x + 1, y)].append((x + 1, y + 1))
        if not mask[y + 1, x]:
            edges[(x + 1, y + 1)].append((x, y + 1))
        if not mask[y, x - 1]:
            edges[(x, y + 1)].append((x, y))

    contours = []
    while edges:
        start = current = next(iter(edges))
        points = []
        while current in edges:
            points.append(current)
            target = edges[current].pop()
            if not edges[current]:
                del edges[current]
            current = target
            if current == start:
                break
        if current == start and len(points) >= 18:
            contours.append((np.asarray(points, dtype=float) - 1) / 4)

    # Smooth the pixel contours, retaining the original curves and counters.
    radius = 9
    weights = np.array([radius + 1 - abs(i) for i in range(-radius, radius + 1)], dtype=float)
    weights /= weights.sum()
    paths = []
    for contour in contours:
        if len(contour) < radius * 2:
            continue
        smooth = sum(np.roll(contour, i, axis=0) * w for i, w in zip(range(-radius, radius + 1), weights))[::3]
        path = f"M{smooth[0, 0]:.2f} {smooth[0, 1]:.2f}"
        path += "".join(f"L{x:.2f} {y:.2f}" for x, y in smooth[1:])
        paths.append(path + "Z")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {crop.width} {crop.height}">'
        f'<path fill="#302830" fill-rule="evenodd" d="{"".join(paths)}"/></svg>\n'
    )
    (OUTPUT / filename).write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    OUTPUT.mkdir(exist_ok=True)
    trace(3, (320, 340, 470, 395), "task.svg")
    trace(10, (280, 350, 500, 415), "result.svg")
