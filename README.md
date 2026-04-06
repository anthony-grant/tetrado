# ▼ TETRADO

> Drop tasks. Stack your day. Clear your lines.

A Tetris-inspired task manager built as a PWA — works on iOS, Android, and desktop.

---

## Deploy to Vercel in 3 steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Launch TETRADO"
gh repo create tetrado --public --push
```

### 2. Deploy on Vercel
Go to [vercel.com](https://vercel.com), click **Add New Project**, import your GitHub repo. Vercel auto-detects Vite. Hit **Deploy**.

You'll get a live URL like `tetrado.vercel.app` in about 60 seconds.

### 3. (Optional) Custom domain
In Vercel → Settings → Domains, add your own domain (e.g. `tetrado.app`).

---

## Install as a PWA

**iOS Safari:** Share → Add to Home Screen  
**Android Chrome:** Menu → Add to Home Screen (or banner auto-appears)

---

## Add proper app icons

Replace the placeholder files in `public/icons/` with real PNGs:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use the SVG at `public/icons/icon.svg` as your design source.

Also replace `public/og-image.png` (1200×630px) for the LinkedIn share card.

---

## Run locally
```bash
npm install
npm run dev
```

---

## Tech
- React 18 + Vite
- localStorage for persistence
- Web Notifications API
- Service Worker for offline + background reminders
- Zero backend required
