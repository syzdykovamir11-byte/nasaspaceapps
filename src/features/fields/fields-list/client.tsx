"use client";

import { Check, Plus } from "lucide-react";
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
    <div className="flex items-center justify-between pl-2 mb-1">
      <h2 className="font-semibold">Your fields</h2>
      <button
        className={cn(
          "flex items-center gap-1.5 pl-2.5 pr-3 h-9 rounded-xl bg-leaf text-paper font-medium hover:bg-leaf-dark duration-200",
          isDrawingMode && "bg-wheat hover:bg-wheat"
        )}
        onClick={handleAddField}
      >
        <Plus size={18} />
        {isDrawingMode ? "Drawing…" : "Add field"}
      </button>
    </div>
  );
};

export const Field: React.FC<Land> = ({ id, name, coordinates, polygonId }) => {
  const { selectedLand, setSelectedLand } = useLandStore();
  const { currentDate } = useViewStore();
  const selected = selectedLand?.id === id;

  const handleClick = () => {
    setSelectedLand({ id, name, coordinates, polygonId });
    qc.prefetchQuery({
      queryKey: ["satelite", name, currentDate.toDateString()],
      queryFn: () =>
        getAgroMonitoringData(polygonId, currentDate.toISOString()),
    });
  };

  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between gap-2 bg-sand hover:bg-leaf-soft duration-200 py-2.5 px-3 rounded-xl text-start",
        selected && "bg-leaf-soft ring-2 ring-leaf font-semibold"
      )}
      onClick={handleClick}
    >
      <span className="truncate">{name}</span>
      {selected && <Check size={18} className="text-leaf shrink-0" />}
    </button>
  );
};
