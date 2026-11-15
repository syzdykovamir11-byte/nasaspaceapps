# Brief

Filled 2026-11-14 from the team repo documents (copies in `.hackathon/ref/`) and the team's `CROP_TABLE.md` and `OPEN_ISSUES.md`.

## Challenge
Official title and link: *Field Shift: Adapting Farms with NASA Data*.
https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/

## Problem, one sentence
Farmers have a hard time choosing crop rotations that hold up against shifting heat, frost, dry spells and heavy rain. The challenge statement says this.

## User, one sentence
A farmer in northern Kazakhstan with no technical or GIS background. The region is a team decision.

## Core flow (max 3 steps)
1. The farmer marks a field location on a map.
2. The farmer sees how the latest season went at that place, compared with the place's own record since 1981. This appears as up to 4 threat cards (dry spells, heat, frost, heavy rain), each in plain words, with what can be done and a source.
3. The farmer compares 3 rotations (their current rotation and 2 alternatives). Each card shows why it is suggested, the evidence, benefits, gaps, and what to ask an agronomist.

## NASA datasets
| Dataset | Access (API / file) | Resolution and coverage | Access tested (Y/N) | Cached in data/ (Y/N) |
|---|---|---|---|---|
| NASA POWER Daily (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR) | REST API, no key | Meteorology on a ½° lat × ⅝° lon grid (POWER methodology page), daily, 1981 to near real time. Seasons from 1981 to 2026 come from MERRA-2 | Y (curl 2026-11-14; browser CORS confirmed by team) | Y, 4 demo points, 1981-01-01 to 2026-10-31 |
| SMAP soil moisture | Earthdata | Global, every 2–3 days | N | N |
| MODIS / Landsat NDVI | Earthdata / LP DAAC | 250 m / 30 m | N | N |

Non-NASA references: FAO (crop growing period, water need, rooting depth) and Government of Saskatchewan (legume nitrogen fixation). Details in the team's `CROP_TABLE.md`.

## Validity
What we claim (shipped as of slice 1, commit after d5c54a8):
- How the latest season (1 Apr–30 Sep 2026) in the area around a demo point ranks against the same area's seasons from 1981 to 2025, for dry spells (CDD) and frost days (FD). Both use ETCCDI definitions, counted inside the season only.

- Rotation comparison: the current rotation plus up to 2 alternatives, each made with a labelled team rule (add a legume, lower water need, more years with enough frost-free days). The core check: in how many years from 1981 to 2025 there were at least N days between the last spring frost and the first autumn frost. Frost means NASA POWER T2M_MIN below 0 °C, which is 2 m air temperature averaged over the grid cell. N is the farmer's own days from sowing to harvest; it defaults to FAO's shortest total growing period, which FAO calls a rough approximation. This is a count, not a requirement: many crops survive light frost, and the card says so next to the number. The water verdict compares only the swapped crop pair by the midpoints of their overlapping FAO ranges, with a 25 mm "about the same" band (our choice); the ranges themselves are shown. Nitrogen is shown as a Yes/No flag on the card, with Saskatchewan figures and source tags in the Evidence panel.
- What we do not claim about rotations: that a crop will succeed, anything about yield, income or prices (there is no data), or that the Saskatchewan values hold for Kazakhstan.

Also shipped (2026-11-15): "What you can do" actions with FAO sources on each threat card; frost dates (median and 9-in-10) linking threats to rotations; the typical-year month table; season picker with rank and history; the rotation comparison shows the current rotation plus up to 2 alternatives (legume, season fit, lower water, or break the run of one family, all labelled team rules; 3 cards for any rotation with a cereal, a repeated family or FAO-valued crops); the Data & method panel; Map / Satellite / NDVI views from NASA GIBS (display only, no result is computed from them); drawing or typing your own field with a live NASA POWER request; an independent check of POWER against the GHCN station Kustanai (data/stations/README.md).

Planned, not shipped. These must not be claimed in the pitch until they are built:
- Heat (TX90p) and heavy rain (Rx1day, R20mm) cards. Scope reason: the team's threat list was cut to the two indices that could be cross-checked against a station in the time available.
- Bare-field months from NDVI: the 2026 MODIS NDVI at the demo points (near towns) showed no harvest drop, so no cropland pixel was confirmed, and the feature was not built.
- Soil data, pest data, prices and markets, a Russian or Kazakh UI.
- Actions with sources on each card, plus the Data & method panel.

What we do not claim:
- Anything about a specific field. One POWER cell is about 55 km across.
- Crop damage or yield predictions. Red means "unusual for this place", not "crop damaged".
- That the Saskatchewan values hold for Kazakhstan. That is a team decision that needs an agronomist's check.
- Soil moisture or plant condition. These show as "not available yet" until the data is tested.

How a judge can check it:
- Now: each card's "How we know" section (index definition, parameter, point, date range, download date, grid size). Also the cached JSON in `data/` and its `README.md`, and the Python cross-check that the unit tests pin.
- Planned: a Data & method panel with request URLs and processing steps, and source links for each action.

## In scope (max 3)
- Map point → POWER data (cached for 4 demo points, live for other points) → threat cards plus year strip.
- Rotation comparison, 3 cards, built from the sourced crop table.
- Data & method panel, plus a "supports, not replaces, your judgement" line.

## Out of scope
- SMAP, slope, prices, pests, accounts, a Russian or Kazakh UI, and anything from the Rotation Lab prototype. (Field drawing and NDVI as a display layer were added on 2026-11-15 at the user's request; see plan.md.)

## Design direction
Mobile-first, one column, big touch targets, plain words. Colour is never the only signal: each card also has an icon and a word ("Unusual / Watch / Normal"). Calm and practical, a field-notebook feel. No banned styles (see AGENTS.md). Details to be decided in design-loop.

## Stack
Next.js + TypeScript (strict) for the UI, with data transforms in their own modules. Python only for offline data checks.

## Area assignments
- Claude Code: to confirm.
- Codex: works on a separate branch in this folder. Area to confirm.

## Demo script (30-second video or max 7 slides; 2026 rules confirmed by team)
See `.hackathon/demo.md` (30-second video storyboard and a 7-slide outline).

## Deadline and feature freeze
- Submission: Sunday 2026-11-15, 23:59, local time of the Local Event (Project Submission Guide, read by team 2026-11-14).
- Feature freeze: 2026-11-15, 20:59.
