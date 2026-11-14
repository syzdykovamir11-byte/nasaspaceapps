import { useId, useState } from "react";
import { ChevronDown, CloudRain, Snowflake, Sun, Droplets } from "lucide-react";
import type { Status } from "../lib/analysis";
import { THREAT_INFO, type ThreatId } from "../lib/content";
import { cx, Src, STATUS_LOOK, StatusBadge } from "./ui";

const ICONS = { dry: Droplets, heat: Sun, frost: Snowflake, rain: CloudRain };

export function ThreatCard({
  id,
  status,
  headline,
  facts,
}: {
  id: ThreatId;
  status: Status;
  headline: string;
  facts: string[];
}) {
  const [open, setOpen] = useState(status === "red");
  const info = THREAT_INFO[id];
  const Icon = ICONS[id];
  const panel = useId();

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/.04)]">
      <button
        className="flex w-full items-start gap-4 p-5 text-left"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cx("mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl", STATUS_LOOK[status].pill)}>
          <Icon className="size-7" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xl font-bold">{info.title}</span>
            <StatusBadge status={status} />
          </span>
          <span className="mt-1.5 block text-lg leading-snug text-ink/85">{headline}</span>
        </span>
      </button>

      <div className="border-t border-line">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center justify-center gap-1.5 text-base font-semibold text-field"
          aria-expanded={open}
          aria-controls={panel}
        >
          {open ? "Hide details" : "What can I do?"}
          <ChevronDown className={cx("size-5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>

      {open && (
        <div id={panel} className="space-y-5 border-t border-line bg-paper/60 p-5 text-base leading-relaxed">
          {facts.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-muted">What we see</h4>
              <ul className="space-y-1">
                {facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h4 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-muted">What you can do</h4>
            <ul className="space-y-2">
              {info.actions.map((a) => (
                <li key={a.text} className="flex gap-2.5">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-field" aria-hidden />
                  <span>
                    {a.text}
                    <Src ids={a.src} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-warn-50 p-4">
            <h4 className="mb-1 text-sm font-bold uppercase tracking-wide text-warn">Ask your agronomist</h4>
            {info.ask.map((a) => (
              <p key={a.text}>
                {a.text}
                <Src ids={a.src} />
              </p>
            ))}
          </section>
          <section className="text-sm text-muted">
            <h4 className="mb-1 font-bold uppercase tracking-wide">How we know</h4>
            <p>
              {info.howWeKnow}
              <Src ids={info.srcHow} />
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
