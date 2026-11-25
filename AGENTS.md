## Price data source (求Plan王)

Plan fees are based on https://findplanking.com/ (求Plan王) at **build time** via `src/lib/findplanking.ts`.

Priority:
1. Google Sheets CSV env vars (manual override)
2. Live findplanking aggregation (default foundation)
3. Tiny local fallback

### Monthly auto-update

GitHub Actions (`.github/workflows/deploy.yml`) runs on the **1st of each month** (`cron: 0 2 1 * *`, ~10:00 HKT):

1. Rebuilds the site (fresh findplanking prices + current month labels)
2. Saves a snapshot under `data/weekly/`
3. Redeploys to GitHub Pages

Manual run: GitHub → Actions → Deploy to GitHub Pages → Run workflow

```bash
node scripts/summarize-findplanking.mjs
```

Do not copy sales listing copy verbatim — aggregate street prices into our own plan rows.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
