# Documentation Maintenance Rules (Permanent)

These rules are mandatory for every future change in this repository.
Any AI or developer should follow this checklist after code edits.

## 1) Code Comment Rule

1. Every changed file must include clear explanatory comments for each major section.
2. Comments should explain purpose and flow, not only syntax.
3. New files must be commented from the start.

## 2) Docs Update Rule

After any feature or refactor:

1. Update `docs/context.md`
2. Update `docs/folder-and-file-purpose.md`
3. Update `docs/run-project-step-by-step.md` if run steps changed
4. Update `docs/project-timeline.md` with date-wise completed/pending status
5. If needed, update this file (`docs/documentation-maintenance-rules.md`)

## 3) Context Update Rule

`docs/context.md` must always include:

1. Current implemented modules
2. Current API endpoints
3. Environment status (DB/tools)
4. Next priorities
5. Resume prompt for AI after restart
6. User preferences/instructions
7. Link to current timeline in `docs/project-timeline.md`

## 4) Done Definition For Any Task

A task is complete only if:

1. Code changes are done
2. Comments are added/updated in changed files
3. Documentation files are updated
4. Basic verification command is run (`npm run smoke` when backend affected)

## 5) Commit Message Convention

Use messages that indicate both code + docs when applicable.

Examples:
1. `feat: add module X with comments and docs updates`
2. `refactor: update Y and sync context/runbook docs`
3. `docs: refresh context, file-purpose map, and run guide`

## 6) Beginner-First Writing Style

1. Use simple language.
2. Prefer step-by-step instructions.
3. Avoid assumptions that reader knows coding terms.
4. Include concrete command examples.
