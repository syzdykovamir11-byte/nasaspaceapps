# Plan: Gemini summary for crop cards + soil-quality source (draft, 15 Nov 2026)

Status (15 Nov, evening): user chose "Gemini + POWER soil moisture". Built: section 1 (option A, on-demand button, no build-time cache) and the NASA POWER GWETROOT soil-moisture card. SoilGrids and AIS GZK are not built.

## 1. Gemini plain-language summary on the Crops tab

Goal: one short summary in plain English above the three rotation cards.

Grounding rule (Validity): Gemini only rewrites facts the app already computed and shows. The request sends the card data as JSON (years each crop fits between the frosts, FAO water need, nitrogen flag, the evidence source tags, "What this tool does not know"). The prompt forbids new numbers, crops, yields, prices and sources, and allows only the sources listed in that JSON (FAO, NASA POWER, Government of Saskatchewan, and AIS GZK if part 2 is built). A check in code rejects any answer that contains a number missing from the input, and the app then shows no summary.

UI: a "Plain-language summary (AI, Gemini)" box with the AI-use label, the model name and the date. Loading, error and empty states. The cards stay the source of truth, and the summary is optional.

Key safety: the site is a static export (`output: "export"`), so a key in the browser would be public. Options:
- A. Add one server route `/api/summary` (Next route handler) and drop the static export. The key goes in `.env.local` and Vercel env vars. Works for any rotation the farmer enters.
- B. Keep the static export and generate summaries at build time only for the 4 demo places and their default rotations. Works offline, but there is no summary for custom rotations.
- Recommended: A, with B's cached summaries as the offline fallback for the demo path.

Files: `src/lib/ai/summary.ts` (prompt and number check), `src/app/api/summary/route.ts`, `src/components/RotationSummary.tsx` and its CSS, one line in `RotationSection.tsx`, a test, and a Data & method entry.

## 2. Soil quality from AIS GZK (aisgzk.kz, soil map "pch")

Findings (15 Nov):
- Publisher: the Land Cadastre department of NJSC "Government for Citizens" State Corporation (Land Code, Art. 44-1). The site describes itself as informational and reference only.
- The map uses ArcGIS services through the site's own proxy (`/aisgzk/Proxy/aisgzkPch/MapServer`). There is no documented public API. Direct requests return 404, and database access is by written application (the RBD request form on the site).
- The page does not show bonitet units or values without the interactive map.

Decision (user, 15 Nov): drop AIS GZK and use open sources.

## 2b. Soil alternatives (tested 15 Nov at the Kostanay demo point)

| Source | What it gives | Access | Test |
|---|---|---|---|
| NASA POWER (same API the app already uses) | GWETROOT root-zone soil wetness and GWETTOP surface soil wetness, 0–1 (unitless), monthly and daily from 1981, MERRA-2 | No key | Works. Kostanay root zone: 0.57–0.67 in 2023, 0.62–0.78 in 2024 |
| ISRIC SoilGrids 2.0 (WCS at maps.isric.org) | Organic carbon, pH, clay, sand, nitrogen at 0–5, 5–15 and 15–30 cm, 250 m, CC BY 4.0. Modelled values, not a survey of the field | No key | WCS works (GeoTIFF). The REST "query" API timed out at all 4 points |
| FAO/IIASA HWSD v2 | Soil type and properties, about 1 km | Bulk download only | Not tested |

Recommended:
- Add NASA POWER soil wetness to the Season tab as one more card or line (this season vs 1981–2025 at the same point). This is NASA data and covers the challenge's "soil moisture" item.
- Add SoilGrids topsoil values (SOC, pH, clay/sand) for the 4 demo places as a "Soil (modelled)" block on the Crops tab. A build script fetches them and saves them to `data/soil/` (offline). Gemini may cite them. Labelled as modelled 250 m estimates, not a field test, with the advice to get a lab soil test.
- Do not let soil values change the rotation rules. They are context only, since no rule mapping them to crops was agreed.
