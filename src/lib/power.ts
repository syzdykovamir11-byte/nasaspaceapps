// NASA POWER Daily API client.
// Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
// The docs warn that repeated requests for the same place can get an app blocked,
// so every response is cached in the browser and reused.

export type DailySeries = {
  dates: string[]; // YYYYMMDD
  tmax: (number | null)[];
  tmin: (number | null)[];
  prec: (number | null)[];
  lat: number;
  lon: number;
};

const PARAMS = ["T2M_MAX", "T2M_MIN", "PRECTOTCORR"] as const;
const FILL = -999;

export function powerUrl(lat: number, lon: number, start: string, end: string) {
  const q = new URLSearchParams({
    parameters: PARAMS.join(","),
    community: "AG",
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start,
    end,
    format: "JSON",
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${q}`;
}

function cacheKey(lat: number, lon: number, end: string) {
  // POWER cells are 0.5 degrees wide, so two decimals is plenty for the cache.
  return `power:v1:${lat.toFixed(2)},${lon.toFixed(2)}:${end}`;
}

function readCache(key: string): DailySeries | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DailySeries) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: DailySeries) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or blocked: the app still works, it just refetches next time.
  }
}

export async function fetchDaily(
  lat: number,
  lon: number,
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<DailySeries> {
  const key = cacheKey(lat, lon, end);
  const cached = readCache(key);
  if (cached) return cached;

  const res = await fetch(powerUrl(lat, lon, start, end), { signal });
  if (!res.ok) throw new Error(`NASA POWER answered with status ${res.status}`);
  const json = await res.json();
  const p = json?.properties?.parameter;
  if (!p || !p.T2M_MAX) throw new Error("NASA POWER returned no data for this place");

  const dates = Object.keys(p.T2M_MAX).sort();
  const pick = (name: string) =>
    dates.map((d) => {
      const v = p[name]?.[d];
      return typeof v === "number" && v !== FILL ? v : null;
    });

  const data: DailySeries = {
    dates,
    tmax: pick("T2M_MAX"),
    tmin: pick("T2M_MIN"),
    prec: pick("PRECTOTCORR"),
    lat,
    lon,
  };
  writeCache(key, data);
  return data;
}
