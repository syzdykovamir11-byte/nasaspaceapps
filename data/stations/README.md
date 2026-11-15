# Independent check: NASA POWER against a weather station

Done 2026-11-15. Script: `scripts/validate-station.py` (Python, offline). Full output: `validate-kostanay.txt`. To reproduce from the repository root:

    python3 -I scripts/validate-station.py data/stations/KZ000028952.csv.gz data/power_kostanay.json

## Source
- NOAA GHCN-Daily, station **KZ000028952 KUSTANAI** (WMO 28952, GSN network), 53.2167 N, 63.6167 E, 170 m. File `KZ000028952.csv.gz`, downloaded 2026-11-15 from https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/KZ000028952.csv.gz (NOAA, public domain). Units in the file: tenths of mm (PRCP) and tenths of °C (TMIN); the script divides by 10. Values with a quality flag are dropped: 6 TMIN and 7 PRCP values in the whole record (flags I and O), and a dropped day makes its season incomplete. The record runs 1902–2025, but precipitation has gaps from 2006 and minimum temperature from 2007. The station's observation-time column is blank for 1981–2006, so the station day boundary is unknown; POWER days are local-solar-time calendar days. A morning observation would shift one day's rain across the date boundary, which spreads daily values but hardly changes season totals or the longest dry spell.
- Compared with the cached POWER series for the demo point "Near Kostanay" (53.21 N, 63.62 E), about 1 km from the station. POWER describes a ½° × ⅝° grid cell; the station is one point inside it.
- Only growing seasons (1 Apr–30 Sep) with all 183 station days present are compared: **1981–2005 for precipitation (25 seasons) and 1981–2006 for minimum temperature (26 seasons)**. Later seasons have station gaps and are not compared.

## Season indices (POWER minus station)
| Quantity, per growing season | Seasons | Station mean | POWER mean | Mean difference | Mean abs. difference | Correlation r |
|---|---|---|---|---|---|---|
| Precipitation total, mm | 25 (1981–2005) | 219.6 | 213.5 | −6.1 | 27.0 | 0.80 |
| Longest dry spell (CDD), days | 25 (1981–2005) | 24.0 | 21.8 | −2.3 | 5.0 | 0.87 |
| Frost days (FD), days | 26 (1981–2006) | 17.4 | 21.8 | +4.4 | 4.7 | 0.89 |

The longest dry spell at the station was in 1991 (78 days). POWER gives 60 days for that season, and 1991 is rank 1 of the compared seasons in POWER too. So the season the app flags as "Unusual" for Kostanay is the one the station shows. That one season carries much of the dry-spell correlation: without 1991, r for CDD is 0.44 over the other 24 seasons, with a mean absolute difference of 5 days. Ordinary dry spells therefore agree only roughly; the extreme season agrees well.

## Frost dates and the days between frosts (used by the rotation check)
Same definitions as the app: last day with Tmin < 0 °C before 15 July, first such day on or after 15 July, days strictly between. 26 complete calendar years, 1981–2006.

| Quantity | POWER minus station | Station mean | POWER mean | Correlation r |
|---|---|---|---|---|
| Last spring frost | +2.3 days (later in POWER) | | | |
| First autumn frost | +1.7 days (later in POWER) | | | |
| Days between frosts | −0.6 days | 142 | 141 | 0.40 |

Years with at least N days between frosts, station vs POWER (26 years): spring wheat (120 days) 25 vs 24, disagreement in 1 year; field pea (90 days) 26 vs 26, no disagreement; lentil (150 days) 8 vs 6, disagreement in 6 years.

## What this means for the app
- Season rankings follow the station closely (r 0.80–0.89 for the three indices), and that ranking is what the app shows.
- POWER counts about 4 more frost days per season than the station, but both frost dates shift later by about 2 days, so the window between them is almost the same length (−0.6 days). The year-to-year agreement of the window length is weaker (r 0.40): in a given year the station's window can differ from POWER's by a few weeks.
- The crop fit count is robust for crops well inside the window (wheat, pea) and sensitive for crops near its edge (lentil at 150 days, where 6 of 26 years flip). The app shows the count as a number of years, not a verdict, and says so on the card.
- Dry-spell lengths from POWER run shorter than the station's in the driest years (1991: 60 vs 78 days). Ranks are the safer figure; absolute day counts are approximate.
- One station, one demo point, up to 2005/2006. The other three demo points and the seasons after 2006 are not checked this way.
