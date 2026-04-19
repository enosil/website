#!/usr/bin/env python3
"""
Convert raw images in gallery/ to WebP and update gallery/photos.json.

Idempotent: safe to run multiple times.
  - Only converts JPEG/PNG that have no matching .webp yet.
  - Deletes source file after successful conversion.
  - Only appends new entries to photos.json; never overwrites existing ones.
"""

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip install Pillow")

GALLERY_DIR = Path(__file__).resolve().parent.parent / "gallery"
PHOTOS_JSON = GALLERY_DIR / "photos.json"
MAX_SIZE = 1600
QUALITY = 82
SOURCE_EXTS = {".jpg", ".jpeg", ".png", ".heic"}


def load_photos():
    if PHOTOS_JSON.exists():
        with open(PHOTOS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_photos(photos):
    with open(PHOTOS_JSON, "w", encoding="utf-8") as f:
        json.dump(photos, f, indent=2, ensure_ascii=False)
        f.write("\n")


def convert(src: Path) -> Path:
    dest = src.with_suffix(".webp")
    with Image.open(src) as img:
        img = img.convert("RGB")
        w, h = img.size
        if max(w, h) > MAX_SIZE:
            scale = MAX_SIZE / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        img.save(dest, "WEBP", quality=QUALITY, method=6)
    src.unlink()
    print(f"  converted: {src.name} -> {dest.name}")
    return dest


def main():
    if not GALLERY_DIR.is_dir():
        sys.exit(f"Gallery directory not found: {GALLERY_DIR}")

    photos = load_photos()
    existing_files = {entry["file"] for entry in photos}
    changed = False

    for src in sorted(GALLERY_DIR.iterdir()):
        if src.suffix.lower() not in SOURCE_EXTS:
            continue
        webp_name = src.with_suffix(".webp").name
        if not (GALLERY_DIR / webp_name).exists():
            convert(src)
            changed = True

    for webp in sorted(GALLERY_DIR.glob("*.webp")):
        if webp.name not in existing_files:
            photos.append({"file": webp.name, "category": "scenery", "caption": ""})
            existing_files.add(webp.name)
            print(f"  added placeholder: {webp.name}")
            changed = True

    if changed:
        save_photos(photos)
        print(f"  photos.json updated ({len(photos)} entries)")
    else:
        print("  nothing to do")


if __name__ == "__main__":
    main()
