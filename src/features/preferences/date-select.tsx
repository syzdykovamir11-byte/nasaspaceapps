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

  const arrow =
    "grid place-items-center size-9 rounded-xl hover:bg-sand duration-200";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-paper border border-line shadow-lg p-1.5 rounded-2xl">
      <button onClick={goToPreviousDay} className={arrow} aria-label="Previous day">
        <ChevronLeft size={20} />
      </button>
      <div className="px-2 text-center min-w-36">
        <p className="text-xs text-mute leading-4">Satellite image date</p>
        <p className="font-semibold leading-5">
          {date ? format(date, "d MMMM yyyy") : "Select a date"}
        </p>
      </div>
      <button onClick={goToNextDay} className={arrow} aria-label="Next day">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
