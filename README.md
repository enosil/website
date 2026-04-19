## Stack

- HTML / CSS / JS
- Hosted on GitHub Pages
- Cloudflare for DNS and Workers
- [apod-proxy](https://github.com/enosil/apod-proxy) Cloudflare Worker for NASA APOD data

## Features

- **Desktop UI** — draggable, resizable windows with minimize/maximize/close
- **Floating dock** — app launcher below the hero section
- **Photoalbum** — tabbed photo gallery (Scenery / Pets) with shuffle, staggered pop-in animations, lightbox with keyboard navigation, and custom right-click menu
- **Astronomy Picture of the Day** — fetches daily space imagery via a self-hosted Cloudflare Worker that scrapes NASA's APOD page
- **ISS Tracker** — live interactive map showing the International Space Station's real-time position, with orbital trail, info panel, and auto-follow mode. Uses [Leaflet](https://leafletjs.com/) with CartoDB dark tiles and the [Where The ISS At](https://wheretheiss.at/) API
- **Responsive** — windows auto-fullscreen on mobile, swipe navigation in lightbox

## Structure

```
index.html      — page structure and content
style.css       — all styles
script.js       — window management, gallery, APOD, ISS tracker, lightbox, animations
images/         — site icons and logo
gallery/        — photo gallery images
```

## Adding a new window

1. Add a `dock-item` div inside the `.dock` in `index.html`
2. Add a `.window` div with titlebar and body
3. Register it in `script.js` with `initWindow('name')`

## Adding photos

Add an `<img>` inside a `.gallery-item` div in the gallery section of `index.html` with a `data-category` and `data-caption` attribute.
