<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Start here

Read these before doing anything:

- [handoff.md](handoff.md) — architecture, conventions, engineering playbook, and the binding **Agent behavior rules** (§5).
- [lessons/README.md](lessons/README.md) — accumulated corrections and confirmed approaches, one lesson per file. Check it every session.

## Agent behavior rules

Full text in [handoff.md §5](handoff.md#5-agent-behavior-rules). Each bullet is one binding rule:

- **Anti over-engineering** — simplest thing that works; smallest viable diff; validate only at system boundaries. See [Avoiding over-engineering](handoff.md#avoiding-over-engineering).
- **Communication & reporting** — lead with the outcome; be selective, not compressed; audit every claim against session evidence. See [Communication & reporting](handoff.md#communication--reporting).
- **Assessment vs. action** — when the user is thinking out loud, deliver an assessment and stop; confirm evidence before state-changing commands. See [Assessment vs. action](handoff.md#assessment-vs-action).
- **Autonomous operation** — proceed on reversible, in-scope work without asking; pause only for destructive/irreversible actions or user-only input; finish promised work before ending the turn. See [Autonomous operation](handoff.md#autonomous-operation).
- **Delegation** — delegate independent subtasks and keep working; brief subagents with context they can't infer; verify their output. See [Delegation](handoff.md#delegation).
- **Lessons store** — record corrections and confirmed approaches in [lessons/](lessons/), one per file. See [Lessons store](handoff.md#lessons-store).
