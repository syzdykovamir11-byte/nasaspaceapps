"use client";

import React from "react";
import { useViewStore } from "~/lib/store/view-store";
import { cn } from "~/lib/utils";

type ViewMode = "nvdi" | "satellite";
const VIEW_MODES = ["nvdi", "satellite"] as const;

export const ViewModeSwitch: React.FC = () => {
  const {
    viewParameters: { mode: viewMode },
    setViewMode,
  } = useViewStore();

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="bg-neutral-900/80 backdrop-blur-md rounded-xl overflow-hidden p-1 gap-1 flex">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode}
          className={cn(
            "flex-1 px-4 py-2 text-sm text-center rounded-lg duration-200",
            viewMode === mode
              ? "bg-neutral-800/80"
              : "text-neutral-400 hover:bg-neutral-800"
          )}
          onClick={() => switchMode(mode)}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
