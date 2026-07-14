# YOLO Real Estate — User + Admin (Supabase)

Two websites connected by **Supabase** (Postgres + Auth + Storage):

| Site | URL (local) | Role |
|------|-------------|------|
| **User** | http://localhost:3000/ | Browse rentals, filter, WhatsApp inquire |
| **Admin** | http://localhost:3000/admin/ | Login, create / update / delete rentals + upload photos |

```
User ──read──► Supabase ◄──write── Admin
                  ▲
             Email Auth + Storage
```

## Run locally

```bash
npm install
npm start
```

## One-time Supabase setup

1. Create an access token: https://supabase.com/dashboard/account/tokens
2. Create project + write config + apply schema:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
```

3. In Supabase Dashboard → **Authentication → Users → Add user**  
   (e.g. `boyzeus11@gmail.com` + password)
4. Open http://localhost:3000/admin/ → login → add rentals (upload photos from device)

### Manual fallback

If the script cannot apply SQL, paste [`shared/schema.sql`](shared/schema.sql) into the SQL Editor, then put URL + anon key into [`shared/supabase-config.js`](shared/supabase-config.js).

## Project layout

```
user/              # Public rental website
admin/             # Admin website (Auth + CRUD + image upload)
shared/
  supabase.js         # Client helpers
  supabase-config.js  # URL + anon key
  schema.sql          # Tables, RLS, storage bucket
scripts/setup-supabase.mjs
server.js             # Static file server
```

## Data model (`properties`)

| Column | Notes |
|--------|--------|
| title, description | text |
| price | monthly rent (TZS) |
| listing_type | always `rent` |
| property_type | house / apartment / room / commercial |
| location, city | text |
| bedrooms, bathrooms, area | numbers |
| image | public Storage URL |
| featured | boolean |

Photos upload from the admin device to the **`properties`** Storage bucket (public read, auth write).

## Stack

- Plain HTML / CSS / JavaScript
- Supabase (Auth, Postgres, Storage)
- Express (static only)
