# Crop table for the rotation comparison

Written 2026-11-14. Target region (team decision): **northern Kazakhstan**.
The rule from section 1 of `PROJECT_CONCEPT.md` applies: every value below was read on the source page on 2026-11-14 and carries a source tag. A dash means the source does not list that crop; it is not a zero.

## 1. The table

| Crop | Growing period, days [C1] | Seasonal water need, mm [C1] | Max. effective rooting depth, m [C2] | Nitrogen fixed [C3] |
|---|---|---|---|---|
| Spring wheat | 120–150 | 450–650 | 1.0–1.5 | none (not a legume) |
| Barley | 120–150 | 450–650 | 1.0–1.5 | none |
| Oats | 120–150 | 450–650 | 1.0–1.5 | none |
| Flax | 150–220 | — | 1.0–1.5 | none |
| Rapeseed / canola | — | — | 1.0–1.5 | none |
| Sunflower | 125–130 | 600–1000 | 0.8–1.5 | none |
| Millet | 105–140 | 450–650 | 1.0–2.0 | none |
| Maize (grain) | 125–180 | 500–800 | 1.0–1.7 | none |
| Potato | 105–145 | 500–700 | 0.4–0.6 | none |
| Field pea (dry) | 90–100 | 350–500 | 0.6–1.0 | 80% of plant N from the air; 2–200 kg N/ha |
| Lentil | 150–170 | — | 0.6–0.8 | 80%; 10–150 kg N/ha |
| Chickpea | — | — | 0.6–1.0 | no figure; ranked between pea and lentil [C4] |
| Faba bean | — | — | — | 90%; 178–300 kg N/ha |
| Soybean | 135–150 | 450–700 | 0.6–1.3 | no figure; ranked below lentil [C4] |
| Alfalfa | 100–365 | 800–1600 | 1.0–2.0 (for hay) | 80%; 114–300 kg N/ha |
| Sweet clover | — | — | — | 90%; 5–250 kg N/ha |

## 2. How to read the values

- **Growing period and water need [C1]** are FAO "indicative" and "approximate" values for irrigation planning worldwide. FAO states they are rough approximations and that local values are better. Wheat, barley, and oats share one row in the source.
- **Rooting depth [C2]** is the FAO-56 range of maximum effective rooting depth. FAO notes the larger values are for soils with no layering that restricts roots, and are the ones to use for rainfed conditions.
- **Nitrogen fixed [C3]** comes from a Government of Saskatchewan table. The ranges are very wide; the source says the amount depends mostly on crop growing conditions.
- **Ranking [C4]:** the Government of Saskatchewan ranks pulses by estimated ability to fix nitrogen as faba bean > pea > chickling vetch > chickpea > lentil > soybean > lupin > dry bean, and says pulse crops can fix 50–80 per cent of their total nitrogen requirement under ideal conditions.

## 3. Limits (must be shown or respected in the app)

1. **No source here is from Kazakhstan.** C1 and C2 are global FAO references. C3 and C4 are from Saskatchewan, Canada. Using Saskatchewan as a climate analogue for northern Kazakhstan is a **team decision, not a verified fact**. An agronomist or a Kazakh source should confirm or replace these values.
2. **The crop list is a team decision.** It has not been checked against official statistics on what is grown in northern Kazakhstan. Search excerpts (pages not opened) mention spring wheat as the main crop in Akmola region and plans to expand lentil, pea, and oilseeds in North Kazakhstan region; treat this as unverified.
3. **Fallow** is common in dryland rotations but has no row here: no source for its effects has been read.
4. **Water need is for a full irrigated crop**, not what rain supplies. In the app it should be used only to compare crops with each other ("needs more / less water"), not to predict yield.
5. **Not covered:** erosion protection, market value, pest and disease breaks. No sources selected.

## 4. What the table already allows

- **Fit check:** flag a crop whose growing period is longer than the frost-free season computed from NASA POWER for the chosen point.
- **Water comparison:** rank the crops in a rotation by seasonal water need (pea lowest of those listed; sunflower and alfalfa highest).
- **Soil card:** mark rotations that include a nitrogen-fixing crop, and show the source range.
- **Rooting depth:** show which rotations mix shallow and deep roots (for example lentil 0.6–0.8 m with spring wheat 1.0–1.5 m).

## 5. Sources

| Tag | Title | URL | Read on |
|---|---|---|---|
| C1 | FAO, Irrigation Water Management: Training Manual No. 3, Chapter 2 "Crop water needs", Table 4 (total growing period) and Table 5 (seasonal crop water needs) | https://www.fao.org/4/s2022e/s2022e02.htm | 2026-11-14 |
| C2 | FAO Irrigation and Drainage Paper 56, Chapter 8, Table 22 "Ranges of maximum effective rooting depth (Zr), and soil water depletion fraction for no stress (p), for common crops" | https://www.fao.org/4/x0490e/x0490e0e.htm | 2026-11-14 |
| C3 | Government of Saskatchewan, "Green Manuring with Legumes", Table 1 "Nitrogen contribution of various types of legumes" | https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/crops-and-irrigation/soils-fertility-and-nutrients/green-manuring-with-legumes | 2026-11-14 |
| C4 | Government of Saskatchewan, "Inoculation of Pulse Crops" | https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/crops-and-irrigation/soils-fertility-and-nutrients/inoculation-of-pulse-crops | 2026-11-14 |

AI disclosure: an AI assistant (Claude) searched for these sources, opened the pages, and copied the values into this table. The choice of region is the team's.
