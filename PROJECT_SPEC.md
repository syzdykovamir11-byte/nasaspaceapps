# Project Specification: Field Tracker

Status: design only, nothing is built. Last updated: 2026-11-14.

> **Draft for testing.** The screens (section 2) and the app logic (sections 3–6) are a first test version. They will be revised and refined by the team; nothing here is final.

Companion to `PROJECT_CONCEPT.md`. The rule from section 1 of that file applies here: facts carry a source tag; everything else is a team decision or a proposal and is labelled as such. Source list: section 10.

Everything in sections 2–8 is a **proposal for the team to confirm**, unless tagged with a source.

## 1. What the product is

A mobile-first web app in which a farmer selects a field, sees how that field is doing based on NASA data, and compares three crop-rotation options for it. It answers the challenge request for a decision-support tool that helps farmers explore rotation strategies [S1].

Proposed format: a website that works on a phone, because the project link must open for judges without login or installation [S4].

## 2. Screens

*Test version — layout and content will be reworked.*

### Screen 1 — Choose your field
- A map. The farmer searches for a place or pans to it, then taps the field.
- One button: "Use this field".
- First version uses a single point (latitude and longitude). Drawing field boundaries is a later step.

### Screen 2 — Tell us about the field
- "What grows here now?" — pick crops from a list with pictures, in the order they are grown. This is the existing rotation, which the challenge asks to include in the comparison [S1].
- "What matters most?" — pick one or two: save water, improve soil, earn more. The challenge suggests letting farmers enter their priorities [S1].
- Optional: "Is water limited?" yes / no.

### Screen 3 — My field (main screen)
Answers "how is my field?" at a glance.
- **Status cards**, each green, yellow, or red with one plain sentence:
  - Temperature and frost
  - Rain
  - Soil moisture
  - Plant condition
- **Year calendar**: twelve months in a row, marking frost months, hot months, dry months, and months when the field is bare. The challenge asks to highlight bare-field times and seasons when crops are vulnerable [S1].
- Each card opens a detail view: a chart, a plain-language explanation of the term, the dataset name, and a note on how coarse the data is.
- Button: "What should I plant next?"

### Screen 4 — Rotation options
- Three cards: the current rotation and two alternatives [S1].
- Each card shows, in this order [S1]:
  1. the crop sequence;
  2. how well it matches the farmer's priorities;
  3. why it was suggested;
  4. what data supports it;
  5. expected benefits;
  6. what the app does not know;
  7. what to check with a local agronomist.
- The year calendar from screen 3 is repeated under each card with that rotation's crops laid over it, so the farmer sees which months each option leaves the field bare or exposed.

### Always visible
- A line stating that the app supports decisions and does not replace the farmer's judgment or local expertise [S1].
- A "Sources" link listing every dataset and reference used.

## 3. How it works

*Test version — the logic will be reworked.*

1. The farmer taps the map. The app stores latitude and longitude.
2. The app requests daily weather history for that point from NASA POWER.
3. The app turns the daily values into monthly summaries and the indicators in section 5.
4. The app compares the indicators with the needs of each crop (section 6) and scores each rotation against the farmer's priorities.
5. The app shows the status cards, the calendar, and the three rotation cards. Every card names the dataset it came from.

## 4. Data plan

### Step 1 — NASA POWER (start here)
Verified from the NASA POWER documentation [S6]:
- The Daily API returns analysis-ready time series of solar and meteorological data for use directly by applications.
- It provides daily average, maximum, and minimum values.
- Coverage is a 0.5° × 0.5° global grid.
- Daily data runs from 1981-01-01 to near real time.
- Single-point requests can return JSON or CSV.
- Up to 20 parameters per single-point request.
- Documented request form: `/api/temporal/daily/point?parameters=T2M&community=SB&longitude=0&latitude=0&start=20170101&end=20170201&format=JSON`
- Repeatedly requesting the same location may get an application blocked, so results should be stored and reused.
- Live test on 2026-11-14: a request for `T2M`, `T2M_MAX`, `T2M_MIN`, and `PRECTOTCORR` returned daily values in JSON without any key or login. Details in `SOURCES_CHECK.md`.

Consequence for the app: one POWER grid cell is far larger than a single field, so POWER describes the climate of the area, not differences inside the field. The app must say this on the detail view.

The challenge resources describe POWER as providing temperature, humidity, radiation, and derived indicators that help estimate crop water use, growing-season conditions, frost risk, and climate suitability for potential rotation crops [S2].

### Step 2 — add if time allows
Descriptions from the challenge resources [S2]:
- SMAP: surface soil moisture and freeze/thaw state every 2–3 days → soil-moisture card.
- GPM / IMERG: precipitation rate and accumulation → rain card, extreme storms.
- Landsat or MODIS: NDVI and vegetation indices, bare ground → plant-condition card and bare-field months.
- SRTM: elevation → slope and erosion risk.
- FAO GAEZ: crop suitability layers → check whether a candidate crop suits the location.

Until step 2 is done, the soil-moisture and plant-condition cards are shown as "not available yet". They are never filled with invented values.

## 5. Indicators

| Indicator | Computed from | Shown as |
|---|---|---|
| Frost months | daily minimum temperature | calendar marks |
| Frost-free season length | first and last frost dates | number of days |
| Hot months | daily maximum temperature | calendar marks |
| Monthly rainfall | daily precipitation | chart, dry-month marks |
| Year-to-year change | same indicators across past years | "wetter / drier / warmer than usual" |
| Bare-field months | farmer's crop list plus growing-period lengths | calendar marks |

Thresholds for "hot", "dry", and the green / yellow / red boundaries are not chosen yet. Each must come from a cited agronomic source before it is used (section 9).

## 6. Rotation comparison

- **Crop table.** One row per crop with the properties needed for scoring. Every value must have a source.
  - Growing-period length: FAO gives indicative values, for example wheat/barley/oats 120–150 days, soybean 135–150, sunflower 125–130, grain maize 125–180, potato 105–145, alfalfa 100–365. FAO notes these are rough approximations and local values are better [S7].
  - Water need, nitrogen fixing, rooting depth, erosion protection, market value: sources not selected yet (section 9).
- **Fit check.** A crop is flagged if its growing period is longer than the frost-free season at the location.
- **Scoring.** Each rotation gets a score per priority (water, soil, income). The farmer's chosen priorities weigh more. The method is a simple, explainable set of rules, so that each card can state why it was suggested, as the challenge asks [S1].
- **Alternatives.** Built by changing one element of the current rotation at a time, for example adding a legume or a cover crop in a bare-field window. The challenge names nitrogen-fixing, cover, deep-rooting, and drought-tolerant crops as options to explain [S1].
- **Honesty.** Each card lists what was not considered: local soil, pests, prices, equipment.

## 7. Proposed technology

Team decision pending. A simple option:
- Front end: one web page with a map library and a chart library.
- Data: direct requests to NASA POWER from the page or from a small server that stores results.
- Hosting: any public static host; code in the team GitHub repository.

All libraries, code, and images used must be listed in the References field at submission [S4].

## 8. Build order

1. Screen 1 and screen 3 with NASA POWER only: map, point, temperature and rain cards, year calendar.
2. Screen 2 and screen 4 with a small sourced crop table and three rotation cards.
3. Plain-language explanations and the sources page.
4. Step-2 datasets, if time remains.
5. Demo: at most 7 slides or a video of at most 30 seconds, in English [S4].

Submission closes Sunday, November 15, 2026, 11:59 p.m. local time of the team's Local Event [S4]. Step 1 alone already uses NASA data as a core component, which the Relevance criterion asks for [S3].

## 9. Not yet verified

- Access methods for SMAP, IMERG, Landsat, MODIS, SRTM, and GAEZ. Link-level results are in `SOURCES_CHECK.md`.
- Sources for crop water need, nitrogen fixing, rooting depth, erosion protection, and market value.
- Sources for the thresholds in section 5.
- Target region, interface language, hosting.

## 10. Sources

| Tag | Title | URL | Read on |
|---|---|---|---|
| S1 | Field Shift: Adapting Farms with NASA Data — challenge details | https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/ | 2026-11-14 |
| S2 | Same challenge — Resources tab | https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources | 2026-11-14 |
| S3 | Judging & Awards Guide | https://www.spaceappschallenge.org/resources/judging-awards-guide/ | 2026-11-14 |
| S4 | Project Submission Guide | https://www.spaceappschallenge.org/resources/project-submission-guide/ | 2026-11-14 |
| S6 | NASA POWER Docs — Daily API | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | 2026-11-14 |
| S7 | FAO, Irrigation Water Management training manual, Chapter 2: Crop Water Needs, Table 4 | https://www.fao.org/4/s2022e/s2022e02.htm | 2026-11-14 |

AI disclosure: this specification was drafted with an AI assistant (Claude) from the team's idea of a field tracker with an intuitive interface.
