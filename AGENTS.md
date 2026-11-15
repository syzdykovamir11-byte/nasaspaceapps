# NASA Space Apps project rules

Read `.hackathon/brief.md` before doing anything. If it is empty or contradicts the request, stop and ask.

## What this is judged on
Impact, Creativity, Validity, Relevance, Presentation. The project must answer one official challenge and must visibly use NASA (or partner agency) data. A polished UI on fake data fails Validity. A correct pipeline nobody can see in a demo fails Presentation. Build for both.

## Non-negotiables
- Real data only for anything presented as fact. Fetch from official NASA / partner APIs. Save a snapshot to `data/` so the demo runs offline.
- Never invent numbers, units, dates, coordinates, citations or quotes. Anything mocked is labelled "Sample data" in the UI and in code.
- Every number on screen has a unit, a source name and a date. One "Data & method" panel lists datasets, resolution, coverage and processing steps.
- State limits in the product: uncertainty, spatial and temporal resolution, what the tool does not do.
- The demo path never depends on a live API call. It reads the cached snapshot, and live refresh is optional.
- Sanity-check every data transform against the source: value ranges, units, missing-value flags, projection, time zone. Print a few raw rows next to the output.
- One core flow end to end beats five half features. Do not add anything outside "In scope" in the brief without asking.

## Workflow
1. Anything over about 30 minutes of work: write the plan to `.hackathon/plan.md` first and wait for approval.
2. Build a vertical slice first: real data in, one real result on screen. Polish and extra features come after.
3. Commit after every working slice with a clear message. Tag `demo-safe` whenever the demo path works end to end.
4. Feature freeze 3 hours before the deadline. After that: bug fixes, the data panel, README, demo script, recording.
5. Before saying "done": run the app, look at the real output, run typecheck, lint and tests where they exist. Report what you verified and what you did not.
6. Frontend work: use the `design-loop` skill. After a non-trivial UI change run `frontend-reviewer`, and `frontend-qa` if the page runs locally. Fix Blocker and Major findings.

## Code
- TypeScript strict. No `any`, no `@ts-ignore` without a comment saying why.
- Secrets in `.env.local`. Never commit them, never print them.
- Data fetching and transforms live in their own modules, separate from UI.
- Every async view has loading, error and empty states.
- No new dependency without a one-line reason. No refactors nobody asked for.
- README must have: what it does, which challenge, datasets, how to run in 3 commands.

## Copy and visuals
- No lorem ipsum, fake testimonials, invented statistics, or "AI-powered" filler.
- Follow the design direction in the brief. Banned: purple-blue gradients, glassmorphism cards, generic SaaS hero, emoji as icons.

## Parallel agents
- One agent per branch or git worktree. Do not edit files outside your assigned area. Assignments are in `.hackathon/brief.md`.
- Merge only when the app builds and the demo path works.

## Agents
- Choosing between ideas or judging one idea: `idea-killer`.
- Idea chosen, need data sources: `dataset-scout`.
- After changing code that fetches or transforms scientific data, and before a demo: `data-validator`.
- After the first working flow and before feature freeze: `judge-simulator`.

## Submission limits (2025 guide; confirm for this year)
- Demo: video up to 30 seconds or up to 7 slides. Over the limit means no global judging.
- Everything in English, video with English subtitles. Links public, no login.
- Disclose AI use. AI-generated images and video carry a visible watermark. No NASA branding in generated content.
