"use client";

import React from "react";
import { Sprout } from "lucide-react";
import { useLandStore } from "~/lib/store/land-store";

export const DisplayField: React.FC = () => {
  const { selectedLand } = useLandStore();

  return (
    <div className="bg-paper border border-line shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="grid place-items-center size-9 rounded-xl bg-leaf text-paper shrink-0">
        <Sprout size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-mute leading-4">
          {selectedLand ? "Selected field" : "Field Tracker"}
        </p>
        <p className="font-semibold leading-6 truncate">
          {selectedLand ? selectedLand.name : "Choose a field below"}
        </p>
      </div>
    </div>
  );
};
