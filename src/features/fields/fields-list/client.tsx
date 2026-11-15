"use client";

import { Plus } from "lucide-react";
import { getAgroMonitoringData } from "~/lib/logic";
import { Land, qc, useLandStore } from "~/lib/store/land-store";
import { useViewStore } from "~/lib/store/view-store";
import { cn } from "~/lib/utils";

export const FieldHeader = () => {
  const { isDrawingMode, setDrawingMode } = useLandStore();

  const handleAddField = () => {
    setDrawingMode(true);
  };

  return (
    <div className="flex justify-between text-neutral-400 mb-1 pl-1">
      Fields
      <button
        className={cn(
          "px-3 h-6 rounded-md bg-neutral-800/80 hover:bg-neutral-700/80 duration-200",
          isDrawingMode && "bg-green-600/50 text-green-300"
        )}
        onClick={handleAddField}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export const Field: React.FC<Land> = ({ id, name, coordinates, polygonId }) => {
  const { selectedLand, setSelectedLand } = useLandStore();
  const { currentDate } = useViewStore();

  const handleClick = () => {
    setSelectedLand({ id, name, coordinates, polygonId });
    qc.prefetchQuery({
      queryKey: ["satelite", name],
      queryFn: () =>
        getAgroMonitoringData(polygonId, currentDate.toISOString()),
    });
  };

  return (
    <button
      className={cn(
        "bg-neutral-800/80 hover:bg-neutral-700/80 duration-300 py-2 px-3 rounded-lg text-start",
        selectedLand?.id === id && "bg-neutral-700/80"
      )}
      onClick={handleClick}
    >
      {name}
    </button>
  );
};
