"use client";

import { MousePointerClick } from "lucide-react";
import { useLandStore } from "~/lib/store/land-store";

export const DrawHint = () => {
  const { isDrawingMode, setDrawingMode } = useLandStore();
  if (!isDrawingMode) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-paper border border-line shadow-lg pl-4 pr-2 py-2 text-ink">
      <MousePointerClick size={20} className="text-leaf shrink-0" />
      <p className="leading-5">
        Click the corners of your field on the map. Double-click to finish.
      </p>
      <button
        onClick={() => setDrawingMode(false)}
        className="px-3 py-1.5 rounded-lg text-mute hover:bg-sand duration-200"
      >
        Cancel
      </button>
    </div>
  );
};
