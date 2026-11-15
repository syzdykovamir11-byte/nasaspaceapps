"use client";

import React from "react";
import { cn } from "~/lib/utils";

interface IndicatorCardProps {
  title: string;
  status: string;
}

const getScale = (status: string) => {
  switch (true) {
    case status.includes("Severe") || status.includes("Large portions"):
      return 1;
    case status.includes("Moderate") || status.includes("Widespread"):
      return 2;
    case status.includes("Small areas") ||
      status.includes("Localized") ||
      status.includes("Certain areas") ||
      status.includes("Low productivity"):
      return 3;
    default:
      return 4;
  }
};

const BAR = ["", "bg-clay", "bg-wheat", "bg-wheat", "bg-leaf"];

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
  title,
  status,
}) => {
  const scale = getScale(status);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-sand px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold leading-5">{title}</p>
        <div
          className="grid grid-cols-4 gap-1 w-20 shrink-0"
          role="img"
          aria-label={`${scale} of 4`}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn("h-2 rounded-sm", i <= scale ? BAR[scale] : "bg-line")}
            />
          ))}
        </div>
      </div>
      <p className="text-sm leading-5 text-mute">{status}</p>
    </div>
  );
};
