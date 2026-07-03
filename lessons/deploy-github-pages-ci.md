# Deploy is GitHub Pages via static export on `main`, with two CI quirks

The app ships through [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):
a push to `main` runs `npm run build`, uploads the `out/` directory, and
deploys to GitHub Pages. So `next build` must produce a static export
(`out/`), not a server build — [next.config.ts](../next.config.ts) sets
`output: 'export'`. Don't introduce server-only Next.js features (server
actions, route handlers, ISR) that break static export.

Under GitHub Actions, [next.config.ts](../next.config.ts) also sets
`basePath: '/settleit'` and `assetPrefix: '/settleit/'` (gated on
`GITHUB_ACTIONS === 'true'`), and exposes `NEXT_PUBLIC_BASE_PATH`. Any
hand-built asset/link URL must go through that base path or it 404s on
Pages while working fine locally. `NEXT_PUBLIC_BUILD_VERSION` is
deliberately colon-free (`YYYY.MM.DD-HHMMSSGMT+8`) — keep it that way; the
colon removal was an intentional fix.

Two quirks in that workflow exist for a reason; don't remove them without
re-checking CI:

- **`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`** is set at the job env
  level so the GitHub Actions run on the Node 24 runtime the actions now
  require. Added deliberately (commit `2d33b5f`) to fix action failures.
- **`npm ci` is wrapped in `nick-fields/retry` (3 attempts).** Cold
  installs were flaky; the retry (commit `5faaf76`) is a workaround for
  transient registry failures, not redundant.

Why it matters: these are invisible from the app code, so an agent
"cleaning up" the workflow can silently break deploys. Runner uses Node 22
with npm cache.
