"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, CloudOff, Loader } from "lucide-react";
import { useLandMonitoringStatus, useStats } from "~/lib/logic/hooks";
import { IndicatorCard } from "./metrics-display";
import useAgriculturalStore from "~/lib/store/use-metrics";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/collapsible";
import { cn } from "~/lib/utils";

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

const INDEX_NAMES: Record<string, string> = {
  ndvi: "Plant greenness (NDVI)",
  evi: "Plant growth (EVI)",
  ndwi: "Water in plants (NDWI)",
  dswi: "Disease and water stress (DSWI)",
  nri: "Nitrogen (NRI)",
};

const panel = "bg-paper border border-line shadow-lg rounded-2xl";

const StatItem: React.FC<{ title: string; value: number | undefined }> = ({
  title,
  value,
}) => (
  <div className="rounded-lg bg-sand px-2 py-1.5 text-center">
    <p className="text-xs text-mute">{title}</p>
    <p className="font-medium tabular-nums">
      {value !== undefined ? value.toFixed(2) : "–"}
    </p>
  </div>
);

const StatsDisplay: React.FC = () => {
  const { hasField, isLoading, isError } = useLandMonitoringStatus();
  const [queries, success] = useStats() as [
    { data?: StatData; isSuccess: boolean }[],
    boolean
  ];
  const { getIndicators, setData } = useAgriculturalStore();
  const [open, setOpen] = useState(false);

  const stats = success
    ? queries.map((q) => q.data).filter((s): s is StatData => !!s)
    : [];
  const statsKey = stats.map((s) => `${s.key}:${s.median}`).join("|");

  // Feed the indicators with the statistics of the selected field.
  useEffect(() => {
    if (!stats.length) return;
    setData(Object.fromEntries(stats.map((s) => [s.key, s])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey]);

  if (!hasField) return null;

  if (isError) {
    return (
      <div className={cn(panel, "p-4 flex gap-3")}>
        <CloudOff size={22} className="text-wheat shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">No satellite image for this date</p>
          <p className="text-sm text-mute leading-5 mt-1">
            Satellites do not pass every day. Try the day before or after with
            the arrows at the top.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !success || !stats.length) {
    return (
      <div className={cn(panel, "p-4 flex items-center gap-3")}>
        <Loader size={20} className="animate-spin text-leaf" />
        Loading satellite data…
      </div>
    );
  }

  const indicators = getIndicators();

  return (
    <div className={cn(panel, "p-2 flex flex-col gap-2")}>
      <h2 className="font-semibold px-2 pt-1">Field health</h2>
      <IndicatorCard title="Plant stress" status={indicators.vegetationStress} />
      <IndicatorCard title="Water" status={indicators.waterDeficiency} />
      <IndicatorCard
        title="Drought and pests"
        status={indicators.droughtPestVulnerability}
      />
      <IndicatorCard title="Productivity" status={indicators.cropProductivity} />
      <IndicatorCard
        title="Pesticide use"
        status={indicators.pesticideEfficiency}
      />
      <IndicatorCard
        title="Soil and plants"
        status={indicators.soilVegetationHealth}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-leaf font-medium hover:bg-sand duration-200">
          {open ? "Hide the numbers" : "Show the numbers"}
          <ChevronDown
            size={18}
            className={cn("duration-200", open && "rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3 px-1 pt-1 pb-2">
          {stats.map((stat) => (
            <div key={stat.key}>
              <p className="text-sm text-mute px-1 mb-1">
                {INDEX_NAMES[stat.key] ?? stat.key.toUpperCase()}
              </p>
              <div className="grid grid-cols-3 gap-1">
                <StatItem title="Lowest" value={stat.min} />
                <StatItem title="Middle" value={stat.median} />
                <StatItem title="Highest" value={stat.max} />
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default StatsDisplay;
