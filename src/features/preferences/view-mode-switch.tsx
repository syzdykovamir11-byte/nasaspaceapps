"use client";

import React from "react";
import { useViewStore } from "~/lib/store/view-store";
import { cn } from "~/lib/utils";

type ViewMode = "nvdi" | "satellite";
const VIEW_MODES = ["satellite", "nvdi"] as const;
const LABELS: Record<ViewMode, string> = {
  satellite: "Photo",
  nvdi: "Plant health",
};

export const ViewModeSwitch: React.FC = () => {
  const {
    viewParameters: { mode: viewMode },
    setViewMode,
  } = useViewStore();

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="bg-paper border border-line shadow-lg rounded-2xl p-1.5">
      <p className="text-xs text-mute px-2 pb-1">Map view</p>
      <div className="flex gap-1" role="group" aria-label="Map view">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            aria-pressed={viewMode === mode}
            className={cn(
              "flex-1 px-3 py-2 text-center rounded-xl duration-200",
              viewMode === mode
                ? "bg-leaf text-paper font-medium"
                : "text-mute hover:bg-sand"
            )}
            onClick={() => switchMode(mode)}
          >
            {LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
};
