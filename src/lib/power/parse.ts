import type { PowerSeries } from "./types";

/**
 * Turns a raw NASA POWER daily point response into a PowerSeries, with the same checks as
 * scripts/prepare-data.mjs: expected units, contiguous days, fill value (-999) to null.
 */

const EXPECTED_UNITS: Record<string, string> = { T2M_MAX: "C", T2M_MIN: "C", PRECTOTCORR: "mm/day" };
const DAY_MS = 86_400_000;
const toIso = (k: string) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;

interface RawPower {
  geometry?: { coordinates?: number[] };
  header?: { title?: string; api?: { version?: string }; sources?: string[]; fill_value?: number; time_standard?: string };
  parameters?: Record<string, { units?: string }>;
  properties?: { parameter?: Record<string, Record<string, number>> };
}

export function parsePowerResponse(
  raw: unknown,
  meta: { id: string; label: string; region: string; downloaded: string; requestUrl: string },
): PowerSeries {
  const r = raw as RawPower;
  const params = r.properties?.parameter;
  const header = r.header;
  if (!params || !header || typeof header.fill_value !== "number") {
    throw new Error("The NASA POWER response has an unexpected format.");
  }
  for (const [name, unit] of Object.entries(EXPECTED_UNITS)) {
    const got = r.parameters?.[name]?.units;
    if (got !== unit) throw new Error(`NASA POWER returned ${name} in "${got}", expected "${unit}".`);
    if (!params[name]) throw new Error(`NASA POWER response is missing ${name}.`);
  }
  const keys = Object.keys(params.T2M_MAX!).sort();
  if (!keys.length) throw new Error("NASA POWER returned no days.");
  const start = toIso(keys[0]!);
  const t0 = Date.parse(`${start}T00:00:00Z`);
  keys.forEach((k, i) => {
    if (Date.parse(`${toIso(k)}T00:00:00Z`) !== t0 + i * DAY_MS) throw new Error(`NASA POWER data has a gap at ${k}.`);
  });
  const fill = header.fill_value;
  const series = (name: string) =>
    keys.map((k) => {
      const v = params[name]![k];
      if (v === undefined) throw new Error(`NASA POWER ${name} is missing ${k}.`);
      return v === fill ? null : v;
    });
  // Root-zone soil wetness is optional: used only if present, unitless and within 0-1.
  let soil: (number | null)[] | undefined;
  if (params.GWETROOT && r.parameters?.GWETROOT?.units === "1") {
    const s = series("GWETROOT");
    if (s.every((v) => v === null || (v >= 0 && v <= 1))) soil = s;
  }
  const [lon, lat, elevation] = r.geometry?.coordinates ?? [];
  if (typeof lat !== "number" || typeof lon !== "number") throw new Error("NASA POWER response has no coordinates.");
  return {
    id: meta.id,
    label: meta.label,
    region: meta.region,
    lat,
    lon,
    elevationM: typeof elevation === "number" ? elevation : null,
    start,
    end: toIso(keys[keys.length - 1]!),
    source: {
      title: header.title ?? "",
      apiVersion: header.api?.version ?? "",
      sources: header.sources ?? [],
      timeStandard: header.time_standard ?? "",
      downloaded: meta.downloaded,
      requestUrl: meta.requestUrl,
    },
    units: { tmax: "°C", tmin: "°C", prcp: "mm/day" },
    tmax: series("T2M_MAX"),
    tmin: series("T2M_MIN"),
    prcp: series("PRECTOTCORR"),
    ...(soil ? { soil, soilSource: { downloaded: meta.downloaded, requestUrl: meta.requestUrl } } : {}),
  };
}
