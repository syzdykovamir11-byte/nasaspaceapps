# Project Concept: Field Tracker

Status: concept stage, nothing is built yet. Last updated: 2026-11-14.
Event: 2026 NASA Space Apps Challenge. Challenge: *Field Shift: Adapting Farms with NASA Data* [S1].

This document is the shared context for the team and for any AI tool used on the project. Read section 1 before adding anything.

## 1. Mandatory rule: existing information only, always with a source

This rule applies to this document, the README, the project page, the slides, and the app's own text.

1. **Use only information that already exists and can be checked.** No invented facts, numbers, statistics, user quotes, test results, or dataset properties.
2. **Every factual statement carries a source tag** such as `[S1]`, pointing to the list in section 9. A statement without a source is removed or moved to section 8 ("Not yet verified").
3. **Team decisions are labelled as decisions**, not as facts. They need no source, but they must not be worded as if they were proven.
4. **Nothing is described as working until it works.** Planned features are written as "planned".
5. **Data shown in the app must come from the named dataset.** No placeholder or made-up values in anything shown to judges, unless clearly marked as sample data.
6. **When adding a source,** record its title, URL, and the date it was read.
7. **AI assistance is disclosed.** The rules require teams to state where and how AI tools were used, and say AI should not be used to come up with the idea itself [S4]. See section 7.

## 2. The problem (from the challenge statement)

- Farmers face shifting temperatures, changing rainfall patterns, water shortages, extreme weather, and declining soil health. These pressures make it hard to choose crop rotations that protect fields, conserve water, and support long-term resilience [S1].
- Choosing a new crop for a rotation is difficult because a crop that improves soil health in one place may consume too much water, introduce disease, conflict with local markets, or fall outside the growing season somewhere else [S1].
- The challenge asks for a decision-support tool that uses NASA Earth observations together with local soil information, crop characteristics, and farmer priorities to help farmers explore rotation strategies [S1].

## 3. What the challenge expects

All items below are from the challenge statement [S1]. The statement words them as "may", so they are expectations, not hard requirements.

- Combine NASA Earth observations with local agricultural information in an app, model, interactive map, or other decision-support tool.
- Highlight times when fields are typically bare, seasons when current crops appear more vulnerable, and opportunities for rotations that could interrupt pest cycles, reduce water demand, improve infiltration, or add income.
- Compare at least three rotation strategies, including the existing rotation.
- For each strategy, explain why it was suggested, what evidence supports it, what benefits it may offer, where information gaps exist, and what risks need local review by farmers or agricultural experts.
- The tool supports decisions; it does not replace farmer judgment or local agricultural expertise.
- Farmer-centred design: easy to interpret for farmers with limited technical or geospatial experience; farmers can enter their own priorities or constraints, such as water availability, equipment limitations, or market preferences.

## 4. Our idea (team decision)

An app that tracks the field the user selects.

- The user picks their field on a map.
- The app follows that field using NASA data and shows its condition in plain language.
- The interface must be intuitive: a farmer with no technical background should understand it without training.
- To answer the challenge, tracking feeds into a comparison of at least three crop-rotation options, including the current one (see section 3).

Why an intuitive interface matters for scoring: the Validity criterion states that usability and user-friendliness influence a project's practicality and accessibility [S3].

## 5. Interface principles (team decisions)

1. One screen answers one question. The main screen answers "how is my field today?".
2. Colour before numbers. Numbers and charts are available on tap.
3. Farmer's words, not scientific terms. Terms such as evapotranspiration, soil moisture anomaly, NDVI, and frost risk are explained in plain language; the challenge suggests explaining them [S1].
4. Conclusion first, evidence second. Each conclusion links to the dataset behind it.
5. Minimal input: tap the map, pick crops and priorities from a list.
6. Usable on a phone.
7. Honest about uncertainty: the app says where data is coarse or missing, and where local expertise is needed. The challenge asks for this [S1].
8. A visible reminder that the tool supports, and does not replace, the farmer's judgment [S1].

## 6. Data sources we may use

Descriptions are taken from the challenge Resources tab [S2]. Which of these the app will actually use is not decided yet.

| Dataset | What it provides (per [S2]) | Possible use in the app |
|---|---|---|
| SMAP | Global surface soil moisture and freeze/thaw state, every 2–3 days | Soil moisture status of the field |
| GPM / IMERG | Global precipitation rate and accumulation estimates | Rainfall, extreme storms, erosion risk |
| Landsat | 30 m reflectance, NDVI, vegetation indices | Crop vigour, bare-ground periods |
| MODIS / VIIRS | 250–1000 m reflectance and vegetation indices | Seasonal change, plant stress |
| NASA POWER | Solar, meteorological, and climatology data: temperature, humidity, radiation | Growing-season conditions, frost risk, crop water use |
| SRTM | Global elevation data | Slope, runoff, erosion risk |
| ECOSTRESS | Land-surface temperature and evapotranspiration at high spatial resolution | Heat and water-stress hotspots |
| NLDAS / GLDAS | Gridded temperature, precipitation, soil moisture, and other surface variables at sub-daily resolution | Continuous time series |
| FAO GAEZ | Global agro-climatic suitability layers for dozens of crops, soil constraints, water availability | Whether a candidate crop suits the location |
| ESA Sentinel-2 | 10–20 m multispectral imagery with frequent revisits | Field-level vegetation monitoring |
| ERA5 (ECMWF) | Global hourly reanalysis: temperature, precipitation, wind, humidity, soil temperature, radiation | Filling gaps where stations are sparse |

Coverage note: several listed soil and crop datasets are described as covering the United States only: Web Soil Survey, SSURGO/STATSGO2, CropScape CDL, PRISM, NAIP [S2]. OpenET is described as covering western U.S. states [S2].

To be eligible for a Global Award, the project must use at least one NASA dataset or resource [S4].

## 7. Rules that shape the deliverable

- Submission deadline: Sunday, November 15, 2026, 11:59 p.m. local time of the team's Local Event [S3][S4].
- A demo is required: a slide deck of at most 7 slides, or a video of at most 30 seconds. Exceeding the limit makes the project ineligible for Global Judging [S4].
- The project page and all linked materials must be in English. A demo video may be spoken in another language if it has English subtitles [S3][S4].
- Links must be publicly accessible without login, password, or permission [S4].
- All external resources (code, text, images, even if open source) must be listed in the References field [S3][S4].
- AI tools are permitted to accelerate work, but should not be used to come up with the idea of how to solve the challenge. Teams must indicate where and how AI was used: visible watermark on images and video; acknowledgement in descriptive text and metadata for audio, code, and data [S4].
- Judging criteria, each scored 1 to 5: Impact, Creativity, Validity, Relevance, Presentation [S3].
- Relevance requires NASA data to be a core component of the solution, not a superficial addition [S3].

AI use so far: an AI assistant (Claude) was used to read and summarise the challenge pages and rules, and to draft and structure the project documents. The idea of a field tracker with an intuitive interface came from the team.

## 8. Not yet verified / open questions

Nothing in this section may be presented as fact until it is checked and sourced.

- Target region. This determines which soil and crop datasets are available (see coverage note in section 6).
- Which datasets can be accessed in the time available, and how (API, download, account needed). Not checked.
- How rotation options will be generated and scored. No method chosen; any agronomic rules used must come from a cited source.
- Crop characteristics (water use, nitrogen fixing, rooting depth). No source selected yet.
- Format: website or mobile app. Interface language.
- Team's Local Event and its exact deadline and local judging schedule.
- Participant Terms & Conditions and Team Formation Guide have not been read.

## 9. Sources

| Tag | Title | URL | Read on |
|---|---|---|---|
| S1 | Field Shift: Adapting Farms with NASA Data — challenge details | https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/ | 2026-11-14 |
| S2 | Same challenge — Resources tab | https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources | 2026-11-14 |
| S3 | Judging & Awards Guide (November 13, 2026) | https://www.spaceappschallenge.org/resources/judging-awards-guide/ | 2026-11-14 |
| S4 | Project Submission Guide | https://www.spaceappschallenge.org/resources/project-submission-guide/ | 2026-11-14 |
| S5 | Participant FAQs | https://www.spaceappschallenge.org/resources/participant-faqs/ | 2026-11-14 |
