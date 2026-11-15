"use client";

import React from "react";
import { useStats } from "~/lib/logic/hooks";
import { IndicatorCard } from "./metrics-display";
import useAgriculturalStore from "~/lib/store/use-metrics";

interface StatData {
  key: string;
  std: number;
  p25: number;
  num: number;
  min: number;
  max: number;
  median: number;
  p75: number;
  mean: number;
}

interface StatItemProps {
  title: string;
  value: number | undefined;
}

const StatItem: React.FC<StatItemProps> = ({ title, value }) => (
  <div className="px-4 py-1 text-sm text-center rounded-lg duration-200 hover:bg-neutral-700 bg-neutral-700/80 flex flex-col">
    <p className="uppercase font-mono text-sm text-neutral-400 mb-0.5">
      {title}
    </p>
    <p>{value !== undefined ? value.toFixed(4) : "N/A"}</p>
  </div>
);

const StatsDisplay: React.FC = () => {
  const [queries, success] = useStats();
  const { getIndicators } = useAgriculturalStore();
  const indicators = getIndicators();

  if (!success) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-2">
      {queries && queries.length > 0 && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-900/80">
          <IndicatorCard
            title="Vegetation Stress"
            status={indicators.vegetationStress}
          />
          <IndicatorCard
            title="Water Deficiency"
            status={indicators.waterDeficiency}
          />
          <IndicatorCard
            title="Drought & Pest Vulnerability"
            status={indicators.droughtPestVulnerability}
          />
          <IndicatorCard
            title="Crop Productivity"
            status={indicators.cropProductivity}
          />
          <IndicatorCard
            title="Pesticide Efficiency"
            status={indicators.pesticideEfficiency}
          />
          <IndicatorCard
            title="Soil & Vegetation Health"
            status={indicators.soilVegetationHealth}
          />
        </div>
      )}
      {queries.map((query) => {
        const stat = query.data as StatData;
        console.log(stat);

        return (
          <div
            key={stat.key}
            className="bg-neutral-900/80 backdrop-blur-md rounded-xl overflow-hidden p-1 gap-1 grid grid-cols-3"
          >
            <div className="col-span-3 p-1 text-neutral-500 uppercase font-mono">
              {stat.key}
            </div>
            <StatItem title="MIN" value={stat.min} />
            <StatItem title="MEDIAN" value={stat.median} />
            <StatItem title="MAX" value={stat.max} />
          </div>
        );
      })}
    </div>
  );
};

export default StatsDisplay;
