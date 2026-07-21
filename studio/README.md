# ARC Studio (Sanity CMS)

Edit site content here — **no code changes** for day-to-day updates.

## What you can edit

| In Studio | On the live site |
|---|---|
| **Site Settings → Available for projects** | Homepage green/gray pill text |
| **Projects** (add / edit / reorder / media) | Modal client cards + demo reel |

Yes — the availability toggle is fully CMS-driven. Flip the switch → **Publish** → site updates within ~60s.

## First-time setup (one time)

1. **Log in to Sanity** (browser):
   ```bash
   cd studio
   npx sanity login
   ```

2. **Create the Sanity project** (or link an existing one):
   ```bash
   npx sanity init -y --create-project "ARC Web" --dataset production --project-plan free
   ```
   If init complains about the folder already existing, instead create a project at
   [sanity.io/manage](https://www.sanity.io/manage) → copy the **Project ID**, then:

   ```bash
   # studio/.env
   SANITY_STUDIO_PROJECT_ID=yourProjectId
   SANITY_STUDIO_DATASET=production
   ```

   And put the same id in `app.js` → `SANITY_PROJECT_ID`.

3. **CORS** — [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → CORS origins:
   - `http://localhost:5173`
   - `http://localhost:4173`
   - your live site URL (e.g. `https://….vercel.app`)
   - Leave **Allow credentials** unchecked

4. **Seed starter content**:
   ```bash
   npm run seed
   ```

5. **Run Studio locally**:
   ```bash
   npm run dev
   ```
   Opens http://localhost:3333

6. **Deploy Studio for the client**:
   ```bash
   npm run deploy
   ```
   → e.g. https://arc-web.sanity.studio

## Daily use

```bash
cd studio
npm run dev
```

- Toggle availability: **Site Settings** → flip → **Publish**
- Add a project: **Projects** → `+` → fill fields → upload mp4/photo → **Publish**
- Reorder: change **Display order** numbers
