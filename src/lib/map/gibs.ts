/**
 * NASA GIBS imagery layers (WMTS, Web Mercator). No key needed.
 * Layer names, date ranges and tile matrix sets were read from the GIBS WMTS capabilities on 2026-11-15:
 * https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml
 */

export type ViewMode = "map" | "satellite" | "ndvi";

export interface GibsLayer {
  id: string;
  title: string;
  format: "jpg" | "png";
  maxNativeZoom: number;
  /** First date with imagery (YYYY-MM-DD). */
  firstDate: string;
  /** Last date with imagery when the capabilities were read. */
  lastDate: string;
  sourceUrl: string;
}

export const GIBS_LAYERS: Record<Exclude<ViewMode, "map">, GibsLayer> = {
  satellite: {
    id: "MODIS_Terra_CorrectedReflectance_TrueColor",
    title: "MODIS Terra Corrected Reflectance (True Color)",
    format: "jpg",
    maxNativeZoom: 9,
    firstDate: "2000-02-24",
    lastDate: "2026-11-15",
    sourceUrl: "https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/",
  },
  ndvi: {
    id: "MODIS_Terra_NDVI_8Day",
    title: "MODIS Terra NDVI, 8-day composite",
    format: "png",
    maxNativeZoom: 9,
    firstDate: "2025-02-12",
    lastDate: "2026-11-14",
    sourceUrl: "https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/",
  },
};

export function gibsTileUrl(layer: GibsLayer, date: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.id}/default/${date}/GoogleMapsCompatible_Level${layer.maxNativeZoom}/{z}/{y}/{x}.${layer.format}`;
}

/** Mid-season date (15 July, our choice) used to show the field in the growing season. */
export const MID_SEASON = "07-15";

/**
 * Imagery date for a season year: 15 July of that year if the layer covers it, otherwise 15 July of the
 * latest year the layer covers. Returns the date and whether it fell back.
 */
export function imageryDate(layer: GibsLayer, seasonYear: number): { date: string; fellBack: boolean } {
  const wanted = `${seasonYear}-${MID_SEASON}`;
  if (wanted >= layer.firstDate && wanted <= layer.lastDate) return { date: wanted, fellBack: false };
  const lastYear = Number(layer.lastDate.slice(0, 4));
  const latest = `${lastYear}-${MID_SEASON}` <= layer.lastDate ? lastYear : lastYear - 1;
  return { date: `${latest}-${MID_SEASON}`, fellBack: true };
}

/**
 * NDVI legend stops sampled from the GIBS MODIS_NDVI colormap
 * (https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_NDVI.xml, read 2026-11-15).
 * Values below 0 are transparent in that colormap.
 */
export const NDVI_STOPS: { value: number; rgb: string }[] = [
  { value: 0.1, rgb: "223,206,194" },
  { value: 0.2, rgb: "176,155,138" },
  { value: 0.3, rgb: "150,90,71" },
  { value: 0.4, rgb: "143,183,22" },
  { value: 0.5, rgb: "86,161,0" },
  { value: 0.6, rgb: "62,138,1" },
  { value: 0.7, rgb: "33,120,1" },
  { value: 0.8, rgb: "8,103,1" },
  { value: 0.9, rgb: "0,84,1" },
  { value: 1.0, rgb: "0,24,1" },
];
