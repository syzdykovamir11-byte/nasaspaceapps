# Cached data snapshots

The demo reads these files. It never depends on a live API call.

## NASA POWER daily point data

| File | Requested point (lat, lon) | Label (team decision, demo point near) |
|---|---|---|
| `power_astana.json` | 51.17, 71.43 | Astana area (Akmola region) |
| `power_kokshetau.json` | 53.28, 69.39 | Kokshetau area (Akmola region) |
| `power_kostanay.json` | 53.21, 63.62 | Kostanay area (Kostanay region) |
| `power_petropavl.json` | 54.87, 69.15 | Petropavl area (North Kazakhstan region) |

The point coordinates were chosen by the team as demo points near these towns. They are not field locations. POWER meteorological data is on a grid of "½° latitude by ⅝° longitude" (NASA POWER methodology page, https://power.larc.nasa.gov/docs/methodology/, read 2026-11-14). At these latitudes one cell is about 56 km north–south by 40–44 km east–west. It describes the area around a point, not a single field.

Source product by period: the full-range file header lists MERRA2, GEOSIT and POWER. Requests made on 2026-11-14 for single periods at the Astana point returned the response header `x-data-sources: merra2,power` for every month from April to September 2026, for April–September 2025, and for October 2024 to March 2025. October 2026 returned `geosit,power`. So the seasons the app compares (April–September, 1981–2026) all come from MERRA-2. Only October 2026, which falls outside the season, comes from GEOS-IT.

- Downloaded: 2026-11-14.
- Request: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG&latitude=<lat>&longitude=<lon>&start=19810101&end=20261031&format=JSON`
- From the response header: "NASA/POWER Source Native Resolution Daily Data", API v2.10.3, sources MERRA2, GEOSIT, POWER, time standard LST, fill value -999.0.
- Parameters and units, as returned: `T2M`, `T2M_MAX`, `T2M_MIN` in °C. `PRECTOTCORR` (corrected precipitation) in mm/day.
- Range: 1981-01-01 to 2026-10-31, 16,740 days for each file.

## Checks run on 2026-11-14

- Missing values (-999): none in any file, for any parameter.
- `T2M_MIN <= T2M <= T2M_MAX` holds on every day in all four files.
- Value ranges, all files: T2M_MIN from -48.86 to 25.15 °C. T2M_MAX from -42.14 to 40.44 °C. PRECTOTCORR from 0 to 54.31 mm/day.
- Mean annual precipitation summed from daily PRECTOTCORR for 1991–2020: 351 mm (Astana), 386 mm (Kokshetau), 371 mm (Kostanay), 432 mm (Petropavl).

The check script is not part of the app. Re-run the checks whenever these files are replaced.
