"use client";

import React, { useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useViewStore } from "~/lib/store/view-store";

type DateModifier = (date: Date, amount: number) => Date;

export default function DateSelect() {
  const { currentDate: date, setCurrentDate: setDate } = useViewStore();

  const updateDate = useCallback(
    (modifier: DateModifier) => {
      setDate(modifier(date || new Date(), 1));
    },
    [date, setDate]
  );

  const goToPreviousDay = useCallback(() => updateDate(subDays), [updateDate]);
  const goToNextDay = useCallback(() => updateDate(addDays), [updateDate]);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 flex justify-center items-center bg-neutral-900/80 hover:bg-neutral-800/80 duration-200 backdrop-blur p-2 rounded-xl">
      <div className="flex items-center gap-2">
        <button onClick={goToPreviousDay} className="mr-1">
          <ChevronLeft size={16} />
        </button>
        <span>{date ? format(date, "MMMM d") : "Select a date"}</span>
        <button onClick={goToNextDay} className="ml-1">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
