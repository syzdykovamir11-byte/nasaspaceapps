import { Check } from "lucide-react";
import { CROPS } from "../lib/content";
import { cx, Src } from "./ui";

export function CropPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Crop grown now">
        {CROPS.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.id)}
              className={cx(
                "relative flex min-h-32 flex-col items-center justify-center gap-1 rounded-3xl border-2 bg-card p-3 text-center transition",
                on ? "border-field bg-field-50 shadow-sm" : "border-line hover:border-field/40",
              )}
            >
              {on && (
                <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-field text-white">
                  <Check className="size-4.5" strokeWidth={3} aria-hidden />
                </span>
              )}
              <span className="text-5xl leading-none" aria-hidden>
                {c.emoji}
              </span>
              <span className="mt-1 text-lg font-semibold">{c.name}</span>
              <span className="text-sm text-muted">
                {c.minDays === c.maxDays ? c.minDays : `${c.minDays}–${c.maxDays}`} days to grow
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        Growing days are rough FAO values. Local values are better.
        <Src ids={[3]} />
      </p>
    </div>
  );
}
