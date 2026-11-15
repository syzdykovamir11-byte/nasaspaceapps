import { create } from "zustand";

interface DataPoint {
  p25: number;
  median: number;
  p75?: number;
  min?: number;
}

interface AgriculturalData {
  evi: DataPoint & { min: number };
  nri: DataPoint & { min: number };
  ndwi: DataPoint & { min: number };
  dswi: Pick<DataPoint, "p25" | "p75">;
  ndvi: DataPoint & { min: number };
}

interface Indicators {
  vegetationStress: string;
  waterDeficiency: string;
  droughtPestVulnerability: string;
  cropProductivity: string;
  pesticideEfficiency: string;
  soilVegetationHealth: string;
}

interface AgriculturalStore extends AgriculturalData {
  setData: (data: Partial<AgriculturalData>) => void;
  getIndicators: () => Indicators;
}

const useAgriculturalStore = create<AgriculturalStore>((set, get) => ({
  evi: { p25: 0.2, median: 0.4, p75: 0.6, min: 0.1 },
  nri: { p25: 0.3, median: 0.5, min: 0.2 },
  ndwi: { p25: 0.3, median: 0.5, min: 0.2 },
  dswi: { p25: 0.2, p75: 0.6 },
  ndvi: { p25: 0.3, p75: 0.7, median: 0.5, min: 0.2 },

  setData: (data) => set((state) => ({ ...state, ...data })),

  getIndicators: () => {
    const { evi, nri, ndwi, dswi, ndvi } = get();

    const vegetationStressIndicator = (): string => {
      if (evi.p25 < 0.3 && nri.p25 < 0.3)
        return "Severe vegetation stress detected in large areas. Immediate action required.";
      if (evi.median < 0.3)
        return "Widespread vegetation stress detected. Monitor crop health.";
      if (evi.p75 < 0.5)
        return "Moderate vegetation stress. Monitor specific areas.";
      if (evi.min < 0.2)
        return "Small areas facing critical vegetation stress. Consider localized action.";
      return "Vegetation is generally healthy, but monitor lower-performing areas.";
    };

    const waterDeficiencyIndicator = (): string => {
      if (ndwi.p25 < 0.2 && dswi.p75 > 0.5)
        return "Large portions of farmland suffering from severe water stress. Increase irrigation.";
      if (ndwi.median < 0.3)
        return "Moderate water stress in most areas. Consider irrigation adjustments.";
      if (ndwi.min < 0.2)
        return "Localized water stress detected. Monitor specific zones.";
      return "Adequate water levels across the farmland.";
    };

    const droughtPestVulnerabilityIndicator = (): string => {
      if (ndwi.p25 < 0.2 && nri.p25 < 0.3 && dswi.p75 > 0.5)
        return "Large portions of farmland highly vulnerable to drought and pests.";
      if (ndwi.median < 0.3 && nri.median < 0.3)
        return "Moderate drought and pest risk across most areas.";
      if (ndwi.min < 0.2)
        return "Certain areas highly vulnerable to drought and pests.";
      return "Low vulnerability to drought and pests.";
    };

    const cropProductivityIndicator = (): string => {
      if (ndvi.p75 > 0.6 && evi.p75 > 0.5 && nri.p25 < 0.3)
        return "High productivity expected across large areas.";
      if (ndvi.median > 0.5 && evi.median > 0.4)
        return "Moderate productivity in most regions.";
      if (ndvi.p25 < 0.4)
        return "Low productivity in some areas. Consider intervention.";
      return "Low productivity across small areas. No immediate action needed.";
    };

    const pesticideEfficiencyIndicator = (): string => {
      if (nri.p25 < 0.3 && evi.median < 0.5 && ndvi.min < 0.4)
        return "Optimal conditions for pesticide application in stressed areas.";
      if (nri.p25 < 0.3 && ndvi.median < 0.5)
        return "Pesticide application recommended in some regions.";
      return "Pesticide use not recommended at this time.";
    };

    const soilVegetationHealthIndicator = (): string => {
      if (evi.p75 > 0.5 && dswi.p25 < 0.3 && ndwi.median > 0.4)
        return "Soil and vegetation are healthy in large areas.";
      if (evi.median > 0.4 && dswi.p25 < 0.3)
        return "Moderate stress in certain areas, mostly healthy.";
      if (evi.min < 0.3) return "Localized areas experiencing critical stress.";
      return "Soil and vegetation health is stable.";
    };

    return {
      vegetationStress: vegetationStressIndicator(),
      waterDeficiency: waterDeficiencyIndicator(),
      droughtPestVulnerability: droughtPestVulnerabilityIndicator(),
      cropProductivity: cropProductivityIndicator(),
      pesticideEfficiency: pesticideEfficiencyIndicator(),
      soilVegetationHealth: soilVegetationHealthIndicator(),
    };
  },
}));

export default useAgriculturalStore;
