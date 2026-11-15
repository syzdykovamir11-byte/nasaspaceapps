"use client";

import React from "react";
import { useLandStore } from "~/lib/store/land-store";

export const DisplayField: React.FC = () => {
  const { selectedLand } = useLandStore();

  return (
    <div className="bg-neutral-900/80 backdrop-blur-md rounded-xl px-4 py-3 leading-5">
      <span className="text-neutral-400">Field: </span>
      <span>{selectedLand ? selectedLand.name : "No field selected"}</span>
    </div>
  );
};
