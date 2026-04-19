## Stack

- HTML / CSS / JS
- Hosted on GitHub Pages
- Cloudflare for DNS and Workers
- [apod-proxy](https://github.com/enosil/apod-proxy) Cloudflare Worker for NASA APOD data

## Features

- **Photoalbum** — tabbed gallery (Scenery / Pets) with shuffle, staggered pop-in animations, lightbox with keyboard/swipe navigation, and custom right-click protection
- **Astronomy Picture of the Day** — daily space imagery via a self-hosted Cloudflare Worker
- **Responsive** — mobile-friendly layout, swipe navigation in lightbox

## Structure

```
index.html              — page structure
style.css               — all styles
script.js               — gallery, lightbox, APOD, animations
images/                 — site icons and logo
gallery/                — photo files (.webp)
gallery/photos.json     — gallery metadata (source of truth)
scripts/optimize.py     — image conversion + JSON update script
.github/workflows/      — GitHub Actions
```

## Adding photos

**Via GitHub website (no tools needed):**

1. Go to the repo → `gallery/` → **Add file → Upload files**
2. Drop in a raw JPEG or PNG and click **Commit changes**
3. GitHub Actions runs automatically: converts it to WebP, adds a placeholder entry to `gallery/photos.json`
4. Open `gallery/photos.json`, click the pencil icon, find the new entry at the bottom (caption will be `""`), fill in the caption and set category to `"scenery"` or `"pets"`, then click **Commit changes**

**Locally:**

```bash
pip install Pillow
python scripts/optimize.py
# then edit gallery/photos.json to fill in caption and category
```
