import { GRID_LAT_DEG, GRID_LON_DEG, GRID_SOURCE_URL } from "@/lib/power/grid";
import type { PowerSeries } from "@/lib/power/types";
import styles from "./DataMethod.module.css";

/** One panel that lists every dataset, its resolution and coverage, each processing step, and the limits. */
export function DataMethod({ series }: { series: PowerSeries | null }) {
  return (
    <section aria-labelledby="data-method" className={styles.section}>
      <h2 id="data-method" className={styles.heading}>Data &amp; method</h2>
      <details className={styles.panel}>
        <summary>Show datasets, processing steps and limits</summary>

        <h3>Datasets</h3>
        <dl className={styles.list}>
          <dt>NASA POWER Daily API (meteorology)</dt>
          <dd>
            Parameters T2M_MIN (daily minimum air temperature at 2&nbsp;m, °C), T2M_MAX (daily maximum, °C), T2M (daily
            mean, °C) and PRECTOTCORR (corrected precipitation, mm/day). Grid {GRID_LAT_DEG}° latitude ×{" "}
            {GRID_LON_DEG}° longitude (
            <a href={GRID_SOURCE_URL} target="_blank" rel="noreferrer">
              POWER methodology
            </a>
            ), about 56 × 40–44&nbsp;km at these latitudes. Daily, 1 January 1981 to 31 October 2026. Seasons from 1981 to
            2026 come from MERRA-2; October 2026 comes from GEOS-IT and is outside the growing season (checked through the
            API response headers at the Astana point).
            {series && (
              <>
                {" "}
                This place: API {series.source.apiVersion}, sources {series.source.sources.join(", ")}, time standard{" "}
                {series.source.timeStandard}, downloaded {series.source.downloaded}.{" "}
                <a href={series.source.requestUrl} target="_blank" rel="noreferrer">
                  Request URL
                </a>
                .
              </>
            )}
          </dd>
          <dt>NASA POWER Daily API (soil)</dt>
          <dd>
            Parameter GWETROOT, root-zone soil wetness: 0 means completely dry soil, 1 means saturated, unitless. Same grid,
            points and days as above; a model estimate (MERRA-2), not a field measurement. Downloaded 15 November 2026 for
            the 4 demo places; a drawn field gets it in the same live request.
            {series?.soilSource && (
              <>
                {" "}
                <a href={series.soilSource.requestUrl} target="_blank" rel="noreferrer">
                  Request URL
                </a>
                .
              </>
            )}
          </dd>
          <dt>Crop properties</dt>
          <dd>
            FAO Irrigation Water Management Training Manual 3 (growing period, seasonal water need), FAO-56 Table 22
            (rooting depth), and the Government of Saskatchewan (legume nitrogen fixation). These are global or Canadian
            reference values, not values from Kazakhstan. Links are in the rotation section.
          </dd>
          <dt>NASA GIBS imagery (Satellite and NDVI views)</dt>
          <dd>
            MODIS Terra Corrected Reflectance (True Color), available from 24 Feb 2000, and MODIS Terra NDVI 8-day
            composite, available from 12 Feb 2025 (GIBS WMTS capabilities, read 15 Nov 2026). Served at zoom level 9,
            about 180&nbsp;m per pixel at these latitudes. The image date is 15 July of the season on screen when the layer
            has it, otherwise 15 July of the latest year; the date shown under the map is the one used. Needs the internet.
            These are context layers: no result in the tool is computed from them.
          </dd>
          <dt>Map borders</dt>
          <dd>Natural Earth country and province borders (public domain), clipped to this area.</dd>
          <dt>Weather station for the check</dt>
          <dd>NOAA GHCN-Daily, station KZ000028952 Kustanai (WMO 28952), daily precipitation and minimum temperature, 1902–2025 with gaps after 2005; see data/stations in the repository.</dd>
        </dl>

        <h3>Processing steps</h3>
        <ol className={styles.steps}>
          <li>Download the daily POWER series for 4 demo points once and save them, so the demo works offline.</li>
          <li>Check units (°C, mm/day), that every day is present and in order, and the fill value (−999, none found).</li>
          <li>
            Growing season 1 April – 30 September (our choice for northern Kazakhstan). For each season: the longest run of
            days with precipitation under 1&nbsp;mm (CDD) and the number of days with a minimum below 0&nbsp;°C (FD), both
            ETCCDI definitions counted inside the season only.
          </li>
          <li>
            Soil moisture: the average of daily GWETROOT over the same season window, rounded to 2 decimals. Here a lower
            value (drier soil) ranks as worse. Checks: unitless, every value within 0–1, same days and point as the weather
            data.
          </li>
          <li>
            Rank the chosen season against the other seasons since 1981 at the same point. Among the worst 10% is
            &quot;Unusual&quot;, among the worst 25% is &quot;Watch&quot;. These cut-offs are our choice.
          </li>
          <li>
            Days between frosts for each calendar year: from the last day below 0&nbsp;°C before 15 July to the first on or
            after it. The season window and the 15 July split were chosen for northern Kazakhstan; a field elsewhere
            should check them first. Count the years with at least as many days as each crop needs from sowing to harvest (your value, or
            FAO&apos;s shortest).
          </li>
          <li>Typical year: share of years with frost in each month and the median monthly precipitation, 1981–2025.</li>
          <li>
            Independent check: POWER at the Kostanay point against NOAA GHCN-Daily station Kustanai (about 1&nbsp;km away),
            25 growing seasons 1981–2005 for precipitation and 26 (1981–2006) for minimum temperature. Correlation per
            season: precipitation total 0.80, longest dry spell 0.87 (0.44 without the extreme 1991 season), frost days 0.89.
            On average POWER gives 6&nbsp;mm less rain per season, a longest dry spell about 2 days shorter, and 4 more
            frost days than the station; both frost dates fall about 2 days later
            in POWER, so the days between frosts differ by under a day on average. The station&apos;s longest dry spell is
            also 1991. Other points and later years are not checked this way.
          </li>
          <li>
            Your field: the area of the drawn outline is computed on a sphere (the same method as Leaflet.draw and Turf),
            and its centre is the average of the corners. The weather for that centre comes from a live NASA POWER request
            for the same period and parameters as the demo places, checked in the same way (units, missing days, fill
            values).
          </li>
          <li>
            The main results for the 4 demo places (season indices, ranks, days between frosts, frost dates, the typical
            year) were also computed separately in Python from the raw files, and automated tests check that the app
            matches them.
          </li>
        </ol>

        <h3>Limits</h3>
        <ul className={styles.steps}>
          <li>One grid cell covers tens of kilometres. The tool describes the area around a point, not your field.</li>
          <li>POWER is a model reanalysis (MERRA-2), not station measurements. It may differ from local weather stations.</li>
          <li>Colours say a season was unusual for this place. They do not say a crop was damaged.</li>
          <li>Frost here is air frost at 2&nbsp;m averaged over the cell. Many crops survive light frost.</li>
          <li>
            Soil moisture is a modelled area average, not checked against a ground station. There is no data on soil type
            or fertility, pests, prices, markets or equipment. No yield or income predictions.
          </li>
          <li>
            The 4 demo places work offline. Your own field and the Satellite and NDVI views need the internet. The season
            window was chosen for northern Kazakhstan.
          </li>
        </ul>

        <h3>Use of AI</h3>
        <p>
          The team came up with the idea. An AI assistant (Claude) was used to write and test code, check data, and draft
          text. All data on screen comes from the sources above.
        </p>
        <p>
          The optional &quot;In plain words&quot; box on the Crops tab is written by Google Gemini when you ask for it. It
          receives only the facts shown on the rotation cards and may cite only NASA POWER and the FAO and Saskatchewan
          sources listed there. The app rejects an answer that adds any number not in those facts, a web link, or another
          source. The summary is labelled as AI-written; the cards stay the reference.
        </p>
      </details>
    </section>
  );
}
