import { Snowflake } from "lucide-react";
import { MONTHS, type MonthClimate } from "../lib/analysis";
import { cx } from "./ui";

export function YearStrip({
  months,
  inGround,
  cropName,
}: {
  months: MonthClimate[];
  inGround: Set<number>;
  cropName: string;
}) {
  const maxRain = Math.max(...months.map((m) => m.rainMean), 1);
  return (
    <div>
      <div className="grid grid-cols-12 gap-1" role="table" aria-label="Typical year at this place">
        {months.map((m) => {
          const frost = m.frostShare;
          const bare = !inGround.has(m.month);
          return (
            <div key={m.month} role="row" className="flex flex-col items-center gap-1">
              <div className="flex h-7 items-center" role="cell" aria-label={`Frost in ${Math.round(frost * 10)} of 10 years`}>
                {frost >= 0.1 && <Snowflake className="size-5 text-sky" style={{ opacity: 0.3 + frost * 0.7 }} aria-hidden />}
              </div>
              <div className="flex h-20 w-full items-end rounded-md bg-sky/5" role="cell" aria-label={`${Math.round(m.rainMean)} mm rain`}>
                <div className="w-full rounded-md bg-sky/70" style={{ height: `${Math.max(4, (m.rainMean / maxRain) * 100)}%` }} />
              </div>
              <div className="text-[11px] tabular-nums text-muted">{Math.round(m.rainMean)}</div>
              <div
                role="cell"
                className={cx(
                  "h-4 w-full rounded",
                  bare ? "bg-[repeating-linear-gradient(135deg,#c9b89a_0_4px,#e8dcc4_4px_8px)]" : "bg-field",
                )}
                aria-label={bare ? "Field bare" : `${cropName} growing`}
              />
              <div className="text-xs font-semibold">{MONTHS[m.month - 1].slice(0, 1)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Snowflake className="size-4 text-sky" aria-hidden /> Frost in some years (darker = more often)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-sky/70" /> Usual rain, mm
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-field" /> {cropName} in the field (estimate)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[repeating-linear-gradient(135deg,#c9b89a_0_3px,#e8dcc4_3px_6px)]" /> Bare soil
        </span>
      </div>
    </div>
  );
}
