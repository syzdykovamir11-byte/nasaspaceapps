# Open issues: status after checks on 2026-11-14

Response to the seven problems raised about `PROJECT_RISKS_AND_UI.md`. "Checked" means the source page was opened and the quoted text was read on 2026-11-14.

| # | Issue | Status | Evidence |
|---|---|---|---|
| 1 | NASA POWER from a browser page (CORS) untested | **Resolved: works** | A `fetch` from a page on `https://example.com` to the POWER Daily API (`T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, lat 51.2, lon 71.4, 2025-04-01 to 2025-04-03) returned HTTP 200 with data. A page on another origin, such as GitHub Pages, can call POWER directly. Caching JSON in `data/` is still recommended so the demo does not depend on a live API and does not repeat requests (the POWER docs warn repeated requests for the same place may be blocked). |
| 2 | Region not chosen | **Open: team decision** | The season window (April–September) assumes the northern hemisphere. 51.2 N, 71.4 E in the wireframe is a layout example only. |
| 3 | Deadline contradictory | **Resolved** | Project Submission Guide, read 2026-11-14: "Project submission closes on Sunday, November 15 at 11:59 p.m." in the time zone of the team's Local Event. The text "Sunday, October 5" was not found anywhere on the page. Local Lead can still confirm local judging times. |
| 4 | AI rule wording | **Resolved: the rule is explicit** | Project Submission Guide, read 2026-11-14: "SI should not be used to (come up with your idea of how to solve the challenge)". `CLAUDE.md` is correct. Consequence: the AI disclosure in `PROJECT_RISKS_AND_UI.md` says Claude proposed the simplification, indices, traffic-light method, and structure. The team must decide which of these it adopts as its own decisions and describe AI use honestly in the submission. |
| 5 | Sources read only through search excerpts | **Partly resolved** | See below. The remaining sources still need to be opened before submission. |
| 6 | Rotation Lab prototype | **Rule stands** | Synthetic data and invented crop parameters. Not to be shown to judges and not to be mixed with project data. |
| 7 | Crop table empty | **Open** | No sources yet for crop water need, nitrogen fixing, or rooting depth. The three rotation cards cannot be built from sourced data until this is filled. Growing-period lengths are available from FAO (see `PROJECT_SPEC.md`, source S7). |

## Issue 5: sources opened in full

| Source | Statement in `PROJECT_RISKS_AND_UI.md` | Result |
|---|---|---|
| S5, FAO T0389E chapter 4 | Vegetation should cover at least 70% of the ground | **Confirmed.** Page text: "In most places, vegetation should cover at least 70 percent of the ground surface to provide adequate protection against erosion". The document is old; the edition year is not shown on the page. |
| S11, FAO "The heat is on" | Heat-tolerant varieties; shading crops or increasing water storage | **Confirmed.** Page text includes "investment in heat-tolerant plant varieties" and "shading crops, installing misters or increasing water storage". |
| S12, Down To Earth (secondary) | Temperatures above 30 °C reduce yields of maize, wheat, soybean | **Confirmed in the secondary source.** Page text: "temperatures above 30 degrees Celsius (°C) are already reducing yields of major crops" and "crops such as maize, soybean and wheat remain almost as vulnerable to temperatures above 30°C". The primary FAO-WMO report is still unread; cite it directly before showing the 30 °C figure to judges. |

Still to open in full: S1–S4 (index definitions), S7, S8, S9, S10, S13–S14, S18–S20.
