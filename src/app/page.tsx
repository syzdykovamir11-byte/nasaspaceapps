"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatWindow } from "@/lib/indices/format";
import type { Level } from "@/lib/indices/rank";
import { monthStrip } from "@/lib/indices/months";
import { summarizeSeason } from "@/lib/indices/threats";
import { MonthStrip } from "@/components/MonthStrip";
import { DataMethod } from "@/components/DataMethod";
import { CROP_BY_ID } from "@/lib/crops/crops";
import { frostFreeByYear } from "@/lib/crops/frost";
import { frostDates as computeFrostDates } from "@/lib/crops/frostDates";
import { ACTION_SOURCES, type ActionSourceTag } from "@/lib/indices/actions";
import { cellSizeKm } from "@/lib/power/grid";
import { loadCachedSeries, loadDemoPoints } from "@/lib/power/load";
import { loadLiveSeries } from "@/lib/power/live";
import { centroid, m2ToHa, MIN_DRAW_ZOOM, MIN_FIELD_M2, polygonAreaM2, selfIntersects, type LatLon } from "@/lib/map/geo";
import { GIBS_LAYERS, gibsTileUrl, imageryDate, type ViewMode } from "@/lib/map/gibs";
import { FieldTools, ImageryNote, ViewSwitch } from "@/components/MapTools";
import type { DemoPoint, PowerSeries } from "@/lib/power/types";
import { ROTATION_YEARS, RotationSection, type RotationInput } from "@/components/RotationSection";
import { THREAT_TITLE, ThreatCard } from "@/components/ThreatCard";
import { Tabs } from "@/components/Tabs";
import styles from "./page.module.css";

// Leaflet touches `window`, so the map renders on the client only.
const PointMap = dynamic(() => import("@/components/PointMap"), {
  ssr: false,
  loading: () => <div className={styles.mapPlaceholder}>Loading map…</div>,
});

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

const LEVEL_WORD: Record<Level, string> = { unusual: "Unusual", watch: "Watch", normal: "Normal" };

export default function Home() {
  const [points, setPoints] = useState<Load<DemoPoint[]>>({ state: "loading" });
  const [pointsAttempt, setPointsAttempt] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  // Map view and the farmer's own field (drawn or typed). "field" in `selected` means that field.
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [imageryError, setImageryError] = useState<string | null>(null);
  // True while the satellite view was chosen automatically at start (not by the farmer).
  const [autoImagery, setAutoImagery] = useState(false);
  const [imageryFallbackNote, setImageryFallbackNote] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<LatLon[]>([]);
  const [field, setField] = useState<{ ring: LatLon[] | null; center: LatLon; areaHa: number | null } | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(0);
  // null = the latest complete season. A new place resets it (see choose()).
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [seriesAttempt, setSeriesAttempt] = useState(0);
  // Result of the last finished load, tagged with the place and attempt it belongs to.
  const [loaded, setLoaded] = useState<{ key: string; result: Load<PowerSeries> } | null>(null);
  const seasonRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<"season" | "rotations" | "data">("season");
  // Kept here so the farmer's rotation survives switching places.
  const [rotation, setRotation] = useState<RotationInput>({ years: Array(ROTATION_YEARS).fill(null), priority: "soil", days: {} });

  const fieldId = field ? `field:${field.center[0].toFixed(4)},${field.center[1].toFixed(4)}` : null;
  const loadKey = selected === "field" ? (fieldId ? `${fieldId}#${seriesAttempt}` : null) : selected ? `${selected}#${seriesAttempt}` : null;
  const series: Load<PowerSeries> | null = !loadKey
    ? null
    : loaded?.key === loadKey
      ? loaded.result
      : { state: "loading" };

  useEffect(() => {
    const ac = new AbortController();
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    loadDemoPoints(ac.signal)
      .then((data) => {
        setPoints({ state: "ready", data });
        // Map-first like the team prototype: start on satellite imagery when online; offline keeps the borders map.
        if (navigator.onLine) {
          setViewMode((m) => (m === "map" ? "satellite" : m));
          setAutoImagery(true);
        }
        // Optional start state from the address, e.g. ?place=kostanay&season=1991&rotation=wheat,wheat,barley
        // (for sharing a view and for the demo). Unknown values are ignored.
        const q = new URLSearchParams(window.location.search);
        const place = q.get("place");
        if (place && data.some((p) => p.id === place)) {
          setSelected(place);
          // A shared link opens straight on the result: on a phone, scroll the results into view shortly after
          // start (a short timer, so cached demo data has usually rendered by then).
          if (window.innerWidth < 1280) {
            scrollTimer = setTimeout(() => {
              if (window.scrollY > 0) return; // the farmer has already scrolled
              scrollToResults(false);
            }, 400);
          }
        }
        const season = Number(q.get("season"));
        if (Number.isInteger(season) && season > 1900) setSeasonYear(season);
        const rot = (q.get("rotation") ?? "").split(",");
        if (rot.length === ROTATION_YEARS && rot.every((id) => Object.hasOwn(CROP_BY_ID, id))) {
          setRotation((r) => ({ ...r, years: rot }));
        }
      })
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setPoints({ state: "error", message: errorText(e, "the list of places") });
      });
    return () => {
      ac.abort();
      clearTimeout(scrollTimer);
    };
  }, [pointsAttempt]);

  useEffect(() => {
    if (!selected || !loadKey) return;
    const ac = new AbortController();
    const load =
      selected === "field" && field
        ? loadLiveSeries(
            field.center[0],
            field.center[1],
            "Your field",
            ac.signal,
          )
        : loadCachedSeries(selected, ac.signal);
    load
      .then((data) => setLoaded({ key: loadKey, result: { state: "ready", data } }))
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setLoaded({ key: loadKey, result: { state: "error", message: errorText(e, "this place") } });
      });
    return () => ac.abort();
    // `field` is read only for its centre, which is part of loadKey; depending on the whole object would
    // reload the cached demo places every time a field is drawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, loadKey]);

  const readyData = series?.state === "ready" ? series.data : null;
  const summary = useMemo(
    () => (readyData ? (summarizeSeason(readyData, seasonYear ?? undefined) ?? summarizeSeason(readyData)) : null),
    [readyData, seasonYear],
  );
  const strip = useMemo(() => (readyData ? monthStrip(readyData) : null), [readyData]);
  const ffy = useMemo(() => (readyData ? frostFreeByYear(readyData) : []), [readyData]);
  const frostDates = useMemo(() => computeFrostDates(ffy), [ffy]);
  const frostPeriod = ffy.length ? `${ffy[0]!.year}–${ffy[ffy.length - 1]!.year}` : "";
  const latestYear = summary?.years[summary.years.length - 1];
  const selectedPoint =
    selected === "field"
      ? { id: "field", label: "Your field", region: "", lat: field?.center[0] ?? 0, lon: field?.center[1] ?? 0 }
      : points.state === "ready"
        ? points.data.find((p) => p.id === selected)
        : undefined;

  // Imagery for the satellite / NDVI views: mid-July of the season on screen, when the layer has it.
  const imageryYear = summary?.year ?? 2026;
  const imagery = viewMode === "map" ? null : (() => {
    const layer = GIBS_LAYERS[viewMode];
    const d = imageryDate(layer, imageryYear);
    return { layer, ...d, url: gibsTileUrl(layer, d.date) };
  })();

  /** A new or changed field is only checked when the farmer presses "Check this field". */
  function replaceField(next: typeof field) {
    setField(next);
    if (selected === "field") setSelected(null);
  }
  function startDrawing() {
    setDraft([]);
    setDrawError(null);
    setDrawing(true);
    setAutoImagery(false);
    if (window.innerWidth < 1280) {
      requestAnimationFrame(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.querySelector(`.${styles.mapLayer}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      });
    }
    // Fields are easier to outline on imagery than on the plain borders map.
    if (viewMode === "map") {
      setViewMode("satellite");
      setImageryError(null);
    }
  }
  function finishDrawing() {
    if (draft.length < 3) return;
    if (selfIntersects(draft)) {
      setDrawError("The outline crosses itself. Tap the corners in order around the field, or undo the last corners.");
      return;
    }
    const m2 = polygonAreaM2(draft);
    if (m2 < MIN_FIELD_M2) {
      setDrawError("The outline is too small to be a field. Spread the corners further apart.");
      return;
    }
    setDrawError(null);
    replaceField({ ring: draft, center: centroid(draft), areaHa: m2ToHa(m2) });
    setDraft([]);
    setDrawing(false);
  }
  function checkField() {
    if (!field) return;
    choose("field");
  }

  function scrollToResults(moveFocus: boolean) {
    if (window.innerWidth >= 1280) return; // floating layout: results are always on screen
    const target = document.querySelector<HTMLElement>('section[aria-label="Season picker"]') ?? seasonRef.current;
    if (!target || target.getBoundingClientRect().top < window.innerHeight * 0.6) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (moveFocus) document.getElementById("results-panel-season")?.focus({ preventScroll: true });
  }

  function compareCrops() {
    setTab("rotations");
    requestAnimationFrame(() => {
      seasonRef.current?.scrollTo({ top: 0 });
      if (window.innerWidth < 1280) seasonRef.current?.scrollIntoView({ block: "start" });
      document.getElementById("results-panel-rotations")?.focus({ preventScroll: true });
    });
  }

  function changeLocation() {
    const heading = document.getElementById("where");
    heading?.closest("aside")?.scrollTo({ top: 0 });
    if (window.innerWidth < 1280) heading?.scrollIntoView({ block: "start" });
    heading?.focus({ preventScroll: true });
  }

  function choose(id: string) {
    setSelected(id);
    setTab("season");
    // A new place starts at its latest season, so a past year never sticks silently.
    setSeasonYear(null);
    // On a phone the result is below the fold: bring the season (stepper, then results) into view, and move
    // keyboard focus into the results so the next Tab continues there.
    requestAnimationFrame(() => scrollToResults(true));
  }

  let status = "";
  if (series?.state === "loading") status = "Loading NASA POWER data…";
  if (series?.state === "ready" && summary && readyData) {
    status = `Season ${summary.year}${summary.year === summary.years[summary.years.length - 1] ? " (latest)" : ""} for ${readyData.label}: ${summary.threats
      .map((t) => `${THREAT_TITLE[t.id]} ${LEVEL_WORD[t.ranking.level]}`)
      .join(", ")}.`;
  }

  const cell = readyData ? cellSizeKm(readyData.lat) : null;

  const placesBlock = (
    <section aria-labelledby="where" className={styles.block}>
      <h2 id="where" tabIndex={-1}>Choose a location</h2>
      {points.state === "loading" && (
        <ul className={styles.pointList} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <div className={styles.pointSkeleton} />
            </li>
          ))}
        </ul>
      )}
      {points.state === "error" && (
        <div role="alert" className={styles.error}>
          <p>{points.message}</p>
          <button type="button" className={styles.retry} onClick={() => setPointsAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {points.state === "ready" && points.data.length === 0 && <p>No places available.</p>}
      {points.state === "ready" && points.data.length > 0 && (
        <>
          <p className={styles.muted}>Try a saved location, or draw your field.</p>
          <ul className={styles.pointList}>
            {points.data.map((p) => (
              <li key={p.id}>
                <button type="button" className={styles.pointButton} aria-pressed={selected === p.id} onClick={() => choose(p.id)}>
                  <span>{p.label}</span>
                  <span className={styles.muted}>{p.region}</span>
                </button>
              </li>
            ))}
          </ul>
          <FieldTools
            drawing={drawing}
            draftCount={draft.length}
            zoomOk={mapZoom >= MIN_DRAW_ZOOM}
            drawError={drawError}
            field={field}
            onStart={startDrawing}
            onFinish={finishDrawing}
            onUndo={() => setDraft((d) => d.slice(0, -1))}
            onCancel={() => {
              setDraft([]);
              setDrawing(false);
            }}
            onClear={() => replaceField(null)}
            onCheck={checkField}
            onTypedPoint={(c) => replaceField({ ring: null, center: c, areaHa: null })}
            checking={selected === "field" && series?.state === "loading"}
          />
        </>
      )}
    </section>
  );

  const viewBlock = (
    <section aria-labelledby="view" className={styles.block}>
      <h2 id="view">Map view</h2>
      <ViewSwitch
        mode={viewMode}
        onChange={(m) => {
          setViewMode(m);
          setImageryError(null);
          setAutoImagery(false);
          setImageryFallbackNote(false);
        }}
      />
      {imageryFallbackNote && viewMode === "map" && (
        <p className={styles.muted} role="status">
          Satellite imagery could not be loaded (it needs the internet), so the map is shown. The demo places work offline.
        </p>
      )}
      {imagery && (
        <ImageryNote
          mode={viewMode}
          date={imagery.date}
          fellBack={imagery.fellBack}
          seasonYear={imageryYear}
          lat={field?.center[0] ?? readyData?.lat ?? 53}
          error={imageryError === imagery.url}
        />
      )}
    </section>
  );

  const stepper = summary && latestYear !== undefined && (
    <div className={styles.stepper}>
      {/* Previous, label, select and next always stay on one row; only "Back to" may wrap below. */}
      <div className={styles.stepRow}>
      <button
        type="button"
        className={styles.stepButton}
        aria-label="Previous season"
        aria-disabled={summary.year === summary.years[0] || undefined}
        onClick={() => {
          const i = summary.years.indexOf(summary.year);
          if (i > 0) setSeasonYear(summary.years[i - 1]!);
        }}
      >
        <span className={`${styles.chevron} ${styles.chevronLeft}`} aria-hidden="true" />
      </button>
      <label htmlFor="season-year" className={styles.stepLabel}>
        Season
      </label>
      <select
        id="season-year"
        value={summary.year}
        onChange={(e) => {
          const y = Number(e.target.value);
          setSeasonYear(y === latestYear ? null : y);
        }}
      >
        {[...summary.years].reverse().map((y) => (
          <option key={y} value={y}>
            {y}
            {y === latestYear ? " (latest)" : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.stepButton}
        aria-label="Next season"
        aria-disabled={summary.year === latestYear || undefined}
        onClick={() => {
          const i = summary.years.indexOf(summary.year);
          if (i < summary.years.length - 1) {
            const y = summary.years[i + 1]!;
            setSeasonYear(y === latestYear ? null : y);
          }
        }}
      >
        <span className={`${styles.chevron} ${styles.chevronRight}`} aria-hidden="true" />
      </button>
      </div>
      {summary.year !== latestYear && (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            setSeasonYear(null);
            requestAnimationFrame(() => document.getElementById("season-year")?.focus());
          }}
        >
          Back to {latestYear}
        </button>
      )}
    </div>
  );

  const seasonPanel = (
    <>
      {!series && <p className={styles.muted}>Choose a demo location or check your field to see the season results.</p>}
      {series?.state === "loading" && <p>Loading NASA POWER data…</p>}
      {series?.state === "error" && (
        <div role="alert" className={styles.error}>
          <p>
            {selectedPoint ? `${selectedPoint.label}: ` : ""}
            {series.message}
          </p>
          <button type="button" className={styles.retry} onClick={() => setSeriesAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {series?.state === "ready" && !summary && <p>There are not enough complete seasons in the data for this place to compare.</p>}
      {series?.state === "ready" && summary && cell && (
        <>
          <p className={styles.seasonLine}>
            <strong>{series.data.label}</strong><br />
            {formatWindow(summary.window)} {summary.year}
            {summary.year !== latestYear && " · Past season"}
          </p>
          <p className={styles.areaNote}>
            Weather for a {Math.round(cell.northSouth)} × {Math.round(cell.eastWest)} km area.
            Check conditions in your field. Status compares local seasons since 1981.
          </p>
          <button type="button" className={styles.continueButton} onClick={compareCrops}>
            Compare crop rotations
          </button>
          <div className={styles.cards}>
            {summary.threats.map((t) => (
              <ThreatCard
                key={t.id}
                threat={t}
                summary={summary}
                series={series.data}
                onPickYear={(y) => setSeasonYear(y === latestYear ? null : y)}
                frostDates={frostDates}
                frostPeriod={frostPeriod}
              />
            ))}
          </div>
          <details className={styles.more}>
            <summary>Monthly weather history</summary>
            {strip ? (
              <MonthStrip strip={strip} window={summary.window} />
            ) : (
              <p className={styles.muted}>No complete calendar year in the data for this place, so there is no typical-year table.</p>
            )}
          </details>
          <details className={styles.more}>
            <summary>Advice sources</summary>
            <ul className={styles.sources}>
              {(Object.keys(ACTION_SOURCES) as ActionSourceTag[]).map((t) => (
                <li key={t} id={`src-${t}`}>
                  [{t}]{" "}
                  <a href={ACTION_SOURCES[t].url} target="_blank" rel="noreferrer">
                    {ACTION_SOURCES[t].title}
                  </a>
                  , read <span className={styles.nowrap}>{ACTION_SOURCES[t].read}</span>.
                </li>
              ))}
            </ul>
          </details>
          <p className={styles.limits}>Weather patterns alone cannot tell you whether crops were damaged.</p>
        </>
      )}
    </>
  );

  const TABS = [
    { id: "season" as const, label: "Season" },
    { id: "rotations" as const, label: "Crops" },
    { id: "data" as const, label: "Sources" },
  ];

  return (
    <div className={styles.app}>
      <aside className={`${styles.panel} ${styles.left}`} aria-label="Places and map settings">
        <header className={styles.header}>
          <h1>Field Tracker</h1>
          <p className={styles.lead}>Weather history for crop planning.</p>
        </header>
        {placesBlock}
        {viewBlock}
        <footer className={styles.footer}>
          <p>Use these results with local agricultural advice.</p>
        </footer>
      </aside>

      <div className={styles.mapLayer}>
        {points.state === "ready" && points.data.length > 0 ? (
          <PointMap
            fill
            points={points.data}
            selected={selected}
            onSelect={choose}
            mode={viewMode}
            tileUrl={imagery?.url ?? null}
            tileAttribution='Imagery: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a>'
            onImageryLoad={() => {
              // Imagery works: from now on a failed tile shows the note instead of switching views.
              if (autoImagery) setAutoImagery(false);
            }}
            onImageryError={() => {
              // The automatic satellite start must never leave the demo on an empty layer.
              if (autoImagery) {
                setAutoImagery(false);
                setViewMode("map");
                setImageryFallbackNote(true);
                return;
              }
              setImageryError(imagery?.url ?? "error");
            }}
            drawing={drawing}
            draft={draft}
            field={field?.ring ?? null}
            fieldCenter={field?.center ?? null}
            onAddCorner={(c) => {
              setDrawError(null);
              setDraft((d) => [...d, c]);
            }}
            onZoom={setMapZoom}
          />
        ) : null}
        {drawing && (
          // Drawing controls on the map itself, so the corners and the buttons are in view together on phones.
          <div className={styles.drawBar}>
            <p aria-hidden="true">
              {mapZoom < MIN_DRAW_ZOOM ? "Zoom in (+), then tap the corners" : `${draft.length} corner${draft.length === 1 ? "" : "s"}`}
              {drawError ? ` · ${drawError}` : ""}
            </p>
            <button type="button" className={styles.drawPrimary} onClick={finishDrawing} aria-disabled={draft.length < 3 || undefined}>
              Finish field
            </button>
            <button type="button" className={styles.drawSecondary} onClick={() => setDraft((d) => d.slice(0, -1))} aria-disabled={draft.length === 0 || undefined}>
              Undo
            </button>
            <button
              type="button"
              className={styles.drawSecondary}
              onClick={() => {
                setDraft([]);
                setDrawing(false);
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {!(points.state === "ready" && points.data.length > 0) && (
          <div className={styles.mapPlaceholder}>{points.state === "error" ? "Map unavailable" : "Loading map…"}</div>
        )}
      </div>


      {/* Floating over the map from 1280px; a block in the flow below that. */}
      {stepper && (
        <section className={styles.top} aria-label="Season picker">
          {stepper}
        </section>
      )}

      <main ref={seasonRef} className={`${styles.panel} ${styles.right}`} aria-label="Results">
        <p className="sr-only" role="status">
          {status}
        </p>
        {selectedPoint && (
          <button type="button" className={styles.changeLocation} onClick={changeLocation}>Change location</button>
        )}
        <Tabs tabs={TABS} active={tab} onChange={setTab} idPrefix="results" label="Results" />
        <div role="tabpanel" tabIndex={0} id="results-panel-season" aria-labelledby="results-tab-season" hidden={tab !== "season"}>
          <h2 className="sr-only">Your season</h2>
          {seasonPanel}
        </div>
        <div role="tabpanel" tabIndex={0} id="results-panel-rotations" aria-labelledby="results-tab-rotations" hidden={tab !== "rotations"}>
          {series && series.state !== "error" ? (
            <RotationSection series={readyData} input={rotation} onChange={setRotation} />
          ) : (
            <p className={styles.muted}>Choose a place or check your field first.</p>
          )}
        </div>
        <div role="tabpanel" tabIndex={0} id="results-panel-data" aria-labelledby="results-tab-data" hidden={tab !== "data"}>
          <DataMethod series={readyData} />
        </div>
      </main>

      {series?.state === "loading" && (
        <div className={styles.toast} aria-hidden="true">
          <span className={styles.spinner} />
          Loading NASA POWER data…
        </div>
      )}
    </div>
  );
}

function errorText(e: unknown, what: string): string {
  if (e instanceof Error && e.message.startsWith("Could not") ) return e.message;
  if (e instanceof Error && e.message.startsWith("The ")) return e.message;
  return `Could not load the saved data for ${what}. Check your connection and try again.`;
}
