# Testing dev on a phone/LAN IP needs `allowedDevOrigins` or the page won't hydrate

Next.js 16 blocks cross-origin requests to dev-only assets/HMR chunks by
default. When you open `npm run dev` from another device via the machine's
LAN IP (e.g. `http://192.168.254.x:3000`), the origin isn't `localhost`, so
those chunks are blocked: the SSR HTML renders but the client JS never
hydrates. Symptom is deceptive — the page looks fine but **every button
does nothing** (the FAB, nav, etc.).

Fix: add the LAN origin(s) to `allowedDevOrigins` in
[next.config.ts](../next.config.ts) (hostname only, wildcards allowed like
`192.168.254.*`), then **restart the dev server** — config changes aren't
hot-reloaded. It's a dev-only option; `output: 'export'` production builds
ignore it.

Why it matters: the natural instinct is to debug the click handler, but the
handlers are fine — nothing is wired up because hydration failed. Check the
dev server terminal for the cross-origin warning before touching component
code.
