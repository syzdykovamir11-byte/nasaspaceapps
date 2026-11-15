"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLon } from "@/lib/map/geo";
import { GIBS_LAYERS, NDVI_STOPS, type ViewMode } from "@/lib/map/gibs";
import styles from "./MapTools.module.css";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "satellite", label: "Satellite" },
  { id: "ndvi", label: "Plant greenness (NDVI)" },
];

/** Map / Satellite / NDVI switch. Sits above the map; the imagery comes from NASA GIBS. */
export function ViewSwitch({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className={styles.switch} role="group" aria-label="Map view">
      {MODES.map((m) => (
        <button key={m.id} type="button" aria-pressed={mode === m.id} className={styles.switchButton} onClick={() => onChange(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** Web Mercator ground resolution at GIBS zoom level 9 (256 px tiles): 156543.03 m / 2^9 × cos(latitude). */
const metresPerPixelZ9 = (lat: number) => (156543.03 / 512) * Math.cos((lat * Math.PI) / 180);

/** Position of an NDVI value on the legend ramp, which runs from the first to the last stop. */
const NDVI_MIN = NDVI_STOPS[0]!.value;
const NDVI_MAX = NDVI_STOPS[NDVI_STOPS.length - 1]!.value;
const rampPct = (v: number) => ((v - NDVI_MIN) / (NDVI_MAX - NDVI_MIN)) * 100;

/** What the imagery is, its date, its resolution, and the NDVI colour scale. */
export function ImageryNote({
  mode,
  date,
  fellBack,
  seasonYear,
  lat,
  error,
}: {
  mode: ViewMode;
  date: string;
  fellBack: boolean;
  seasonYear: number;
  lat: number;
  error: boolean;
}) {
  if (mode === "map") return null;
  const layer = GIBS_LAYERS[mode];
  return (
    <div className={styles.note}>
      <p>
        NASA GIBS · {fmtDate(date)}{mode === "ndvi" && " · 8-day composite"}
      </p>
      {fellBack && <p>Imagery for {seasonYear} is unavailable. Showing the latest available year.</p>}
      <details className={styles.typed}>
        <summary>About this imagery</summary>
        <p>
          {layer.title}. Served at zoom level 9, about {Math.round(metresPerPixelZ9(lat))}&nbsp;m per pixel at
          this latitude. Zooming in enlarges the same pixels. Clouds can hide the ground.
          {mode === "satellite" && " Images combine several satellite passes, which can leave visible seams."}
        </p>
      </details>
      <p role="status" className={styles.error}>
        {error ? "Some images could not be loaded. This view needs an internet connection." : ""}
      </p>
      {mode === "ndvi" && (
        <div className={styles.legend}>
          <div
            className={styles.ramp}
            aria-hidden="true"
            style={{ background: `linear-gradient(to right, ${NDVI_STOPS.map((s) => `rgb(${s.rgb}) ${rampPct(s.value)}%`).join(", ")})` }}
          />
          <div className={styles.ticks} aria-hidden="true">
            {[0.1, 0.5, 1.0].map((v) => (
              <span key={v} style={{ left: `${rampPct(v)}%` }} className={v === 0.1 ? styles.tickStart : v === 1 ? styles.tickEnd : undefined}>
                {v.toFixed(1)}
              </span>
            ))}
          </div>
          <p className={styles.small}>
            NDVI from 0.1 (bare, dry or sparse) to 1.0 (dense green plants), colours from the GIBS MODIS NDVI colour map.
            Values below 0, such as open water, are left clear. Low values can also come from cloud or snow, not only
            from bare soil.
          </p>
        </div>
      )}
    </div>
  );
}

/** Region the map allows; a typed point must be inside it. */
const LAT_RANGE: [number, number] = [40, 64];
const LON_RANGE: [number, number] = [40, 95];

/** Accepts "53.2" and "53,2" (comma decimals are common in Kazakhstan and Russia). */
const parseCoord = (s: string) => (s.trim() === "" ? NaN : Number(s.trim().replace(",", ".")));

/** Draw a field by tapping corners, or type a point. Both lead to "Check this field". */
export function FieldTools({
  drawing,
  draftCount,
  zoomOk,
  drawError,
  field,
  onStart,
  onFinish,
  onUndo,
  onCancel,
  onClear,
  onCheck,
  onTypedPoint,
  checking,
}: {
  drawing: boolean;
  draftCount: number;
  zoomOk: boolean;
  drawError: string | null;
  field: { areaHa: number | null; center: LatLon } | null;
  onStart: () => void;
  onFinish: () => void;
  onUndo: () => void;
  onCancel: () => void;
  onClear: () => void;
  onCheck: () => void;
  onTypedPoint: (p: LatLon) => void;
  checking: boolean;
}) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);

  // Keep keyboard focus on the step in view when buttons replace each other.
  const startRef = useRef<HTMLButtonElement>(null);
  const instructionRef = useRef<HTMLParagraphElement>(null);
  const fieldRef = useRef<HTMLParagraphElement>(null);
  const step = drawing ? "drawing" : field ? "field" : "start";
  const prevStep = useRef(step);
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    const target = step === "drawing" ? instructionRef.current : step === "field" ? fieldRef.current : startRef.current;
    target?.focus();
  }, [step]);

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseCoord(lat);
    const b = parseCoord(lon);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setTypedError("Enter both latitude and longitude as numbers, for example 53.2 and 63.6.");
      return;
    }
    if (a < LAT_RANGE[0] || a > LAT_RANGE[1] || b < LON_RANGE[0] || b > LON_RANGE[1]) {
      setTypedError(`This map covers latitude ${LAT_RANGE[0]}–${LAT_RANGE[1]}° N and longitude ${LON_RANGE[0]}–${LON_RANGE[1]}° E.`);
      return;
    }
    setTypedError(null);
    onTypedPoint([a, b]);
  };

  return (
    <div className={styles.tools}>
      {step === "start" && (
        <button ref={startRef} type="button" className={styles.secondary} onClick={onStart}>
          Draw my field
        </button>
      )}
      {drawing && (
        <div className={styles.drawBox}>
          <p ref={instructionRef} tabIndex={-1} className={styles.instruction}>
            {zoomOk
              ? `Tap the map at each corner of your field, in order around it. ${draftCount} corner${draftCount === 1 ? "" : "s"} so far${draftCount < 3 ? " (at least 3 needed)" : ""}.`
              : "Zoom in (the + button) until you can see your field, then tap its corners in order around it."}
          </p>
          <p role="status" className={styles.error}>
            {drawError ?? ""}
          </p>
          <p className={styles.small}>Finish, Undo and Cancel are on the map. You can also enter coordinates below.</p>
          {/* Screen-reader and keyboard copy of the map buttons; hidden visually so they are not shown twice. */}
          <div className="sr-only">
            <button type="button" onClick={onFinish} aria-disabled={draftCount < 3 || undefined}>
              Finish field
            </button>
            <button type="button" onClick={onUndo} aria-disabled={draftCount === 0 || undefined}>
              Undo last corner
            </button>
            <button type="button" onClick={onCancel}>
              Cancel drawing
            </button>
          </div>
        </div>
      )}
      {step === "field" && field && (
        <div className={styles.fieldCard}>
          <p ref={fieldRef} tabIndex={-1}>
            <strong>Your field</strong>
            {field.areaHa !== null && <> · {field.areaHa >= 10 ? Math.round(field.areaHa) : field.areaHa.toFixed(1)}&nbsp;ha</>}
            <span className={styles.coords}>
              {field.center[0].toFixed(3)}° N, {field.center[1].toFixed(3)}° E
            </span>
          </p>
          <div className={styles.row}>
            <button type="button" className={styles.primary} onClick={onCheck} aria-disabled={checking || undefined}>
              {checking ? "Loading NASA POWER data…" : "Check this field"}
            </button>
            <button type="button" className={styles.secondary} onClick={onClear}>
              Clear
            </button>
          </div>
          <details className={styles.more}>
            <summary>Where the weather comes from</summary>
            <p className={styles.small}>
              NASA POWER, for the grid cell around the field&apos;s centre (tens of kilometres across), with a live
              request. Without internet only the 4 demo places work. The season window (1 Apr–30 Sep) and the frost split
              at 15 July were chosen for northern Kazakhstan; for a field elsewhere, check them first.
            </p>
          </details>
        </div>
      )}
      <details className={styles.typed}>
        <summary>Enter field coordinates</summary>
        <form onSubmit={submitTyped} className={styles.typedForm} noValidate>
          <label>
            <span>Latitude (° N)</span>
            <input
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              aria-invalid={!!typedError || undefined}
              aria-describedby={typedError ? "typed-error" : undefined}
            />
          </label>
          <label>
            <span>Longitude (° E)</span>
            <input
              inputMode="decimal"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              aria-invalid={!!typedError || undefined}
              aria-describedby={typedError ? "typed-error" : undefined}
            />
          </label>
          <button type="submit" className={styles.secondary}>
            Use this point
          </button>
        </form>
        {typedError && (
          <p id="typed-error" role="alert" className={styles.error}>
            {typedError}
          </p>
        )}
      </details>
    </div>
  );
}
