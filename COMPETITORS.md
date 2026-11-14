# Competitors: checked claims and positioning

Status: research note. Written 2026-11-14.
The rule from section 1 of `PROJECT_CONCEPT.md` applies: every fact carries a source tag; team decisions are labelled as decisions.

## 1. Where this note comes from

The team received a competitor analysis from another AI assistant (ChatGPT). It named five products (OneSoil, EOSDA Crop Monitoring, xarvio FIELD MANAGER, Cropwise Operations, Climate FieldView) and proposed four differentiators: NASA-first data, comparison of three rotation scenarios, explained recommendations, and a Kazakhstan focus.

This note checks those claims. Method: web search on 2026-11-14. The vendors' own sites (onesoil.ai, eos.com, xarvio.com, cropwise.com, climate.com) could not be opened from the checking environment, so every claim below was read from search-result excerpts of the vendor pages listed in section 6. Open each link by hand before quoting it to judges.

AI use: the competitor list and the four differentiators came from an AI assistant, and this check was done by another AI assistant (Claude). Both must be disclosed in the submission [S4 in `PROJECT_CONCEPT.md`].

## 2. What each product does (as stated by the vendor or a listing)

### OneSoil
- Crop rotation tool: allocates crops automatically, taking previous crops and planned crops into account, and builds a rotation plan [C1]. Auto-allocation works only in the web app [C1]. Planning next season's rotation is listed as a OneSoil Pro feature [C1].
- AI Agronomist: an assistant in the mobile app that analyses a field, highlights areas that need attention, answers questions, and prepares a field analysis every seven days. Its inputs include imagery, weather, historical yields and crop rotation [C2][C3]. Launched in 2026 [C4].
- No source found that says AI Agronomist recommends rotations. It uses rotation history as an input.

### EOSDA Crop Monitoring
- Soil moisture at the surface and root depth (up to 70 cm), with history since 2002 [C5].
- Daily weather, historical weather since 2008, and a 14-day forecast [C5].
- Yield prediction model combining remote sensing and machine learning [C5].
- Keeps a crop rotation record per field, with sowing and harvest dates per season [C5].
- Already used in Kazakhstan: QOLDAU clients have used it for several years to assess field condition [C6].

### xarvio FIELD MANAGER
- Relative biomass maps every 3 days; maps from previous years can be compared [C7].
- Zone yield potential estimated from 15 years of historic biomass data [C7].
- Satellite data comes from Sentinel-2 [C8].

### Cropwise Operations (Syngenta)
- Satellite-based vegetation monitoring, field zoning, problem-area detection, field history, productivity estimates and field-level weather forecasts, per third-party listings [C9]. No official Syngenta feature list was read.
- No source found for a crop rotation planning feature.

### Climate FieldView (Bayer)
- Yield analysis by field, soil, seed type or custom region; side-by-side maps of yield, soil, application rate and seed rate [C10].
- No source found for a crop rotation planning feature.

### Other tools that compare rotations
Rotation comparison already exists outside these five products:
- RotationARM (Australia): APSIM-based scenario analysis of cropping rules, with soil water and nutrients modelled [C11].
- A Finnish Crop Rotation Comparison Tool compares two rotations on soil health, carbon and nitrogen balance, weeds, workload and profitability [C11].

### Kazakhstan market
- EOSDA Crop Monitoring through QOLDAU [C6].
- GeoPard through Eurasia Group Kazakhstan [C12].
- Egistic, a Kazakh startup; the FAO agritech observatory describes it in the past tense, so its current status is unclear [C12].

## 3. Corrections to the AI analysis

1. **Field Tracker status was overstated.** The table marked weather analytics as "yes, NASA POWER" and satellite monitoring as "partial". Nothing is built. Only a test request to NASA POWER has been made (`SOURCES_CHECK.md`). Both cells should read "planned".
2. **Empty cells for competitors.** The table left "select a field on a map" blank for OneSoil and EOSDA. Both products are organised around fields the user adds [C1][C5].
3. **Comparing three rotations is not a differentiator against other teams.** The challenge asks every team to compare at least three strategies, including the existing one [S1 in `PROJECT_CONCEPT.md`]. Against commercial products it is a difference only for the five named here, and standalone comparison tools exist [C11].
4. **A Kazakhstan focus alone is weak.** EOSDA and GeoPard already serve Kazakh farmers [C6][C12]. Language and region are not enough; what the app computes for the place has to differ.
5. **One source was not a vendor page.** The Climate FieldView and Cropwise entries cited "europeanpurpose.com". Use vendor pages or listings instead [C9][C10].
6. **SMAP and Landsat were proposed as core data.** Their access routes are not tested (`SOURCES_CHECK.md`). Only NASA POWER is confirmed.

## 4. Differences that can be backed by a source

These are factual differences. Whether to build the pitch on them is a team decision.

| Point | Field Tracker (planned) | Competitors | Sources |
|---|---|---|---|
| Length of climate history | NASA POWER daily data from 1981 | EOSDA weather history from 2008; soil moisture from 2002 | [S6 in `PROJECT_SPEC.md`][C5] |
| Access | Public link, no login (required by the submission rules) | OneSoil rotation planning is a Pro feature; AI Agronomist is a paid plan | [S4 in `PROJECT_CONCEPT.md`][C1][C2] |
| What is compared | Three rotations against the farmer's priorities, each with reasons, evidence, gaps and risks | OneSoil plans a rotation; EOSDA records rotation history; no source found for side-by-side comparison with reasons | [S1 in `PROJECT_CONCEPT.md`][C1][C5] |
| Season assessment | Each indicator ranked against the same place's own seasons since 1981 (`PROJECT_RISKS_AND_UI.md` section 4.4) | Not found in the sources read | — |

"Not found" means the search did not show it. It does not prove the competitor lacks it. Do not tell judges that a competitor lacks a feature unless it was checked on the vendor's own page.

## 5. Proposal for the pitch (decision for the team)

- Name OneSoil and EOSDA as the closest products, since both combine field monitoring with rotation data [C1][C5].
- State the difference in one sentence, using only rows from section 4. Example draft: "Field Tracker compares three rotations for one field against 45 years of NASA climate history for that place, and shows the evidence and gaps for each."
- Check the "45 years" figure before use: POWER daily data starts 1981-01-01 [S6 in `PROJECT_SPEC.md`]; 1981 to 2025 is 45 complete years.

## 6. Sources

All read on 2026-11-14 through search-result excerpts.

| Tag | Title | URL |
|---|---|---|
| C1 | OneSoil Help Center, How to plan crop rotation with OneSoil | https://help.onesoil.ai/en/articles/5235420-how-to-plan-crop-rotation-with-onesoil |
| C2 | OneSoil Help Center, How to use AI Agronomist in the OneSoil app | https://help.onesoil.ai/en/articles/16162321-how-to-use-ai-agronomist-in-the-onesoil-app |
| C3 | OneSoil blog, AI Agronomist is live in the OneSoil app | https://blog.onesoil.ai/en/ai_agronomist_is_live_in_the_onesoil_app |
| C4 | AgNavigator, OneSoil takes aim at farm data overload with "AI Agronomist" (19 June 2026) | https://www.agnavigator.com/Article/2026/06/19/onesoil-takes-aim-at-farm-data-overload-with-ai-agronomist/ |
| C5 | EOSDA, Crop Monitoring product page and key functions | https://eos.com/products/crop-monitoring/ and https://eos.com/eos-crop-monitoring/key-functions |
| C6 | EOSDA, Webinar on assessing field condition in Kazakhstan in the autumn-winter period | https://eos.com/blog/webinar-field-assessment-methods-in-kazakhstan/ |
| C7 | xarvio, FIELD MANAGER data management and analytics; Field Monitor feature page | https://ag.xarvio.com/field-manager/data-management-and-analytics and https://www.xarvio.com/ca/en/products/field-manager/field-monitor.html |
| C8 | Copernicus Sentinels, How Sentinel-2 data powers xarvio | https://sentinels.copernicus.eu/web/success-stories/-/how-sentinel-2-data-powers-xarvio%C2%AE-to-transform-global-agriculture |
| C9 | AgTecher, Cropwise Operations listing | https://agtecher.com/software/cropwise-operations-satellite-based-crop-management |
| C10 | Climate FieldView, free trial and features pages | https://climate.com/free-trial and https://climate.com/features |
| C11 | Queensland DPI repository, RotationARM paper; Zenodo record of the Finnish Crop Rotation Comparison Tool | https://era.dpi.qld.gov.au/id/eprint/15651/1/1-s2.0-S0168169926003200-main.pdf and https://zenodo.org/records/10256220 |
| C12 | Far Eastern Agriculture, GeoPard and Eurasia Group Kazakhstan partnership; FAO Agritech Observatory, Egistic | https://fareasternagriculture.com/crops/agriculture/geopard-agriculture-and-eurasia-group-kazakhstan-partner-to-enhance-precision-farming and https://agritechobservatory.review.fao.org/ru/egistic |
