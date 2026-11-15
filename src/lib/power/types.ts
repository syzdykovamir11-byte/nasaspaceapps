/** One cached NASA POWER daily point series, as written by scripts/prepare-data.mjs. */
export interface PowerSeries {
  id: string;
  label: string;
  region: string;
  lat: number;
  lon: number;
  elevationM: number | null;
  /** First day, YYYY-MM-DD. Index 0 of every array below. Days are contiguous. */
  start: string;
  /** Last day, YYYY-MM-DD. */
  end: string;
  source: {
    title: string;
    apiVersion: string;
    sources: string[];
    timeStandard: string;
    downloaded: string;
    requestUrl: string;
  };
  units: { tmax: string; tmin: string; prcp: string };
  /** Daily maximum 2 m air temperature (T2M_MAX), °C. null = POWER fill value. */
  tmax: (number | null)[];
  /** Daily minimum 2 m air temperature (T2M_MIN), °C. */
  tmin: (number | null)[];
  /** Corrected precipitation (PRECTOTCORR), mm/day. */
  prcp: (number | null)[];
  /**
   * Root-zone soil wetness (GWETROOT), 0 = completely dry, 1 = saturated, unitless. Same days as above.
   * Optional: absent in older snapshots, and the soil card is then not shown.
   */
  soil?: (number | null)[];
  soilSource?: { downloaded: string; requestUrl: string };
}

export interface DemoPoint {
  id: string;
  label: string;
  region: string;
  lat: number;
  lon: number;
}
