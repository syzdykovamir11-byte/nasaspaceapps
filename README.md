# Field Tracker

2026 NASA Space Apps Challenge: **Field Shift: Adapting Farms with NASA Data**
https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/

## What it does

A farmer in northern Kazakhstan picks a place on the map. The page then shows four things:

1. **Season check.** How the 1 April–30 September growing season went in the area, compared with every other season there since 1981. It covers dry spells and frost days, gives a rank among 46 seasons, and shows a history bar for each season. Any past season can be opened.
2. **What you can do.** Actions for each threat, taken from FAO pages that we read in full, plus frost dates for the place: the median and the 9-in-10 dates for the last spring frost and the first autumn frost.
3. **A typical year.** For each month, the share of years with frost and the median precipitation.
4. **Compare rotations.** The farmer enters their 3-year rotation and how many days each crop needs from sowing to harvest. The tool shows the current rotation and up to 2 alternatives, so 3 strategies side by side whenever the rotation has a cereal, a repeated crop family, or a crop with FAO growing-period or water values (all common cases, including wheat-wheat-barley). Rotations made only of crops without FAO values (for example flax, rapeseed, fallow) get fewer, with a note saying why. The alternatives come from simple rules, each labelled as our rule: add a legume, use a crop that fits between the frosts more often, lower water need, or break the run of one crop family. Each card states why the alternative is suggested, the evidence, possible benefits, what the tool does not know, and what to ask an agronomist. The rules and the crop values have not been reviewed by an agronomist.

A map with three views: **Map**, **Satellite** (NASA GIBS MODIS true colour) and **Plant greenness (NDVI)** (NASA GIBS MODIS NDVI 8-day). The farmer can **draw their own field**. The tool shows its area and checks the field with a live NASA POWER request for its centre. Coordinates can also be typed.

The tool supports decisions. It does not replace the farmer's judgement or local advice.

## Data

| Dataset | Use | Resolution / coverage |
|---|---|---|
| NASA POWER Daily API: T2M_MIN, T2M_MAX, T2M, PRECTOTCORR | All weather results | ½° lat × ⅝° lon grid (about 56 × 40–44 km here), daily, 1981-01-01 to 2026-10-31. Seasons come from MERRA-2 (checked at the Astana point) |
| NASA POWER Daily API: GWETROOT (root-zone soil wetness, 0–1) | Soil moisture card: season average ranked against 1981–2025 | Same grid and days; model estimate (MERRA-2), not a field measurement. Snapshot in `data/soil/`, downloaded 2026-11-15 |
| FAO Training Manual 3 (Tables 4 and 5), FAO-56 Table 22 | Crop growing period, water need, rooting depth | Global guide values |
| Government of Saskatchewan, legume N fixation | Nitrogen | Canadian values, used as a stand-in (our choice) |
| FAO Conservation Agriculture; FAO Frost Protection, Ch. 8 | "What you can do" | Read in full on 2026-11-14 |
| NASA GIBS: MODIS Terra Corrected Reflectance True Color; MODIS Terra NDVI 8-day | Satellite and NDVI map views | Served at zoom level 9 (about 180 m/pixel here). True colour from 2000, NDVI from 2025-02-12. Online only |
| Natural Earth | Map borders | Public domain |

**Independent check.** POWER was compared with NOAA GHCN-Daily station Kustanai (WMO 28952, about 1 km from the "Near Kostanay" demo point): 25 growing seasons 1981–2005 for precipitation and 26 (1981–2006) for minimum temperature, the years the station record is complete. Per season: precipitation total r = 0.80 (POWER −6 mm on average), longest dry spell r = 0.87 (POWER's longest spell about 2 days shorter; without the extreme 1991 season r is 0.44, mean absolute difference 5 days), frost days r = 0.89 (POWER +4 days). Both frost dates fall about 2 days later in POWER, so the days between frosts differ by under 1 day on average; the wheat fit count (120 days) disagrees in 1 of 26 years, the lentil count (150 days, near the edge) in 6 of 26. The station's longest dry spell is also 1991, which the app ranks 1 of 46. Details and the per-year table: `data/stations/README.md`, `scripts/validate-station.py`.

The POWER responses are cached in `data/` so the demo runs offline. `data/README.md` records each request, the checks we ran and which source product covers which period. The in-app **Data & method** panel lists the processing steps and the limits.

## Run it (3 commands)

```bash
npm install
npm run dev      # prepares data/ into public/data/, then starts http://localhost:3000
npm test         # unit tests, including checks against an independent Python computation
```

`npm run build` builds a Next.js app with one server route, `/api/summary`, for the optional AI summary. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-3.5-flash-lite`) in `.env.local` locally or in the Vercel project's environment variables; see `.env.example`. Without the key everything else works and the summary box shows an error.

## What the challenge asks for, and what is built

| Challenge expectation | Status | Where, and which NASA data |
|---|---|---|
| Combine NASA Earth observations with local information in a decision-support tool | Built | NASA POWER daily data plus the farmer's own rotation, days from sowing to harvest, priority and field location |
| Highlight seasons when crops are more vulnerable | Partial | Dry spells and frost per season, ranked against 1981–2025 (POWER). Heat and heavy rain are not built: the list was cut to the two indices that could be checked against a station in time |
| Highlight times when fields are typically bare | Partial | The typical-year table (frost and rain by month, POWER) and each rotation's crop sequence. NDVI-based bare-field months are not built: at the demo points the 2026 MODIS NDVI showed no harvest drop, so no cropland pixel was confirmed |
| Compare at least three rotation strategies, including the current one | Built | Current rotation plus 2 alternatives (3 cards) for any rotation with a cereal, a repeated family or FAO-valued crops; fewer, with a note, for rotations of crops without FAO values |
| For each strategy: why, evidence, benefits, information gaps, risks for local review | Built | The five sections on every card; sources tagged [C1]–[C4] |
| Local soil information | Not built | No soil dataset was reachable in time; stated on every card |
| Farmer priorities and constraints | Partial | Priority (soil or water) orders the options; water availability, equipment and market are not modelled |
| Supports, does not replace, farmer judgement | Built | Disclaimer on screen; "Ask your agronomist" on every card |
| Farmer-centred design for people with little technical experience | Built | Plain words, icon + word + colour, phone layout, no login |
| NASA data as a core component | Built | Every weather number comes from NASA POWER; crop values come from FAO and Saskatchewan tables. NASA GIBS satellite and NDVI views are context only: no result is computed from them |

## Limits

- One grid cell covers tens of kilometres, so the results describe an area, not a field.
- POWER is a reanalysis, not station data.
- The traffic-light cut-offs, the season window and the alternative-building rules are our choices, not reviewed by an agronomist.
- POWER was checked against one station (Kustanai; 1981–2005 for precipitation, 1981–2006 for frost). The other demo points and the seasons after 2006 are not checked that way.
- The season window (1 Apr–30 Sep) and the 15 July split between spring and autumn frost were chosen for northern Kazakhstan. For a field elsewhere the counts still compute, but these choices should be checked first.
- English only. A Russian and Kazakh interface is planned.
- There is no soil, pest, price or market data, and no yield or income prediction.

## References

- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- NASA GIBS (WMTS): https://nasa-gibs.github.io/gibs-api-docs/
- NOAA GHCN-Daily, station KZ000028952 (Kustanai): https://www.ncei.noaa.gov/pub/data/ghcn/daily/
- FAO Irrigation Water Management Training Manual 3, Ch. 2: https://www.fao.org/4/s2022e/s2022e02.htm
- FAO Irrigation and Drainage Paper 56, Ch. 8: https://www.fao.org/4/x0490e/x0490e0e.htm
- Government of Saskatchewan, Green Manuring with Legumes; Inoculation of Pulse Crops
- FAO Conservation Agriculture, Soil organic cover; FAO Frost Protection, Ch. 8
- ETCCDI climate index definitions: https://etccdi.pacificclimate.org/list_27_indices.shtml
- Natural Earth (public domain borders): https://www.naturalearthdata.com/
- Leaflet and react-leaflet (map library), Next.js and React (app framework)
- Our team's earlier prototype, https://github.com/Almasx/nasa: its map ideas (a map / satellite / NDVI view switch, drawing a field on the map, the field area) were rebuilt here in new code with NASA data. No code or API keys from it are used.

## Use of AI

The team came up with the idea. An AI assistant (Claude) was used to write and test code, check data sources and draft text.

In the app, the optional "In plain words" box on the Crops tab is written by Google Gemini on request. It gets only the facts shown on the rotation cards and may cite only NASA POWER, FAO and the Government of Saskatchewan. The server rejects an answer that adds a number not in those facts, a web link, or another source (`src/lib/ai/summary.ts`). The box is labelled as AI-written.
