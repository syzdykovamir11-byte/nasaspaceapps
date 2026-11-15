import { parsePowerResponse } from "./parse";
import type { PowerSeries } from "./types";

/** Same period as the cached demo places, so results are comparable. */
const START = "19810101";
const END = "20261031";

export function powerRequestUrl(lat: number, lon: number): string {
  return (
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,GWETROOT` +
    `&community=AG&latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start=${START}&end=${END}&format=JSON`
  );
}

// One request per point per page visit: the POWER docs ask apps not to repeat requests for the same place.
// The shared request has no caller's AbortSignal, so one caller leaving never cancels or poisons it.
const memo = new Map<string, Promise<PowerSeries>>();

/** Local calendar date (YYYY-MM-DD), as the farmer sees it. */
function localDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fetchOnce(url: string, label: string): Promise<PowerSeries> {
  const cached = memo.get(url);
  if (cached) return cached;
  const p = (async () => {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new Error("Could not reach NASA POWER. Check your internet connection and try again.");
    }
    if (!res.ok) throw new Error(`Could not load NASA POWER data for this point (HTTP ${res.status}).`);
    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      throw new Error("Could not read the NASA POWER response. Try again.");
    }
    return parsePowerResponse(raw, { id: "field", label, region: "Your field", downloaded: localDate(), requestUrl: url });
  })();
  memo.set(url, p);
  p.catch(() => memo.delete(url));
  return p;
}

/** Live NASA POWER request for a point the farmer chose (a drawn field's centre or typed coordinates). */
export function loadLiveSeries(lat: number, lon: number, label: string, signal?: AbortSignal): Promise<PowerSeries> {
  const shared = fetchOnce(powerRequestUrl(lat, lon), label);
  if (!signal) return shared;
  return new Promise<PowerSeries>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    shared.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}
