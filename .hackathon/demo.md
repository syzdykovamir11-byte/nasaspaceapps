# Demo: Field Tracker

Rules (Project Submission Guide, read by the team 2026-11-14): a video of at most 30 seconds, or at most 7 slides. English, or another language with English subtitles. Links public, no login. AI use disclosed; AI-generated images or video need a visible watermark. No NASA branding in generated content.

Recommendation: record the 30-second video from the real app (screen recording, no generated footage, so no watermark is needed), and keep the 7 slides as the fallback and for the project page.

## Start state for recording
Open the public build at `?place=kostanay&season=1991&rotation=wheat,wheat,barley` on a 1440×900 window, light theme, online (the satellite view loads by itself). Then press "Back to 2026" before recording starts, so the video begins on the latest season.

## 30-second video, storyboard (subtitles in English)
| Time | On screen | Subtitle (speak or caption) |
|---|---|---|
| 0–4 s | Full-screen NASA satellite map of northern Kazakhstan, 4 places, left panel visible | "A farmer picks a place. The app reads 46 growing seasons of NASA POWER data there." |
| 4–9 s | Click "Near Kostanay". Right panel: Season 2026, Dry spells Normal, Frost Normal, with the 46-bar history | "2026 was a normal season here. Every number shows its source, unit and date." |
| 9–15 s | Press "‹" or pick 1991 in the Season list. Dry spells turns red: "Unusual · Rank 1 of 46 · 60 days in a row with under 1 mm of rain" | "1991 was the driest since 1981. A nearby weather station agrees: 1991 was its longest dry spell too." |
| 15–19 s | Open "What you can do" on the Dry spells card | "Each threat comes with actions from FAO sources, and questions for the agronomist." |
| 19–26 s | Rotations tab: "Compare at a glance" with 3 rows, then swipe to "Add a legume" (field pea, 45 of 45 years fit) | "The farmer enters their rotation. The app compares it with two alternatives, each with its evidence and its gaps." |
| 26–30 s | Click "Satellite" → "Plant greenness (NDVI)"; then "Draw my field" | "Satellite and NDVI views from NASA, and any field can be drawn. Field Tracker." |

Do not show: the Rotation Lab prototype, anything outside the public build, or data the app does not have (yield, prices, soil).

## 7 slides (fallback, and for the project page)
1. **Title.** Field Tracker. Challenge: Field Shift: Adapting Farms with NASA Data. Team, local event, public link, repository link.
2. **Problem, one sentence.** Farmers in northern Kazakhstan choose rotations under shifting dry spells and frost; the challenge asks for a decision-support tool built on NASA Earth observations. (Source: challenge statement.)
3. **What it does.** Screenshot of the desktop view (Kostanay, 2026). Three steps: pick a place or draw a field → see how the season ranks against 1981–2025 → compare three rotations.
4. **NASA data at the core.** NASA POWER Daily (T2M_MIN, T2M_MAX, PRECTOTCORR; 1981–2026; ½° × ⅝° grid) drives every result. NASA GIBS MODIS true colour and NDVI are context layers (display only). Offline snapshot for the 4 demo places; live request for a drawn field.
5. **Validity.** Independent check against NOAA GHCN station Kustanai (1981–2005 precipitation, 1981–2006 frost): correlation 0.80 (season precipitation), 0.87 (dry spells), 0.89 (frost days); POWER counts about 4 more frost days per season, but the days between frosts agree within a day on average. 1991 is the longest dry spell in both. Every transform cross-checked in Python and pinned in 54 tests.
6. **Rotations and limits.** Screenshot of the 3 rotation cards. Rules are the team's and labelled; crop values from FAO and Saskatchewan (stand-in, not reviewed by an agronomist). Not in the tool: soil, pests, prices, yield. One grid cell is tens of km, not a field.
7. **Coverage and next steps.** The challenge-coverage table from README (built / partial / not built). Next: heat and heavy-rain indices, NDVI bare-field months from confirmed cropland pixels, Russian and Kazakh UI, agronomist review. AI use: idea by the team; Claude used for code, tests, data checks and text.

## Checks before uploading
- Video length ≤ 30 s, subtitles in English, no NASA logo added by us, no generated footage (or a watermark if any).
- Every link on the project page opens without login.
- README "Use of AI" and "References" are current.
