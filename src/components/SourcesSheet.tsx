import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SOURCES } from "../lib/content";

export function SourcesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(40rem,calc(100%-2rem))] rounded-3xl bg-card p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between border-b border-line p-5">
        <h2 className="text-xl font-bold">Sources</h2>
        <button onClick={onClose} className="grid size-12 place-items-center rounded-xl hover:bg-paper" aria-label="Close">
          <X className="size-6" aria-hidden />
        </button>
      </div>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 text-base">
        <p>
          Weather comes from NASA POWER (daily values since 1981). One POWER grid cell is 0.5° wide, about 55 km. It
          describes the weather of your area, not differences inside your field.
        </p>
        <p className="text-muted">
          Colours compare last season with this place's own past seasons. Red means unusual for this place. It does not
          mean your crop was damaged.
        </p>
        <ol className="space-y-2">
          {SOURCES.map((s) => (
            <li key={s.id} className="flex gap-3">
              <span className="mt-0.5 grid h-6 min-w-6 place-items-center rounded-md bg-field-50 px-1 text-sm font-semibold text-field">
                {s.id}
              </span>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-field underline underline-offset-2">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          Map: Esri World Imagery and OpenStreetMap. Built with an AI assistant (Claude); see the project README.
        </p>
      </div>
    </dialog>
  );
}
