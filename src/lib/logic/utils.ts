// Types
export type Coordinates = [number, number];

export interface PolygonData {
  name: string;
  geo_json: {
    type: string;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: Coordinates[][];
    };
  };
}

export interface PolygonResponse {
  id: string;
  // Add other properties as needed
}

export interface SatelliteImageryItem {
  cl: number;
  type: string;
  image: {
    ndvi: string;
  };
  stats: {
    ndvi: string;
    ndwi: string;
    evi: string;
    dswi: string;
    nri: string;
  };
  dt: number;
}

export interface StatsData {
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
}

export interface LandMonitoringData {
  vegetationStress: string;
  waterDeficiency: string;
  droughtPestVulnerability: string;
  cropProductivity: string;
  pesticideEfficiency: string;
  soilVegetationHealth: string;
}

export function vegetationStressIndicator(
  evi: StatsData,
  nri: StatsData
): string {
  if (evi.p25 < 0.3 && nri.p25 < 0.3) {
    return "Severe vegetation stress detected in large areas. Immediate action required.";
  } else if (evi.median < 0.3) {
    return "Widespread vegetation stress detected. Monitor crop health.";
  } else if (evi.p75 < 0.5) {
    return "Moderate vegetation stress. Monitor specific areas.";
  } else if (evi.min < 0.2) {
    return "Small areas facing critical vegetation stress. Consider localized action.";
  } else {
    return "Vegetation is generally healthy, but monitor lower-performing areas.";
  }
}

export function waterDeficiencyIndicator(
  ndwi: StatsData,
  dswi: StatsData
): string {
  if (ndwi.p25 < 0.2 && dswi.p75 > 0.5) {
    return "Large portions of farmland suffering from severe water stress. Increase irrigation.";
  } else if (ndwi.median < 0.3) {
    return "Moderate water stress in most areas. Consider irrigation adjustments.";
  } else if (ndwi.min < 0.2) {
    return "Localized water stress detected. Monitor specific zones.";
  } else {
    return "Adequate water levels across the farmland.";
  }
}
