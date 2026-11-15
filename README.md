# Field Tracker

2026 NASA Space Apps Challenge — *Field Shift: Adapting Farms with NASA Data*
https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/

Status: the app is a copy of a teammate's code, https://github.com/Almasx/nasa (commit `4f51cff`, copied 2026-11-15). Design and functions are unchanged. One line differs: the Mapbox token is read from `.env` (see Run). The earlier Vite prototype is in the git history.

## App

Next.js 14, Tailwind CSS, Mapbox GL with Mapbox Draw, AgroMonitoring API, Postgres through Drizzle ORM.

What it does:

- Satellite map (Mapbox `standard-satellite` style).
- "+" in the Fields panel starts drawing a polygon. Polygons of 1 ha or more open the "Create new field" form (crop, name).
- On create, the field is registered as a polygon in AgroMonitoring and saved to the `fields` table.
- Clicking a field loads satellite imagery for the selected date from AgroMonitoring and shows MIN, MEDIAN and MAX for the vegetation indices it returns, plus six indicator cards.
- Date switch at the top. NVDI / Satellite switch on the left.

### Run

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`: the teammate's Supabase database URL. It is not in the repository.
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: the Mapbox token from line 14 of `src/features/map/index.tsx` in https://github.com/Almasx/nasa. GitHub push protection blocks this token in our repository, so it lives in `.env`.
2. Create the table:

```bash
npx drizzle-kit push
```

3. Start:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Keys: the AgroMonitoring keys are written in the code (`src/lib/logic/index.ts`, `src/app/api/route.ts`), as in the original repository. The Mapbox token is the one change from the original: it is read from `NEXT_PUBLIC_MAPBOX_TOKEN`.

### Known limits of the copied code

Checked by reading the code on 2026-11-15:

- The six indicator cards are computed from fixed default numbers in `src/lib/store/use-metrics.tsx`. `setData` is never called, so the cards show the same result for every field.
- The NDVI layer is one fixed image URL with fixed coordinates near 37.03° N, 120.92° W (California), in `src/features/map/index.tsx`.
- The NVDI / Satellite switch changes state but does not change the map.
- Requests to AgroMonitoring use `http://`, not `https://`.
- Tested here: the page renders with a local Postgres. Not tested here: Mapbox and AgroMonitoring, because the development sandbox blocks both hosts.

## Idea

An app that tracks the field the user selects. The farmer picks a field on a map, sees how it is doing based on NASA data in plain language, and compares at least three crop-rotation options, including the current one. The interface must be intuitive for farmers without technical background.

## Documents

| File | What it contains |
|---|---|
| [PROJECT_CONCEPT.md](PROJECT_CONCEPT.md) | Problem, challenge expectations, our idea, interface principles, data sources, rules. **Start here.** |
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | Screens, how the app works, data plan, rotation comparison, build order. *Test version, will be revised.* |
| [SOURCES_CHECK.md](SOURCES_CHECK.md) | Results of checking every data source listed in the challenge resources |
| [PROJECT_RISKS_AND_UI.md](PROJECT_RISKS_AND_UI.md) | Simplified interface, threat cards, analysis logic with standard climate indices |
| [COMPETITORS.md](COMPETITORS.md) | Checked competitor claims (OneSoil, EOSDA, xarvio, Cropwise, FieldView), corrections, sourced differences |

## Mandatory rule

Use only existing, verifiable information, and always cite the source. Details in section 1 of `PROJECT_CONCEPT.md`.

## Data

Confirmed working: **NASA POWER** Daily API — global daily temperature and precipitation, no API key needed (tested 2026-11-14). Other datasets are listed in `PROJECT_CONCEPT.md` and `SOURCES_CHECK.md`.

## AI disclosure

An AI assistant (Claude) was used to read and summarise the challenge pages and rules, check data source links, and draft and structure these documents, write the earlier prototype code, and copy the teammate's app into this repository. The idea of a field tracker with an intuitive interface came from the team.
