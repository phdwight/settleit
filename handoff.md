# Handoff — Settleit

A guide for future LLM agents (and humans) to ramp up on this codebase in one read.

---

## 1. What this app is

**Settleit** is a privacy-first, offline-capable **shared-expense splitter**.
Users create **events** (trip, dinner, household), add **participants**, log
**expenses** (with payers and split rules), and get a minimal set of
**settlement transactions** ("X owes Y $Z") that clear all debts.

Key product traits:

- **No backend, no account.** All data lives in the browser's `localStorage`.
- **PWA-style offline.** A service worker caches the shell so it runs without network.
- **Multi-payer aware.** A single expense can have several payers, each with their own amount.
- **Receipt attachments.** Optional base64 receipt image per expense.
- **Export / import.** Events can be serialized to JSON for backup or sharing.
- **Greedy debt simplification.** Minimizes the number of payback transactions.

---

## 2. Architecture

### Tech stack

- **Next.js 16** (App Router) — note the repo-level reminder in [AGENTS.md](AGENTS.md): this is *not* the Next.js most training data covers. Check `node_modules/next/dist/docs/` before assuming APIs.
- **React 19**, TypeScript, Tailwind v4.
- **Jest + ts-jest + jsdom + @testing-library/react** for tests.

### Layout

```
src/
  app/              Next.js App Router entry points + globals.css
    layout.tsx      Root layout (providers, theme, service worker)
    page.tsx        Single entry — routes to EventManager or active-event view
  components/       UI (all 'use client')
    Accordion.tsx          Generic collapsible panel
    ConfirmDialog.tsx      Reusable accessible modal for destructive actions
    EventManager.tsx       List/create/delete events
    ParticipantManager.tsx Add/remove participants in active event
    ExpenseForm.tsx        Create expenses (multi-payer, split type)
    ExpenseList.tsx        List/remove expenses, view receipts
    DebtSummary.tsx        Renders simplified debts
    Header.tsx, ThemeToggle.tsx, InstallPrompt.tsx, ...
  contexts/
    AppContext.tsx         Single source of truth for app state (reducer + useReducer)
    ThemeContext.tsx       Light/dark/system theme
  hooks/
    usePanelState.ts       Per-event accordion open/closed memory
  lib/
    types.ts               Domain types + interfaces (SplitStrategy, IStorageService)
    SplitCalculator.ts     Strategy registry/dispatcher
    strategies/
      EqualSplitStrategy.ts
      ManualSplitStrategy.ts
    DebtSimplifier.ts      Net-balance + greedy settlement
    StorageService.ts      localStorage adapter with legacy-data migration
    EventExportService.ts  JSON import/export
    generateId.ts          ID generation
    messages.tsx           Centralized user-facing strings (i18n-ready)
public/
  sw.js             Service worker (network-first, cache fallback)
  manifest.json     PWA manifest
test/               Jest tests mirroring src/ layout
```

### State management

A single React **reducer + Context** holds the entire app state:

```ts
AppState = { events: Event[]; activeEventId: string | null }
```

- All mutations dispatch through one `reducer` in [src/contexts/AppContext.tsx](src/contexts/AppContext.tsx).
- The reducer is **pure** and intentionally not exported; tests in
  [test/contexts/AppContext.test.ts](test/contexts/AppContext.test.ts) re-declare it to test in isolation. If you change reducer logic, change both places.
- Persistence is a side effect: `useEffect` saves `state` to `localStorage`
  on every change after initial hydration. Hydration is gated by an
  `initialized` flag so the first load doesn't clobber storage with
  `initialState`.
- Derived values (`activeEvent`, `participants`, `expenses`, `debts`) are
  computed in the provider and exposed via `useApp()`.

### Strategy pattern for splits

[`SplitCalculator`](src/lib/SplitCalculator.ts) holds a `Map<SplitType, SplitStrategy>`. New split modes (percentage, shares, by-item) are added by implementing `SplitStrategy` and calling `registerStrategy()`. Domain code never branches on split type — it asks the calculator.

### Debt simplification

[`DebtSimplifier.simplify`](src/lib/DebtSimplifier.ts):

1. Compute each participant's **net balance** (paid − owed) across all expenses.
2. Split into **creditors** (positive) and **debtors** (negative), rounded to cents.
3. Walk both lists greedily, emitting `from → to: amount` transactions until everyone is settled.

This is **not** the globally optimal min-transactions algorithm (that's NP-hard), but it's deterministic, fast, and usually optimal for realistic group sizes.

### Storage & migrations

[`StorageService`](src/lib/StorageService.ts) implements `IStorageService` (DIP-friendly). Notable behaviors:

- SSR-safe: every method checks `typeof window`.
- Silent failure on quota exceeded.
- **Auto-migrates legacy data**: pre-events shape `{ participants, expenses }` is wrapped into a default "My Event" on load.

### PWA / offline

- Service worker at [public/sw.js](public/sw.js) — network-first with cache fallback, cache name versioned (`settleit-v2`). Bump the version when changing the shell to evict old caches.
- Registered by `ServiceWorkerRegistration.tsx` in the client tree.

### Confirmations for destructive actions

[`ConfirmDialog`](src/components/ConfirmDialog.tsx) is the reusable modal.
Used by [`EventManager`](src/components/EventManager.tsx) (delete event) and
[`ParticipantManager`](src/components/ParticipantManager.tsx) (remove
participant). The participant dialog computes **impact** per pending
removal: how many expenses will be deleted (sole payer) vs. modified (share
removed). Accessibility: `role="dialog"`, `aria-modal`, autofocus, Escape
closes, click-outside closes.

### Internationalization-ready strings

All confirmation-flow copy lives in [src/lib/messages.tsx](src/lib/messages.tsx),
grouped by feature. Variable strings are exposed as **functions**, not
templates, so future locale data can be swapped in via a hook
(`useMessages()`) returning the same shape — no component changes required.
A small `plural()` helper handles English plural forms.

---

## 3. Functional decisions and unique attributes

These are choices that may not be obvious from the code alone.

### Privacy / persistence
- **No server, no telemetry.** Everything is local. Export/import is the only data-portability path.
- **localStorage, not IndexedDB.** Simpler API; size limits are acceptable because receipt images are downscaled before storage.
- **Receipt images stored as base64 data URLs** inside the expense object. This keeps export self-contained but inflates storage; downscaling on capture is intentional.

### Domain model
- **`paidBy` is an array** of `{ userId, amount }` to support multi-payer expenses. Legacy single-payer (`paidBy: string`) is still tolerated in the reducer's `REMOVE_PARTICIPANT` branch and in `DebtSimplifier` — preserve that compatibility when refactoring.
- **`splits` are precomputed** at expense creation time. If you mutate participants later, the reducer rewrites affected expenses; debts are recomputed live in the provider via `simplifier.simplify(expenses, participants)`.
- **Money is treated as cents internally for rounding** via the [`roundCents`](src/lib/money.ts) helper and the `MONEY_EPSILON` constant (0.005). Anything monetary should use these — do not inline `Math.round(x * 100) / 100`.

### UX
- **Single-page navigation.** [`page.tsx`](src/app/page.tsx) conditionally renders `EventManager` (event list) or the active-event accordion view. No router routes.
- **Per-event accordion memory.** [`usePanelState`](src/hooks/usePanelState.ts) persists which panels are open per event in a separate `settleit-panels` localStorage key.
- **Default open panel is Participants** — the first thing users need to do in a new event.
- **All client components.** Top of nearly every file: `'use client'`. This is a fully interactive SPA shell.

### Destructive actions
- **Every destructive action requires confirmation** with a clear consequence summary (counts of affected expenses, debts, receipts). Do not add new destructive flows without the same treatment — use `ConfirmDialog` + a `messages` entry.

### i18n
- **No i18n library yet**, but every new user-facing string MUST go through `src/lib/messages.tsx`. Inline string literals in components are a regression.

### Testing conventions
- Tests live under `test/` mirroring `src/`.
- Domain logic (`lib/`, reducer, strategies, simplifier) is unit-tested as pure functions.
- Components are tested with `@testing-library/react` + `jest-dom` (see [test/components/ConfirmDialog.test.tsx](test/components/ConfirmDialog.test.tsx) for the pattern).
- Path alias `@/*` → `src/*` is configured in both `tsconfig.json` and `jest.config.ts`.

### Build / scripts
- `npm run dev` — Next dev server on port 3000. Change the port with
  `npm run dev -- -p 4000` or `PORT=4000 npm run dev`.
- `npm run build` / `npm start` — production (static export to `./out`)
- `npm test` — Jest (currently 13 suites / 106 tests). Add `--coverage`
  for a report, `--watch` while developing, or a name to scope a suite.
- `npm run lint` — ESLint flat config

### Pitfalls to watch
- The reducer is **exported** from [src/contexts/AppContext.tsx](src/contexts/AppContext.tsx) and imported directly by [test/contexts/AppContext.test.ts](test/contexts/AppContext.test.ts) — one source of truth.
- Bump the SW `CACHE_NAME` whenever the shell changes meaningfully, or stale caches will haunt users.
- The repo's [AGENTS.md](AGENTS.md) warns that this Next.js version has breaking changes from older training data — verify APIs against `node_modules/next/dist/docs/` before relying on memory.
- Don't import server-only APIs into `lib/` modules; they're called from client components and tested under `jsdom`.

---

## 4. How to add functionality (engineering playbook)

Follow this loop for every change. It encodes the conventions already in
the codebase — deviating from it is a regression.

### The change loop

1. **Understand before you write.** Read the relevant `lib/` module and any
   neighbors that import it. Re-read `src/contexts/AppContext.tsx` if the
   change touches state.
2. **Decide where it lives** (see "Layering rules" below).
3. **Write or update tests first** for any non-trivial logic.
4. **Implement** the smallest change that makes the tests pass.
5. **Run `npm test` and `npm run lint`.** Both must be green.
6. **Update docs** if you changed shape, conventions, or added a feature
   (this file, README, and the `messages` module).

### Layering rules (SOLID in practice)

- **`src/lib/` is pure and framework-free.** No React imports. No DOM.
  Tested as pure functions under `jsdom`. This is where domain logic
  belongs.
- **`src/contexts/AppContext.tsx` is the only place that mutates state.**
  Components dispatch; they never reach into storage or services
  directly.
- **Components are thin.** They render, gather input, and call hooks /
  context methods. Business logic in a component is a smell — move it to
  `lib/` or the reducer.
- **Depend on interfaces, not implementations** (DIP). New services
  should define an interface in `src/lib/types.ts` (like
  `IStorageService`, `SplitStrategy`) and inject the concrete class at
  the provider level.
- **Extend via strategy, not `switch`** (OCP). A new split mode is a new
  `SplitStrategy` registered with `SplitCalculator`, not a branch in
  existing code. Apply the same pattern to any new "variant" feature
  (export formats, currency converters, rounding modes).
- **Single Responsibility per module.** If a file starts mixing
  storage + calculation + formatting, split it.

### DRY rules

- **One source of truth for state shape:** `src/lib/types.ts`. Don't
  redeclare `Event` / `Expense` locally.
- **One reducer.** Exported from `src/contexts/AppContext.tsx` and imported by its test. Don't re-declare it.
- **One messages module.** All user-facing strings go through
  `src/lib/messages.tsx`. Inline string literals in JSX are a regression.
- **One money helper.** Use [`roundCents`](src/lib/money.ts) and
  `MONEY_EPSILON` from `src/lib/money.ts` everywhere monetary values are
  rounded or compared to zero.
- **One confirmation pattern:** `ConfirmDialog` + a `messages` entry.
  Don't roll a new modal for a new destructive action.

### Avoiding over-engineering

The repo-level [implementationDiscipline](.) guidance applies here:

- Do the simplest thing that works well. Don't add features, refactor,
  or introduce abstractions beyond what the task needs, and don't design
  for hypothetical future requirements. Smallest viable diff wins;
  reuse beats abstraction. No premature abstraction, no half-finished
  implementations.
- Don't add abstractions for things that have one caller. Wait for the
  second use case before extracting. A one-shot operation usually
  doesn't need a helper.
- A bug fix doesn't need surrounding cleanup. No drive-by renames,
  refactors, or tidying of unrelated code — open a separate change.
- Don't add config knobs, plugin systems, feature flags, or
  backwards-compatibility shims speculatively. If you can just change
  the code, change it.
- Don't introduce new dependencies for problems the standard library or
  existing modules already solve. Prefer 20 lines of local code over a
  new package.
- **Validate only at system boundaries; trust internal code and
  framework guarantees elsewhere.** This repo's boundaries are:
  localStorage read/parse ([`StorageService`](src/lib/StorageService.ts)),
  JSON import ([`EventExportService`](src/lib/EventExportService.ts)),
  user input intake ([`ExpenseForm`](src/components/ExpenseForm.tsx),
  [`ParticipantManager`](src/components/ParticipantManager.tsx),
  [`NewEventForm`](src/components/NewEventForm.tsx)), and receipt image
  capture. Don't add error handling for impossible states between them.
- The **graceful-degradation code already at those boundaries is
  deliberate.** `StorageService`'s `typeof window` SSR guards, its
  silent quota-exceeded failure, and its legacy-data migration, plus the
  legacy single-payer (`paidBy: string`) tolerance in the reducer's
  `REMOVE_PARTICIPANT` branch and in `DebtSimplifier`, all guard real
  boundary cases. Don't strip them citing "no error handling for
  impossible states."
- Don't add docstrings/comments to code you didn't change.

### Tests — what to add, where

| Kind of change                            | Test location & style                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| New `lib/` module or pure function        | `test/lib/<Name>.test.ts` — pure unit tests, no React.                       |
| New / changed `SplitStrategy`             | `test/lib/strategies/<Name>.test.ts` — cover even split, remainder cents.    |
| Reducer action added / changed            | Update the reducer in `src/contexts/AppContext.tsx` and the imported reducer test in `test/contexts/AppContext.test.ts`. |
| New component with logic                  | `test/components/<Name>.test.tsx` using `@testing-library/react`.            |
| New `messages` entry with pluralization   | Add a case in `test/lib/messages.test.tsx` covering singular, plural, zero.  |
| New destructive action                    | Test that the confirm dialog opens and that cancel does **not** mutate.      |

Conventions:

- Use the path alias `@/...` in tests, never relative `../../src/...`.
- Prefer behavior-based assertions (`getByRole`, `getByText`) over
  implementation details (CSS classes, internal state).
- Mock `localStorage` / `URL.createObjectURL` only where unavoidable;
  `jsdom` provides them.

### Documentation

When you ship a change, update docs **in the same commit**:

- **`handoff.md` (this file)** — update if you changed architecture,
  layering, conventions, or added a feature category.
- **`README.md`** — update the scripts table, structure tree, or feature
  list if those changed.
- **`AGENTS.md` / `CLAUDE.md`** — only touch if a rule for AI agents
  changes.
- **JSDoc / inline comments** — add only when the *why* is non-obvious.
  Don't narrate the *what*.
- **Do not create new markdown files** unless the user asks for one or a
  new top-level concern (e.g. `SECURITY.md`) genuinely warrants it.

### Internationalization & localization checklist

Every user-visible change must remain i18n-ready:

1. **No string literals in JSX or alerts.** Add a key to
   [src/lib/messages.tsx](src/lib/messages.tsx) and reference it.
2. **Parameters use functions, not template concatenation** at call
   sites: `messages.events.deleteTitle(name)`, not
   `` `Delete ${name}` ``.
3. **Pluralization** goes through the `plural()` helper. If you need a
   new plural form (e.g. zero-special-case, languages with dual), extend
   `plural()` rather than inlining ternaries.
4. **No locale assumptions in `lib/`.** Don't format dates, numbers, or
   currency with hard-coded locales. Use `Intl.*` with the user's locale
   when the time comes; for now, raw values flow through unchanged.
5. **Direction & length agnostic UI.** Don't hard-code widths around
   English copy. Allow components to grow.
6. **Future swap path.** The `messages` export should remain a plain
   object/function map so it can be replaced by a `useMessages()` hook
   backed by a real i18n library (e.g. `formatjs`, `i18next`) without
   touching call sites.

### Pre-merge checklist

- [ ] Tests added/updated and `npm test` passes (all suites).
- [ ] `npm run lint` clean.
- [ ] New strings in `src/lib/messages.tsx`, with tests for any
      pluralization.
- [ ] Destructive actions go through `ConfirmDialog` with a clear
      consequence summary.
- [ ] Reducer changes mirrored in the test copy of the reducer.
- [ ] `handoff.md` / `README.md` updated if conventions or surface area
      changed.
- [ ] No new top-level dependencies added without a clear justification.
- [ ] Service worker `CACHE_NAME` bumped if the shell changed.

---

## 5. Agent behavior rules

These are **binding rules** for any AI coding agent working in this repo.
They govern how you work, not what the code does. The digest in
[AGENTS.md](AGENTS.md) links here; read both, plus
[lessons/README.md](lessons/README.md), before starting. Rule 1
(anti over-engineering) lives in section 4's
[Avoiding over-engineering](#avoiding-over-engineering) — its natural home.

### Communication & reporting

- **Lead with the outcome.** The first sentence after finishing answers
  "what happened" or "what did you find" — the TLDR the user would
  otherwise have to ask for. Supporting detail and reasoning come after.
  Readability matters more than raw brevity.
- **Be selective, not compressed.** Keep output short by dropping detail
  that wouldn't change what the reader does next — never by compressing
  into fragments, abbreviations, arrow chains (`A → B → fails`), or
  jargon.
- **Audit every claim against evidence before reporting.** Each progress
  claim must trace to a tool result from this session (a `npm test` run,
  a file read, a command's output). Report only work you can point to,
  and say explicitly when something is not yet verified.
- **Report outcomes faithfully.** Tests fail → say so and include the
  output. A step was skipped → say that. Done and verified → state it
  plainly, without hedging.
- **Terse shorthand between tool calls is fine; the final summary is
  not.** Write the final summary for a reader who saw none of the work:
  complete sentences, spelled-out terms, no labels you coined while
  working, each file / commit / flag in its own plain-language clause.
  If you must choose between short and clear, choose clear.
- **After a long unwatched stretch, the final message re-grounds the
  reader** rather than continuing: outcome first, then the one or two
  things you need from them, each explained as if new.

### Assessment vs. action

- When the user is describing a problem, asking a question, or thinking
  out loud rather than requesting a change, the deliverable is your
  **assessment** — report findings and stop. Don't apply a fix until
  they ask for one.
- Before running a command that changes system state (clearing
  localStorage / caches or unregistering the service worker in a debug
  session, rewriting git history, editing config, restarting the dev
  server), confirm the evidence supports *that specific action*. A
  symptom that pattern-matches a known failure may have a different
  cause here.

### Autonomous operation

- Assume the user is not watching in real time and cannot answer
  mid-task; asking "Want me to…?" / "Shall I…?" blocks the work. For
  **reversible** actions that follow from the request — editing files,
  adding tests, running `npm test` / `npm run lint` — proceed without
  asking.
- **Pausing is still required** for destructive or irreversible actions,
  real scope changes, and input only the user can provide (the
  state-changing commands listed under *Assessment vs. action*). This
  does not contradict "proceed without asking": reversible, in-scope
  work proceeds; irreversible or out-of-scope work pauses.
- Offering follow-ups after the task is done is fine; re-asking
  permission for work already agreed before starting is not.
- **Before ending your turn, re-read your last paragraph.** If it is a
  plan, an analysis, a question, a list of next steps, or a promise
  about undone work ("I'll…", "let me know when…"), do that work now
  with tool calls. End the turn only when the task is complete or you
  are blocked on input only the user can provide.
- Never stop, summarize, or suggest a new session on account of context
  limits.

### Delegation

- Delegate independent subtasks to subagents and keep working while they
  run. Intervene if one drifts off track or lacks context, and verify a
  subagent's output before building on it.
- Brief each subagent with the context it can't infer — the larger task,
  who it's for, and what its output enables — then the request: *"I'm
  working on &lt;the larger task&gt; for &lt;who it's for&gt;. They need
  &lt;what the output enables&gt;. With that in mind: &lt;request&gt;."*

### Lessons store

- Accumulated corrections and confirmed approaches live in
  [lessons/](lessons/); [lessons/README.md](lessons/README.md) states
  the contract. Read it at the start of every session.
- **One lesson per file, one-line summary at the top.** Record both
  corrections and confirmed approaches, including *why* they mattered.
  Don't save what this file, `README.md`, or chat history already
  records; update an existing note rather than duplicating; delete notes
  that turn out to be wrong (edit in place, never append-only).

---

## Quick orientation checklist for a new agent

1. Read [AGENTS.md](AGENTS.md) (Next.js version warning).
2. Skim [src/lib/types.ts](src/lib/types.ts) for the domain vocabulary.
3. Read [src/contexts/AppContext.tsx](src/contexts/AppContext.tsx) — it's the spine.
4. Read [src/lib/DebtSimplifier.ts](src/lib/DebtSimplifier.ts) and [src/lib/SplitCalculator.ts](src/lib/SplitCalculator.ts) for the math.
5. Check [src/lib/messages.tsx](src/lib/messages.tsx) before writing UI copy.
6. Run `npm test` to confirm the baseline before changing anything.
