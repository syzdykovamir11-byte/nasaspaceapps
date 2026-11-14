# Field Tracker

2026 NASA Space Apps Challenge — *Field Shift: Adapting Farms with NASA Data*
https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/

Status: first working prototype of the interface (2026-11-14). The NASA POWER request has not yet been tested from a real browser; see "Prototype" below.

## Prototype

```bash
npm install
npm run dev
```

Four steps: mark the field on the map → pick the current crop → field report (four threat cards and a year calendar) → three rotation options in a carousel.

- Weather data: live request to the NASA POWER Daily API (`T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, 1981 to the latest finished season), cached in the browser.
- Indicators: ETCCDI indices (FD, CDD, TX90p, Rx1day, R20mm). Colours rank the latest season against the same place's past seasons (`PROJECT_RISKS_AND_UI.md` section 4).
- Rotation options: keep the current crop; add a cover crop; add a legume. Growing periods from FAO Table 4. Every statement in the app links to a numbered source.
- Not tested yet: the POWER request and map tiles from a real browser. The development sandbox blocks both hosts, so the layout was checked with synthetic numbers that are not part of the app.
- Stack: Vite, React, Tailwind CSS, Leaflet (react-leaflet), Embla Carousel, lucide icons. Map tiles: Esri World Imagery and OpenStreetMap. List these in the submission References.

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

An AI assistant (Claude) was used to read and summarise the challenge pages and rules, check data source links, and draft and structure these documents, and write the prototype code. The idea of a field tracker with an intuitive interface came from the team.
