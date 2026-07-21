# CMS Setup Guide (Sanity)

The Studio lives in **`studio/`** inside this repo (schemas, structure, seed
script). The homepage **availability toggle is fully CMS-driven** — flip it in
Studio → Publish → live site updates in ~60s. No code change each time.

End state: your client logs into a web Studio, edits projects / uploads media /
flips availability, hits **Publish**, and the live site shows it on next load.

---

## Already done in this repo

- `studio/` — Sanity Studio with:
  - **Site Settings** (singleton) → `available` boolean
  - **Projects** → name, service, year, industry, website, media, order
- `app.js` — fetches from Sanity CDN when `SANITY_PROJECT_ID` is set; falls
  back to `content/site.json` otherwise

What you still need (one-time, needs your Sanity login):

1. Log in + create a Sanity project  
2. Paste the Project ID into `studio/.env` and `app.js`  
3. Add CORS origins  
4. Seed + deploy Studio  

---

## Step 1 — Log in & create the Sanity project

```bash
cd studio
npx sanity login --provider github   # or: --provider google
```

Complete the browser login, then create a project and write the ID:

```bash
# Creates a free project named "ARC Web" and prints the project id
npx sanity projects create --json
```

Or create it in the browser: [sanity.io/manage](https://www.sanity.io/manage) →
**Create project** → name it **ARC Web** → copy **Project ID**.

Create `studio/.env`:

```bash
SANITY_STUDIO_PROJECT_ID=yourProjectIdHere
SANITY_STUDIO_DATASET=production
```

And in `app.js`, set the same value:

```js
const SANITY_PROJECT_ID = "yourProjectIdHere";
```

---

## Step 2 — CORS (so the site can read data)

[sanity.io/manage](https://www.sanity.io/manage) → your project → **API** →
**CORS origins** → Add:

- `http://localhost:5173` (Vite dev)
- `http://localhost:4173` (Vite preview)
- your live URL (e.g. `https://arc-web.vercel.app`)

Leave **Allow credentials** unchecked. Dataset stays public for published reads.

---

## Step 3 — Seed starter content + run Studio

```bash
cd studio
npm install          # if needed
npm run seed         # Site Settings + one sample project
npm run dev          # http://localhost:3333
```

In Studio you should see **Site Settings** and **Projects**. Flip the
availability switch and hit **Publish** to test.

---

## Step 4 — Deploy Studio (client login URL)

```bash
cd studio
npm run deploy
# → pick subdomain arc-web → https://arc-web.sanity.studio
```

Invite the client: manage → **Members** → Invite → role **Editor**.

### Day-to-day for the client

- **Toggle availability:** Site Settings → flip → Publish  
- **Add a project:** Projects → `+` → fill fields → upload mp4/photo → Publish  
- **Reorder:** change Display order  
- Live site updates within ~a minute (CDN). No deploys.

---

## Schemas (reference)

**Site Settings** (`settings`) — singleton id `siteSettings`:

```js
{ name: 'available', type: 'boolean', initialValue: true }
```

**Project** (`project`):

```js
name, service, year, industry, website, websiteUrl, media (file), order
```

GROQ used by the site (in `app.js`):

```groq
{
  "available": coalesce(*[_id == "siteSettings"][0].available, true),
  "projects": *[_type == "project"] | order(order asc) {
    name, service, year, industry, website, websiteUrl,
    "media": media.asset->url
  }
}
```

---

## Costs & troubleshooting

Free tier covers a one-pager portfolio. Keep demo reels compressed (H.264 mp4).

| Symptom | Cause |
|---|---|
| Site still uses site.json | `SANITY_PROJECT_ID` still `REPLACE_ME` in `app.js` |
| CORS error in console | Origin missing in API → CORS (protocol + domain must match) |
| Edit not showing | Draft saved but not **Published**, or wait ~60s for CDN |
| Video won't autoplay | Must be muted mp4/H.264 (site already sets muted) |
