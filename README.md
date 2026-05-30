# Settleit

A privacy-first, offline-capable expense splitter built with Next.js. Track who paid for what in shared events (trips, dinners, household bills) and get a minimal set of settlement transactions.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Purpose                     |
| --------------- | --------------------------- |
| `npm run dev`   | Start the Next.js dev server |
| `npm run build` | Production build            |
| `npm start`     | Run the production build    |
| `npm run lint`  | Lint with ESLint            |
| `npm test`      | Run the Jest test suite     |

## Project structure

```
src/
  app/              Next.js app router entry points and global styles
  components/       Presentational + interactive UI
  contexts/         React context providers (AppContext, ThemeContext)
  hooks/            Custom hooks
  lib/              Domain logic, services, and shared utilities
    messages.tsx    Centralized user-facing strings (i18n-ready)
    strategies/     Split-calculation strategies
test/               Jest tests mirroring the src/ layout
```

## Confirmations for destructive actions

Deleting an **event** or removing a **participant** opens a `ConfirmDialog`
that explains exactly what will be lost (expense counts, receipts, debts).
The dialog is accessible (`role="dialog"`, `aria-modal`, focus management,
Escape to cancel, click-outside to dismiss).

## Internationalization

All confirmation-flow strings live in
[src/lib/messages.tsx](src/lib/messages.tsx), grouped by feature
(`confirmDialog`, `events`, `participants`). Values that need variables
(names, counts) are exposed as functions, and a `plural()` helper handles
English plural forms.

To swap in a real i18n library later, replace the `messages` export with a
hook (e.g. `useMessages()`) that returns the same shape sourced from the
active locale. Component call sites won't need to change.

## Testing

Tests live under `test/` and use Jest + ts-jest with `jsdom`. Component
tests use `@testing-library/react`.

```bash
npm test
```

Coverage currently includes the reducer, split strategies, debt
simplification, storage/export services, the messages module, and the
`ConfirmDialog` component.
