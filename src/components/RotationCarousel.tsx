import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, HelpCircle, Lightbulb, LineChart, ThumbsUp } from "lucide-react";
import type { RotationOption } from "../lib/rotation";
import { cx, Src, STATUS_LOOK } from "./ui";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

function OptionCard({ o, index }: { o: RotationOption; index: number }) {
  const look = STATUS_LOOK[o.fit.status];
  return (
    <article className="flex h-full flex-col rounded-3xl border border-line bg-card shadow-sm">
      <header className="p-5 pb-4">
        <div className="text-sm font-bold uppercase tracking-wide text-muted">Option {index + 1}</div>
        <h3 className="mt-0.5 text-2xl font-bold leading-tight">{o.title}</h3>
        <span className={cx("mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold", look.pill)}>
          <look.Icon className="size-5" aria-hidden />
          {o.fit.label}
        </span>
      </header>

      <ol className="mx-5 grid grid-cols-3 gap-2" aria-label="Crop order">
        {o.sequence.map((s, i) => (
          <li key={i} className="flex flex-col items-center rounded-2xl bg-paper px-1 py-3 text-center">
            <span className="text-3xl leading-none" aria-hidden>
              {s.emoji}
            </span>
            <span className="mt-1.5 text-sm font-semibold leading-tight">{s.label}</span>
            <span className="text-xs text-muted">{s.sub}</span>
          </li>
        ))}
      </ol>

      <div className="flex-1 space-y-5 p-5 text-base leading-relaxed">
        <Section icon={<Lightbulb className="size-4" aria-hidden />} title="Why this option">
          {o.why.map((a) => (
            <p key={a.text}>
              {a.text}
              <Src ids={a.src} />
            </p>
          ))}
        </Section>
        <Section icon={<LineChart className="size-4" aria-hidden />} title="What the data says">
          <ul className="space-y-1.5">
            {o.data.map((a) => (
              <li key={a.text}>
                {a.text}
                <Src ids={a.src} />
              </li>
            ))}
          </ul>
        </Section>
        <Section icon={<ThumbsUp className="size-4" aria-hidden />} title="Possible benefits">
          <ul className="space-y-1.5">
            {o.benefits.map((a) => (
              <li key={a.text} className="flex gap-2">
                <span className="text-ok" aria-hidden>
                  ✓
                </span>
                <span>
                  {a.text}
                  <Src ids={a.src} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Section icon={<HelpCircle className="size-4" aria-hidden />} title="What we did not check">
          <p className="text-muted">{o.unknown.join(" · ")}</p>
        </Section>
        <div className="rounded-2xl bg-warn-50 p-4">
          <h4 className="mb-1 text-sm font-bold uppercase tracking-wide text-warn">Ask your agronomist</h4>
          {o.ask.map((a) => (
            <p key={a.text}>
              {a.text}
              <Src ids={a.src} />
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export function RotationCarousel({ options }: { options: RotationOption[] }) {
  const [ref, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [sel, setSel] = useState(0);

  const onSelect = useCallback(() => api && setSel(api.selectedScrollSnap()), [api]);
  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div aria-roledescription="carousel" aria-label="Crop rotation options">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg font-semibold" aria-live="polite">
          Option {sel + 1} of {options.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => api?.scrollPrev()}
            disabled={sel === 0}
            className="grid size-14 place-items-center rounded-2xl border-2 border-field/25 bg-card text-field disabled:opacity-35"
            aria-label="Previous option"
          >
            <ArrowLeft className="size-6" aria-hidden />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            disabled={sel === options.length - 1}
            className="grid size-14 place-items-center rounded-2xl bg-field text-white disabled:opacity-35"
            aria-label="Next option"
          >
            <ArrowRight className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-hidden px-4" ref={ref}>
        <div className="flex gap-3">
          {options.map((o, i) => (
            <div key={o.key} className="min-w-0 shrink-0 grow-0 basis-[90%] sm:basis-[85%]" aria-roledescription="slide" aria-label={`${i + 1} of ${options.length}`}>
              <OptionCard o={o} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {options.map((o, i) => (
          <button
            key={o.key}
            onClick={() => api?.scrollTo(i)}
            className={cx("h-3 rounded-full transition-all", i === sel ? "w-8 bg-field" : "w-3 bg-field/25")}
            aria-label={`Go to option ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
