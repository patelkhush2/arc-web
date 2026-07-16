# CMS Setup Guide (Sanity)

Follow this after the site is hosted. End state: your client logs into a
web Studio, edits projects / uploads media / flips the availability toggle,
hits **Publish**, and the live site shows it on next page load. No rebuilds,
no code changes.

The site already renders everything from one JSON shape (see
`content/site.json`). The CMS just becomes the new source of that JSON —
step 4 is the only code change, ~10 lines.

---

## Step 0 — Host the site (prerequisite)

Any static host works. Easiest path:

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) (or Netlify/Cloudflare Pages) → "Import project" → pick the repo.
3. No build settings needed (it's plain HTML) — deploy.
4. Note your live URL, e.g. `https://arc-web.vercel.app`. You'll need it in Step 3.

---

## Step 1 — Create the Sanity project + schemas

On your machine (not in the site folder — keep the Studio as a sibling folder):

```bash
cd ~/Documents
npm create sanity@latest -- --template clean --create-project "ARC Web" --dataset production
# → sign in with Google/GitHub when prompted
# → project output folder: arc-studio (or whatever you prefer)
# → TypeScript: fine either way; the schemas below are plain JS
cd arc-studio
```

Create two schema files that mirror `content/site.json`:

**`schemaTypes/settings.js`** — the availability toggle:

```js
export default {
  name: 'settings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'available',
      title: 'Available for projects',
      type: 'boolean',
      initialValue: true,
    },
  ],
}
```

**`schemaTypes/project.js`** — one document per client project:

```js
export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    {name: 'name', title: 'Client name', type: 'string', validation: (r) => r.required()},
    {name: 'service', title: 'Service', type: 'string'},
    {name: 'year', title: 'Year', type: 'string'},
    {name: 'industry', title: 'Industry', type: 'string'},
    {name: 'website', title: 'Website label (shown on card)', type: 'string'},
    {name: 'websiteUrl', title: 'Website URL', type: 'url'},
    {
      name: 'media',
      title: 'Demo reel / photo (fills the dark box)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm,image/*'},
    },
    {name: 'order', title: 'Display order', type: 'number', initialValue: 1},
  ],
  orderings: [
    {title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
}
```

Register both in **`schemaTypes/index.js`**:

```js
import settings from './settings'
import project from './project'

export const schemaTypes = [settings, project]
```

Test locally: `npm run dev` → opens `http://localhost:3333`. You should see
"Site Settings" and "Project" in the sidebar. Create one Settings document
and one Project to have data to test with.

---

## Step 2 — Deploy the Studio (the client's login URL)

```bash
npx sanity deploy
# → pick a subdomain, e.g. arc-web  →  https://arc-web.sanity.studio
```

That URL is what you give your client. It's hosted by Sanity, always up to
date after you run `deploy` again following any schema change.

---

## Step 3 — Allow the live site to read the data (CORS)

**This is the step everyone forgets.** The browser will block the site's
requests until the site's domain is whitelisted:

1. Go to [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** tab.
2. Under **CORS origins** → Add origin:
   - `https://arc-web.vercel.app` (your real live URL)
   - `http://localhost:4173` (so local dev keeps working)
   - Leave **Allow credentials** unchecked (not needed for public reads).
3. While you're there, copy the **Project ID** from the top of the page —
   needed in Step 4.

The dataset is public by default, which is what you want: published content
is readable without tokens. Drafts stay private until the client hits Publish.

---

## Step 4 — Point the site at Sanity (the only code change)

In `app.js`, replace the `fetch("content/site.json")` block with:

```js
const SANITY_PROJECT = "YOUR_PROJECT_ID"; // from sanity.io/manage
const QUERY = encodeURIComponent(`{
  "available": *[_type == "settings"][0].available,
  "projects": *[_type == "project"] | order(order asc) {
    name, service, year, industry, website, websiteUrl,
    "media": media.asset->url
  }
}`);

fetch(`https://${SANITY_PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/production?query=${QUERY}`)
  .then((r) => r.json())
  .then(({ result }) => {
    site = result;
    renderAvailability();
    renderProject(0);
  })
  .catch((err) => console.warn("Sanity fetch failed:", err));
```

Notes:
- `apicdn.sanity.io` is the CDN endpoint — fast and cached (~60s to
  propagate after publishing; that's the "live" delay).
- No SDK, no npm install on the site — it stays dependency-free static HTML.
- Everything downstream (`renderAvailability`, `renderProject`, the modal
  morph, the media mounting) already consumes this exact shape.
- Push the change → host auto-redeploys → done. `content/site.json` can be
  deleted or kept as a fallback.

---

## Step 5 — Invite the client

1. [sanity.io/manage](https://www.sanity.io/manage) → project → **Members** → Invite.
2. Role: **Editor** (can create/edit/publish content, can't break schemas or settings).
3. They sign in at `https://arc-web.sanity.studio` with Google/email.

### What the client's day-to-day looks like

- **Toggle availability:** Studio → Site Settings → flip the switch → Publish.
- **Add a project:** Studio → Project → "+" → fill name/service/year/industry/website → drag an mp4 or photo into Media → Publish.
- **Reorder:** change the "Display order" number.
- Changes appear on the live site within ~a minute (CDN cache), no deploys.

---

## Costs & limits (as of mid-2026 — verify at sanity.io/pricing)

The free tier comfortably covers a one-pager portfolio: generous API
requests, asset storage measured in GB, 3 user seats. The thing to watch is
**video**: keep demo reels compressed (H.264 mp4, ~10–50MB). If the client
starts uploading many large videos, move video (only) to Mux or Cloudinary
and keep Sanity for everything else — the `media` field just becomes a URL
string, and the site code doesn't care where the file lives.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Site shows fallback/no content, console shows CORS error | Step 3 origin missing or misspelled (must match protocol + domain exactly) |
| Client's edit not showing | They saved a draft but didn't hit **Publish** |
| Edit published but site stale | CDN cache — wait ~60s, hard-refresh |
| Video doesn't autoplay | Must be muted to autoplay (the site sets this) — check the file is actually a video, not a .mov the browser can't decode; use mp4/H.264 |
