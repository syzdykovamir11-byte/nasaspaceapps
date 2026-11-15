/**
 * POWER meteorological data grid: "½° latitude by ⅝° longitude for the meteorological data sets"
 * (NASA POWER methodology page, https://power.larc.nasa.gov/docs/methodology/, read 2026-11-14).
 */
export const GRID_LAT_DEG = 0.5;
export const GRID_LON_DEG = 0.625;
export const GRID_SOURCE_URL = "https://power.larc.nasa.gov/docs/methodology/";

const KM_PER_DEG_LAT = 111.32; // approximation for a spherical Earth

/** Approximate grid-cell size in km at a latitude (spherical approximation). */
export function cellSizeKm(latDeg: number): { northSouth: number; eastWest: number } {
  return {
    northSouth: GRID_LAT_DEG * KM_PER_DEG_LAT,
    eastWest: GRID_LON_DEG * KM_PER_DEG_LAT * Math.cos((latDeg * Math.PI) / 180),
  };
}
