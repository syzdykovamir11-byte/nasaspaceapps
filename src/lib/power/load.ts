import type { DemoPoint, PowerSeries } from "./types";

/** Loads a cached series from public/data. The demo path never calls the live POWER API. */
export async function loadCachedSeries(id: string, signal?: AbortSignal): Promise<PowerSeries> {
  const res = await fetch(`data/${encodeURIComponent(id)}.json`, { signal });
  if (!res.ok) throw new Error(`Could not load the saved NASA POWER data for this place (HTTP ${res.status}).`);
  const data: unknown = await res.json();
  return assertSeries(data);
}

export async function loadDemoPoints(signal?: AbortSignal): Promise<DemoPoint[]> {
  const res = await fetch("data/points.json", { signal });
  if (!res.ok) throw new Error(`Could not load the list of places (HTTP ${res.status}).`);
  const data: unknown = await res.json();
  if (!Array.isArray(data) || !data.every(isDemoPoint)) throw new Error("The list of places has an unexpected format.");
  return data;
}

function isDemoPoint(x: unknown): x is DemoPoint {
  const p = x as Partial<DemoPoint> | null;
  return (
    !!p && typeof p.id === "string" && typeof p.label === "string" && typeof p.region === "string" &&
    Number.isFinite(p.lat) && Number.isFinite(p.lon)
  );
}

function assertSeries(d: unknown): PowerSeries {
  const s = d as Partial<PowerSeries> | null;
  const n = s?.tmax?.length;
  const ok =
    !!s && typeof s.id === "string" && typeof s.label === "string" && typeof s.start === "string" &&
    typeof s.end === "string" && Number.isFinite(s.lat) && Number.isFinite(s.lon) &&
    !!s.source && Array.isArray(s.source.sources) && typeof s.source.downloaded === "string" &&
    typeof s.source.apiVersion === "string" &&
    Array.isArray(s.tmax) && Array.isArray(s.tmin) && Array.isArray(s.prcp) &&
    s.tmin.length === n && s.prcp.length === n && n > 0;
  if (!ok) throw new Error("The saved NASA POWER file has an unexpected format.");
  return s as PowerSeries;
}
