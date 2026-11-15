"use client";

import React from "react";

interface IndicatorCardProps {
  title: string;
  status: string;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
  title,
  status,
}) => {
  const getScale = (status: string) => {
    switch (true) {
      case status.includes("Severe") || status.includes("Large portions"):
        return 1;
      case status.includes("Moderate") || status.includes("Widespread"):
        return 2;
      case status.includes("Small areas") || status.includes("Localized"):
        return 3;
      default:
        return 4;
    }
  };

  const scale = getScale(status);

  return (
    <div className="gap-3 flex justify-between flex-col w-full relative overflow-hidden bg-neutral-700/80 backdrop-blur-sm duration-300 rounded-xl px-3 py-2 hover:bg-neutral-600/80">
      <p className="leading-5 text-pretty">{title}</p>
      <div className="gap-1 grid grid-cols-4">
        {Array(scale).fill(
          <div className=" h-2.5 rounded-sm bg-green-500/60" />
        )}
        {Array(4 - scale).fill(
          <div className="h-2.5 rounded-sm bg-green-500/20" />
        )}
      </div>
    </div>
  );
};
