# Field Tracker: adapted concept, simple interface, and risk logic

Status: design draft, nothing is built. Written 2026-11-14.
Companion to `PROJECT_CONCEPT.md`, `PROJECT_SPEC.md` and `SOURCES_CHECK.md`. The rule from section 1 of `PROJECT_CONCEPT.md` applies here: every fact carries a source tag such as `[S3]`; team decisions are labelled as decisions; nothing is described as working until it works.

> **Draft for the team to confirm.** Everything marked *Decision* is a proposal, not a fact. Everything marked *Not verified* must not be shown to judges as fact.

## 1. What changed compared with the earlier spec

The team's flow is now:

1. The farmer marks a location on the map.
2. The app analyses that place using NASA data and says how the season went, in plain words.
3. The app lists the **threats** found for that place and, for each threat, **how to reduce it**.
4. Crop-rotation options (at least three, including the current one, as the challenge asks [S15]) attach to the threats: for example a cover crop in a bare-field window, or a legume in the rotation. This part is described in `PROJECT_SPEC.md` section 6 and is not repeated here.

The interface is deliberately **much simpler** than the example product the team started from (section 2).

## 2. The example product and why it is too complex for farmers

*Team material, not a source.* The team supplied a 36-second screen recording and a screenshot of an example field-monitoring product. What it shows:

- A satellite map; fields listed on the left; a field is drawn by clicking its corners and then named (for example "Tomato").
- A switch between "NVDI" and "Satellite" and a date selector with arrows.
- Six score cards with bars: Vegetation Stress, Water Deficiency, Drought & Pest Vulnerability, Crop Productivity, Pesticide Efficiency, Soil & Vegetation Health.
- A table of six vegetation and water indices (NDVI, EVI, EVI2, NRI, DSWI, NDWI), each with minimum, median and maximum values.

*Decision (why we simplify):* a farmer with no technical background cannot act on six index tables. The cards have bars but no sentence saying what is wrong or what to do. The example gives no explanation of terms, which the challenge suggests doing [S15].

| Keep | Drop | Add |
|---|---|---|
| Map with satellite view; tap to choose the place | Index tables (NDVI, EVI, EVI2, NRI, DSWI, NDWI) on the main screen | One plain sentence per threat |
| Colour status per topic | Drawing field boundaries in the first version (single point first, see `PROJECT_SPEC.md` screen 1) | "What you can do" for each threat, with a source |
| Date / season context | Six score cards with unexplained bars | "Where we are unsure / ask your agronomist" line on every threat |

## 3. Interface (Decision, first test version)

### 3.1 Rules

1. **Two screens.** Screen 1 asks one question ("Where is your field?"). Screen 2 answers one question ("How was your season, and what can go wrong?").
2. **At most four threat cards**, sorted by urgency, red first.
3. **Colour is never the only signal.** Each card has a colour, an icon and a word ("Unusual", "Watch", "Normal").
4. **Plain words on the main level.** Terms such as CDD or TX90p never appear on a card. They appear only in the "How we know" detail, with the definition and source.
5. **Tap to open.** Card closed: one sentence. Card open: what the data shows, what you can do, what to ask an agronomist, source.
6. **Big touch targets, one column, works on a phone** [S16: the project link must open for judges without login or installation].
7. **Always visible:** "This tool supports your decisions. It does not replace your own judgement or local agricultural advice" [S15], and a "Sources" link.
8. **Language:** English for submission (the project page and linked materials must be in English [S16]). A Russian switch is optional. Not decided.

### 3.2 Wireframes (layout test, not real values)

```
SCREEN 1                                   SCREEN 2
+------------------------------+           +------------------------------+
| Where is your field?         |           | Your field: 51.2 N, 71.4 E   |
|                              |           | Season Apr-Sep 2026          |
|   [  satellite map  ]        |           |                              |
|        (pin)                 |           | 2 things need attention      |
|                              |           |                              |
| [ Use my location ]          |           | [RED]  Dry spells            |
|                              |           |  one plain sentence     >    |
| [ Check my field ]           |           | [AMBER] Heat                 |
|                              |           |  one plain sentence     >    |
+------------------------------+           | [GREEN] Frost                |
                                           | [GREEN] Heavy rain           |
                                           |                              |
                                           | Year strip: J F M A M J ...  |
                                           | (frost / dry months marked)  |
                                           |                              |
                                           | Supports, not replaces, ...  |
                                           | Sources                      |
                                           +------------------------------+

CARD OPEN
+------------------------------+
| [RED] Dry spells             |
| What we see: <number> days   |
|  without rain, longer than   |
|  <x> of <n> past years       |
| What you can do:             |
|  - action  [source tag]      |
| Ask your agronomist:         |
|  - question                  |
| How we know: definition +    |
|  dataset + coarseness note   |
+------------------------------+
```

## 4. Analysis logic

### 4.1 Data

- **NASA POWER Daily API** at the tapped point. Daily values from 1981-01-01 to near real time; 0.5° x 0.5° global grid; up to 20 parameters per single-point request; JSON or CSV; no key needed in the team's live test; repeated requests for the same place may get an application blocked, so results must be stored and reused [S6][S17].
- Parameters used: `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR` (daily maximum temperature, daily minimum temperature, corrected precipitation in mm/day) [S17].
- One POWER grid cell is much larger than a field. The app describes the **climate of the area**, not differences inside the field, and says so on every detail view [S6 consequence noted in `PROJECT_SPEC.md`].
- Other NASA datasets (SMAP, IMERG, Landsat, MODIS, SRTM, ECOSTRESS) are **planned**, not part of this version [S17 for access status].

### 4.2 Season window (Decision)

"Season" means 1 April to 30 September for the northern hemisphere. The window must be confirmed with an agronomist for the chosen region. Not verified.

### 4.3 Indicators: standard definitions, no invented thresholds

The indicators below are standard climate-extreme indices defined by the Expert Team on Climate Change Detection and Indices (ETCCDI). Using them avoids inventing crop-damage thresholds, which the team rule forbids without a source.

| Farmer-facing name | Index | Definition | Source |
|---|---|---|---|
| Frost days / frost dates | FD | Annual count of days when daily minimum temperature is below 0 °C | [S1] |
| Dry spells | CDD | Largest number of consecutive days with precipitation below 1 mm | [S1] |
| Hot days | TX90p | Percentage of days when daily maximum temperature is above the 90th percentile. In the Copernicus implementation the percentile is for the calendar day, from a 5-day moving window in a base period | [S1][S2] |
| Heavy rain | Rx1day, R20mm | Rx1day: maximum 1-day precipitation. R20mm: number of very heavy precipitation days, precipitation of 20 mm or more | [S1][S3] |

Meaning of Rx1day: the index reflects rain intensity that can cause flash floods [S4].

*Decision (simplification):* TX90p will be computed as the share of season days with `T2M_MAX` above the 90th percentile of the same place's own history for that time of year. The base period is not chosen yet. First/last frost dates are derived from the FD definition and are not ETCCDI indices.

### 4.4 Traffic lights (Decision)

Each indicator for the latest completed season is **ranked against the same place's own past seasons** (1981 onwards).

- Worst 10% of past seasons: **red**, word "Unusual".
- Worst 25%: **amber**, word "Watch".
- Otherwise: **green**, word "Normal".

The cut-offs are team decisions and must be reviewed. **Important wording rule:** red means "unusual for this place compared with its own past", not "your crop is damaged". No agronomic damage threshold is used, because none has been sourced.

### 4.5 Year strip

Twelve months in a row. For each month, share of past years with at least one frost day, and typical monthly rainfall, both computed from POWER. Bare-field months come from the farmer's crop list (`PROJECT_SPEC.md` section 5).

## 5. Threats and what can be done (each action has a source)

Wording for the farmer is a paraphrase of the source. Each card must end with "Ask your agronomist".

### 5.1 Dry spells and low rainfall

- **Data:** CDD within the season; season rainfall total compared with the place's history.
- **What you can do:**
  - Keep the soil covered and reduce tillage: conservation agriculture increases soil water content by raising infiltration and reducing runoff and evaporation, which buffers crops against drought [S7]. A mulch layer inhibits evaporation of soil moisture and increases infiltration [S8].
  - Consider drought-tolerant varieties, early-maturing ("drought-escaping") varieties, and shifting the planting date to the precipitation pattern [S9].
- **Ask your agronomist:** cover crops can compete for the main crop's moisture in dry climates. NRCS's practice note says this for climates with under 20 inches (about 508 mm) of rain per year [S10].

### 5.2 Heat

- **Data:** share of hot days (TX90p) in the season.
- **What it means:** a secondary news report on the April 2026 FAO-WMO report says temperatures above 30 °C already reduce yields of major crops including maize, wheat and soybean [S12]. *The primary report has not been read; verify before showing this to judges.*
- **What you can do:** FAO lists heat-tolerant varieties and shading crops or increasing water storage [S11]. An FAO-GCF project in Pakistan combined heat- and drought-tolerant cotton and wheat with mulching [S11]. The same news report lists revised planting calendars and better water management as recommendations [S12].
- **Ask your agronomist:** which varieties and planting dates fit your area.

### 5.3 Frost

- **Data:** frost days (FD); last spring frost and first autumn frost per year; how often a frost occurs late in spring or early in autumn.
- **What you can do** (passive methods):
  - Choose the site with care: FAO calls site selection the single most important frost-protection method [S13]. Avoid planting in low-lying cold spots unless adequate protection is planned [S14]. Upper hill slopes are better [S13b].
  - Plant late to avoid sensitive stages during frost periods, and select tolerant varieties [S13b].
  - Passive methods are usually less costly than active ones and often make active protection unnecessary [S14].
- **Ask your agronomist:** several measures in the FAO manual (trunk wraps, pruning, canopy trees) concern tree crops [S13c]. Check which apply to field crops.

### 5.4 Heavy rain and erosion

- **Data:** Rx1day and R20mm for the season; bare-field months from the crop list.
- **What it means:** the most critical erosion on farmland happens when soil is bare or row crops are at the seedling stage [S5].
- **What you can do:**
  - Keep the soil covered. An FAO soil-management text says vegetation should cover at least 70% of the ground surface to give adequate protection in most places [S5]. It is an older document; treat the figure as an indication.
  - Leave crop residues as mulch: rain infiltrates more easily under mulch and there is no surface crust [S5]. In a test in Spain, straw mulch on bare soil significantly reduced runoff and erosion under simulated storms [S18].
  - Use cover crops in gaps between harvest and the next crop [S8]. Compared with leaving fields fallow, cover crops can reduce erosion and runoff and increase water infiltration [S19]. This is where a bare-field window in the rotation comparison becomes a concrete suggestion.
  - Rotate with legumes: this usually improves fertility, particularly nitrogen content, and raises the soil's ability to absorb and retain moisture [S5].
  - Reducing tillage and keeping residue cover can reduce erosion by up to 80% [S7].
- **Ask your agronomist:** see the cover-crop moisture caution in 5.1 [S10]. A USDA Climate Hubs page says dryland farmers have planted cover crops with few impacts on water for the cash crop if appropriately timed [S20] (the search snippet was cut off; read the full page for the timing guidance).

## 6. What this version will and will not show

- **Will show (planned, not built):** map, tap, POWER data for the point, four threat cards, year strip, sources page.
- **Will not show:** soil moisture, plant condition (NDVI), slopes. They stay "not available yet" until their data access is tested. Never filled with invented values (`PROJECT_SPEC.md` section 4).
- **Rotation options:** three cards as in `PROJECT_SPEC.md` section 6. The crop table still needs sourced values for water need, nitrogen fixing and rooting depth.

## 7. Not yet verified

- **POWER from a web page.** The team's live test worked. I could not call POWER from my own environment (the request was refused with HTTP 403 by the proxy), so browser access, including cross-origin requests from a page hosted on GitHub Pages, is untested.
- **Target region and season window** (section 4.2).
- **Traffic-light cut-offs** (section 4.4) and the base period for hot days.
- **The primary FAO-WMO heat report** (section 5.2). Only a secondary report was read.
- **The FAO soil-management text** [S5] is old and its title and edition are not shown in the search snippet. Look for a current FAO source for the 70% cover figure.
- **FAO frost manual** [S13] is mostly about perennial and orchard crops. Field-crop frost advice is not covered here.
- **Language** of the interface and the **format** (website on a phone is the proposal).
- **Earlier prototype.** An AI-made prototype ("Rotation Lab") exists as a private page. It uses synthetic climate data and invented crop parameters. It must not be shown to judges as the product, and it must not be mixed into this project's data.
- **AI rule wording.** The team document says AI should not be used to come up with the idea of how to solve the challenge, attributed to [S16]. The guide text read on 2026-11-14 says AI can be used to accelerate innovation and creativity and requires disclosure; it does not explicitly say whether AI may generate the core idea [S16]. Re-read the exact wording at the source.
- **Deadline.** The team document says Sunday 15 November 2026, 11:59 p.m. local time of the Local Event. The guide page read on 2026-11-14 also says submission closes "Sunday, October 5" [S16], which looks like outdated text. Confirm with the organisers today.

## 8. Sources

| Tag | Title | URL | Read on |
|---|---|---|---|
| S1 | ETCCDI, Definitions of the 27 core climate change indices | https://etccdi.pacificclimate.org/list_27_indices.shtml | 2026-11-14 |
| S2 | Copernicus Climate Data Store, Climate extreme indices (CMIP6), variable descriptions | https://cds.climate.copernicus.eu/datasets/sis-extreme-indices-cmip6 | 2026-11-14 |
| S3 | icclim documentation, Climate indices (R20mm) | https://icclim.readthedocs.io/en/latest/explanation/climate_indices.html | 2026-11-14 |
| S4 | CPTEC/INPE, climate indices (Portuguese), note on Rx1day | https://ftp.cptec.inpe.br/pesquisa/grpeta/petamdl/Projetos/Projeta/indices.pdf | 2026-11-14 |
| S5 | FAO, chapter 4 "Aims and techniques of soil management" (document T0389E) | https://www.fao.org/4/T0389E/T0389E05.htm | 2026-11-14 |
| S6 | NASA POWER Docs, Daily API (as recorded in `PROJECT_SPEC.md`) | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | team, 2026-11-14 |
| S7 | Practice Brief: Conservation Agriculture (climate-smart agriculture) | https://assets.publishing.service.gov.uk/media/57a089c4e5274a27b2000261/Practice_brief_Conservation_Agriculture.pdf | 2026-11-14 |
| S8 | FAO Conservation Agriculture, Soil organic cover | https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en | 2026-11-14 |
| S9 | FAO brief cb3696en (title not shown in the snippet), adaptation options | https://www.fao.org/3/cb3696en/cb3696en.pdf | 2026-11-14 |
| S10 | USDA NRCS, Effects of NRCS Conservation Practices: Cover Crop (code 340) | https://www.nrcs.usda.gov/sites/default/files/2022-09/Cover_Crop_340_CPPE.pdf | 2026-11-14 |
| S11 | FAO, "The heat is on" (22 April 2026) | https://www.fao.org/newsroom/story/the-heat-is-on/en | 2026-11-14 |
| S12 | Down To Earth, report on the FAO-WMO extreme heat report (secondary source) | https://www.downtoearth.org.in/climate-change/extreme-heat-emerging-as-major-threat-to-global-food-systems-fao-wmo-report-warns | 2026-11-14 |
| S13 | FAO, Frost Protection: fundamentals, practice and economics, chapter 6 (site selection) | https://www.fao.org/3/y7223e/y7223e0c.htm | 2026-11-14 |
| S13b | Same manual, chapter 8 (survey of methods) | https://www.fao.org/4/y7223e/y7223e0e.htm | 2026-11-14 |
| S13c | Same manual, table of contents | https://www.fao.org/4/y7223e/y7223e00.htm | 2026-11-14 |
| S14 | Same manual, chapter 2 (recommended methods) | https://www.fao.org/3/y7223e/y7223e08.htm | 2026-11-14 |
| S15 | Field Shift challenge details (as in `PROJECT_CONCEPT.md` S1) | https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/ | team, 2026-11-14 |
| S16 | Project Submission Guide | https://www.spaceappschallenge.org/resources/project-submission-guide/ | 2026-11-14 |
| S17 | `SOURCES_CHECK.md` (team's live POWER test) | this repository | 2026-11-14 |
| S18 | UNCCD, Organic mulching | https://www.unccd.int/land-and-life/sds/toolbox/organic-mulching | 2026-11-14 |
| S19 | USDA NRCS, Cover Crops for Soil Health | https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/cover-crops-for-soil-health | 2026-11-14 |
| S20 | USDA Climate Hubs, Cover crops and climate resilience | https://www.climatehubs.usda.gov/hubs/international/topic/cover-crops-climate-resilience | 2026-11-14 |

Each source was read through search-result excerpts, not as a full page, unless noted. Before the final submission, open each link and confirm the quoted statement.

## 9. AI disclosure

This file was drafted with an AI assistant (Claude) from the team's description of the flow (mark a location, get an analysis, then threats and how to prevent them) and from the team's example product. Claude proposed the simplification, the use of standard climate indices, the traffic-light method and the structure, and searched for the sources. The team must decide what to adopt, and must state AI use in the submission as the Submission Guide requires [S16].
