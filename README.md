# YOLO Real Estate

Simple, lightweight property listing website.

## How it works

- **Users** browse properties on the homepage and order via WhatsApp: **075035540**
- **Admin** adds, edits, and removes listings at `/admin.html`

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

## Admin

- URL: http://localhost:3000/admin.html
- Password: `yolo2026` (change with `ADMIN_PASSWORD` env variable)

## Stack

- Plain HTML, CSS, JavaScript
- Tiny Express server (~60 lines)
- JSON file for data storage

No React, no Next.js, no build step.
