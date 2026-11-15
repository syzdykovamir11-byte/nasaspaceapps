"use client";

import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection } from "geojson";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, Pane, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import { MIN_DRAW_ZOOM, type LatLon } from "@/lib/map/geo";
import { mapInsets } from "@/lib/map/layout";
import type { ViewMode } from "@/lib/map/gibs";
import type { DemoPoint } from "@/lib/power/types";
import basemap from "@/data/basemap.json";
import styles from "./PointMap.module.css";

// Local basemap: Natural Earth borders (public domain), clipped to this area at build time; it works offline.
// The Satellite and NDVI views add NASA GIBS imagery tiles, which need the internet.
const BASEMAP = basemap as unknown as FeatureCollection;
const BOUNDS: [[number, number], [number, number]] = [[40, 40], [64, 95]];
const WIDE_BOUNDS: [[number, number], [number, number]] = [[30, 0], [72, 135]];
const INITIAL_BOUNDS: [[number, number], [number, number]] = [[50.5, 62.5], [55.5, 76]];
/** The 4 demo points with a small margin; the full-screen layout fits these into the strip between panels. */
const POINTS_BOUNDS: [[number, number], [number, number]] = [[50.9, 63.3], [55.1, 71.7]];

/** Borders are filled on the plain map; over satellite or NDVI imagery they are outlines only. */
const featureStyle = (imagery: boolean) => (f?: Feature) => {
  const kind = f?.properties?.kind;
  const name = f?.properties?.name;
  if (kind === "country") {
    // Over imagery only Kazakhstan is outlined: it lies fully inside the clipped basemap, so no clip edges show.
    if (imagery) return name === "Kazakhstan" ? { className: styles.borderOnImagery, weight: 1.5, fillOpacity: 0 } : { stroke: false, fill: false };
    return { className: name === "Kazakhstan" ? styles.kaz : styles.other, weight: 1.5 };
  }
  return { className: imagery ? styles.provinceOnImagery : styles.provinceLine, weight: 0.8, dashArray: "3 3" };
};

/** A tap closer than this to the previous corner (in screen px) is a double tap, not a new corner. */
const SAME_CORNER_PX = 8;

/** Collects map clicks as field corners while drawing, and reports the zoom level. */
function DrawClicks({
  drawing,
  draft,
  onAddCorner,
  onZoom,
}: {
  drawing: boolean;
  draft: LatLon[];
  onAddCorner: (p: LatLon) => void;
  onZoom: (z: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (!drawing || map.getZoom() < MIN_DRAW_ZOOM) return;
      const last = draft[draft.length - 1];
      if (last && map.latLngToContainerPoint(last).distanceTo(e.containerPoint) < SAME_CORNER_PX) return;
      onAddCorner([e.latlng.lat, e.latlng.lng]);
    },
    zoomend() {
      onZoom(map.getZoom());
    },
  });
  useEffect(() => {
    onZoom(map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report the starting zoom once
  }, [map]);
  useEffect(() => {
    map.getContainer().style.cursor = drawing ? "crosshair" : "";
    if (drawing) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }, [map, drawing]);
  return null;
}

/** Moves the map to a finished field (or a typed point) once, so the farmer sees it. */
function FitField({ ring, center }: { ring: LatLon[] | null; center: LatLon | null }) {
  const map = useMap();
  const key = (ring?.map((p) => p.join(",")).join(";") ?? "") + "|" + (center?.join(",") ?? "");
  useEffect(() => {
    const inset = mapInsets(window.innerWidth);
    if (ring && ring.length >= 3)
      map.fitBounds(ring, { paddingTopLeft: [inset.left + 24, 24], paddingBottomRight: [inset.right + 24, 24], maxZoom: 12 });
    else if (center) map.setView(center, Math.max(map.getZoom(), 9));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the field itself changes
  }, [map, key]);
  return null;
}

/**
 * Leaflet makes markers with tooltips focusable, but they cannot be activated from the keyboard.
 * The place list in the panel offers the same choice, so markers are taken out of the tab order.
 */
function UnfocusableMarkers({ version }: { version: string }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().querySelectorAll(".leaflet-interactive").forEach((el) => {
      el.setAttribute("tabindex", "-1");
      el.setAttribute("aria-hidden", "true");
    });
  }, [map, version]);
  return null;
}

/** Labels that prefer the left side, so they do not cover a neighbouring marker (Kostanay is the westmost point). */
const LABEL_LEFT = new Set(["kostanay"]);
/** Space a left-side label needs between the map edge and the marker, in px. */
const LEFT_LABEL_ROOM = 130;

type Side = "left" | "right" | "below";

/**
 * Picks a label side per point from the marker's position in the map: left where the label fits,
 * otherwise below and to the right of the marker, clear of the neighbouring markers. Re-evaluated when the map is resized, moved or zoomed.
 */
function useLabelSides(points: DemoPoint[]): Record<string, Side> {
  const map = useMap();
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  });
  const compute = (pts: DemoPoint[]) =>
    Object.fromEntries(
      pts.map((p) => {
        if (!LABEL_LEFT.has(p.id)) return [p.id, "right" as Side];
        // Measured from the left edge of the visible map (the left panel covers the map from 1280px).
        const x = map.latLngToContainerPoint([p.lat, p.lon]).x - mapInsets(window.innerWidth).left;
        return [p.id, (x >= LEFT_LABEL_ROOM ? "left" : "below") as Side];
      }),
    );
  const [sides, setSides] = useState<Record<string, Side>>(() => compute(points));
  // Subscribe once per map; keep the previous object when no side changed, so markers do not re-render.
  useEffect(() => {
    const update = () =>
      setSides((prev) => {
        const next = compute(pointsRef.current);
        return Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next;
      });
    map.on("resize moveend zoomend", update);
    return () => {
      map.off("resize moveend zoomend", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compute reads only the map and the points ref
  }, [map]);
  return sides;
}

const OFFSET: Record<Side, [number, number]> = { left: [-10, 0], right: [10, 0], below: [0, 30] };
// "below" is drawn as a right-side tooltip shifted down, so it starts at the marker instead of centring on it.
const DIRECTION: Record<Side, "left" | "right"> = { left: "left", right: "right", below: "right" };

function Markers({
  points,
  selected,
  onSelect,
  ink,
  accent,
  surface,
}: Props & { ink: string; accent: string; surface: string }) {
  const sides = useLabelSides(points);
  return (
    <>
      {points.map((p) => {
        const active = p.id === selected;
        const side = sides[p.id] ?? "right";
        return (
          <Fragment key={`${p.id}-${active}`}>
          {active && (
            // Halo for the selected place, independent of theme: a near-black outer ring (about 16.6:1 against white
            // cloud) and a white inner ring (about 14.8:1 against dark forest), so it shows on any imagery.
            <CircleMarker center={[p.lat, p.lon]} radius={14} pathOptions={{ color: "#111111", weight: 3, fill: false }} interactive={false} />
          )}
          <CircleMarker
            center={[p.lat, p.lon]}
            radius={active ? 11 : 8}
            pathOptions={{ color: active ? "#ffffff" : ink, fillColor: active ? accent : surface, weight: active ? 3 : 2, fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            {/* key by side: Leaflet tooltips do not move when the direction prop changes. */}
            <Tooltip key={side} permanent direction={DIRECTION[side]} offset={OFFSET[side]} className={styles.label}>
              {p.label}
            </Tooltip>
          </CircleMarker>
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * The fitted view is the widest one the labels are laid out for; zooming out further makes labels
 * overlap neighbouring markers, so the minimum zoom is the fitted zoom. Zooming in stays available.
 */
function LockMinZoomToFit() {
  const map = useMap();
  useEffect(() => {
    map.setMinZoom(map.getZoom());
  }, [map]);
  return null;
}

/**
 * The fit and the minimum zoom depend on the layout (floating panels from 1280px, full-width map below) and on
 * the width of the strip between the panels. After a window resize or tablet rotation, re-fit and re-lock.
 */
function RefitOnResize({ field }: { field: LatLon[] | null }) {
  const map = useMap();
  const fieldRef = useRef(field);
  useEffect(() => {
    fieldRef.current = field;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastWidth = window.innerWidth;
    const refit = () => {
      if (window.innerWidth === lastWidth) return; // height-only changes (mobile URL bar) keep the view
      lastWidth = window.innerWidth;
      map.invalidateSize();
      map.setMinZoom(4);
      const inset = mapInsets(window.innerWidth);
      const wide = inset.left > 0;
      const ring = fieldRef.current;
      if (ring && ring.length >= 3) {
        map.fitBounds(ring, { paddingTopLeft: [inset.left + 24, 24], paddingBottomRight: [inset.right + 24, 24], maxZoom: 12, animate: false });
        map.setMinZoom(4);
        return;
      }
      map.fitBounds(wide ? POINTS_BOUNDS : INITIAL_BOUNDS, wide ? { ...fitPadding(), animate: false } : { animate: false });
      map.setMinZoom(map.getZoom());
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(refit, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [map]);
  return null;
}

/** Leaflet's default attribution prefix includes a flag icon; keep a plain text link in the page's style. */
function PlainAttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>');
  }, [map]);
  return null;
}

interface Props {
  points: DemoPoint[];
  selected: string | null;
  onSelect: (id: string) => void;
}

interface MapProps extends Props {
  mode: ViewMode;
  /** GIBS tile URL template for the satellite or NDVI view; null on the plain map. */
  tileUrl: string | null;
  tileAttribution: string;
  onImageryError: () => void;
  onImageryLoad: () => void;
  drawing: boolean;
  draft: LatLon[];
  field: LatLon[] | null;
  /** Centre of the farmer's field; shown as a marker when there is no outline (typed point). */
  fieldCenter: LatLon | null;
  onAddCorner: (p: LatLon) => void;
  onZoom: (z: number) => void;
  /** Fill the parent (full-screen layout) instead of the fixed-height card. */
  fill?: boolean;
}

function fitPadding() {
  const inset = mapInsets(window.innerWidth);
  // Extra room for the place labels (they sit right of their markers) only next to the right panel; on narrow
  // screens the map is full width and the labels fit at a closer zoom.
  const LABEL_ROOM = inset.right > 0 ? 120 : 16;
  return { paddingTopLeft: [inset.left + 16, 16] as [number, number], paddingBottomRight: [inset.right + LABEL_ROOM, 16] as [number, number] };
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function PointMap({
  points,
  selected,
  onSelect,
  mode,
  tileUrl,
  tileAttribution,
  onImageryError,
  onImageryLoad,
  drawing,
  draft,
  field,
  fieldCenter,
  onAddCorner,
  onZoom,
  fill = false,
}: MapProps) {
  // Re-render when the OS colour scheme changes, so marker colours follow the theme without a reload.
  const [scheme, setScheme] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme((n) => n + 1);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  // Leaflet writes marker colours as SVG attributes, so read the theme tokens (again only when the scheme changes).
  const { ink, accent, surface } = useMemo(
    () => ({ ink: cssVar("--text", "#1f2a1f"), accent: cssVar("--accent", "#2f6b3a"), surface: cssVar("--surface", "#ffffff") }),
    // `scheme` is the trigger: the CSS variables change with the OS theme, which React cannot see.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheme],
  );
  // Stable tile handlers, so react-leaflet does not re-bind them on every render.
  const errRef = useRef(onImageryError);
  const loadRef = useRef(onImageryLoad);
  useEffect(() => {
    errRef.current = onImageryError;
    loadRef.current = onImageryLoad;
  });
  const tileHandlers = useMemo(() => ({ tileerror: () => errRef.current(), tileload: () => loadRef.current() }), []);
  return (
    <div
      className={`${styles.wrap} ${fill ? styles.fill : ""}`}
      role="region"
      aria-label="Map of northern Kazakhstan with the four demo places and your field. With a keyboard, use the place list and the field tools in the panel instead."
    >
      <MapContainer
        // Beside the floating panels (from 1280px) fit the points themselves; on narrow screens keep the wider area.
        bounds={fill && mapInsets(window.innerWidth).left > 0 ? POINTS_BOUNDS : INITIAL_BOUNDS}
        // Full-screen layout: fit the demo area into the strip between the floating panels from the first frame.
        boundsOptions={fill && mapInsets(window.innerWidth).left > 0 ? fitPadding() : undefined}
        zoomControl={false}
        // Full screen: the viewport is wider than the basemap, so a tight maxBounds would re-centre the view and
        // undo the offset that keeps the places clear of the panels.
        maxBounds={fill ? WIDE_BOUNDS : BOUNDS}
        minZoom={4}
        maxZoom={13}
        keyboard={false}
        scrollWheelZoom={false}
        attributionControl
        className={styles.map}
      >
        {tileUrl && (
          <TileLayer
            key={tileUrl}
            url={tileUrl}
            maxNativeZoom={9}
            maxZoom={13}
            attribution={tileAttribution}
            eventHandlers={tileHandlers}
          />
        )}
        {/* Borders in their own pane (z 350): above imagery (tiles, z 200), always below markers and the field
            (overlay pane, z 400), even when the layer is re-created. Keyed by mode: the style is set at creation. */}
        <Pane name="borders" style={{ zIndex: 350 }}>
          <GeoJSON key={mode} pane="borders" data={BASEMAP} style={featureStyle(mode !== "map")} interactive={false} attribution="Borders: Natural Earth" />
        </Pane>
        <Markers
          points={points}
          selected={selected}
          onSelect={(id) => {
            if (!drawing) onSelect(id);
          }}
          ink={ink}
          accent={accent}
          surface={surface}
        />
        {field && field.length >= 3 && (
          <Polygon positions={field} pathOptions={{ color: accent, weight: 3, fillColor: accent, fillOpacity: 0.15 }} interactive={false} />
        )}
        {!field && fieldCenter && (
          <CircleMarker center={fieldCenter} radius={9} pathOptions={{ color: ink, fillColor: accent, weight: 2, fillOpacity: 1 }} interactive={false}>
            <Tooltip permanent direction="right" offset={[10, 0]} className={styles.label}>
              Your field
            </Tooltip>
          </CircleMarker>
        )}
        {drawing && draft.length > 0 && (
          <>
            <Polyline positions={draft.length >= 3 ? [...draft, draft[0]!] : draft} pathOptions={{ color: surface, weight: 2, dashArray: "6 4" }} interactive={false} />
            {draft.map((p, i) => (
              <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: ink, fillColor: surface, weight: 2, fillOpacity: 1 }} interactive={false} />
            ))}
          </>
        )}
        <DrawClicks drawing={drawing} draft={draft} onAddCorner={onAddCorner} onZoom={onZoom} />
        <FitField ring={field} center={fieldCenter} />
        <UnfocusableMarkers version={`${selected}-${points.length}`} />
        <PlainAttributionPrefix />
        <LockMinZoomToFit />
        {fill && <RefitOnResize field={field} />}
        <ZoomControl position="bottomleft" />
      </MapContainer>
    </div>
  );
}
