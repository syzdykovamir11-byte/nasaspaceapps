import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, MapPin, Sprout } from "lucide-react";
import { FieldMap, type Point } from "./components/FieldMap";
import { CropPicker } from "./components/CropPicker";
import { ErrorBox, Loading, ReportView, useAnalysis } from "./components/Report";
import { RotationCarousel } from "./components/RotationCarousel";
import { SourcesSheet } from "./components/SourcesSheet";
import { Button, cx } from "./components/ui";
import { CROPS, type Crop } from "./lib/content";
import { buildOptions } from "./lib/rotation";

type Step = "map" | "crop" | "report" | "plan";
const STEPS: Step[] = ["map", "crop", "report", "plan"];
const STEP_NAME: Record<Step, string> = { map: "Field", crop: "Crop", report: "Report", plan: "Options" };

function load<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode: nothing to remember */
  }
}

function Progress({ step }: { step: Step }) {
  const i = STEPS.indexOf(step);
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Step ${i + 1} of ${STEPS.length}: ${STEP_NAME[step]}`}>
      {STEPS.map((s, j) => (
        <li key={s} className={cx("h-2 rounded-full transition-all", j === i ? "w-7 bg-field" : j < i ? "w-2 bg-field/60" : "w-2 bg-field/20")} />
      ))}
    </ol>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {sub && <p className="mt-2 text-lg text-muted">{sub}</p>}
    </div>
  );
}

function Results({ point, crop, step, onPlan, onRestart }: { point: Point; crop: Crop; step: Step; onPlan: () => void; onRestart: () => void }) {
  const { state, retry } = useAnalysis(point);
  if (state.kind === "loading") return <Loading />;
  if (state.kind === "error") return <ErrorBox message={state.message} retry={retry} />;

  if (step === "report")
    return (
      <>
        <ReportView a={state.a} crop={crop} />
        <CtaBar>
          <Button className="w-full" onClick={onPlan} icon={<Sprout className="size-6" aria-hidden />}>
            What should I plant next?
          </Button>
        </CtaBar>
      </>
    );

  return (
    <>
      <Heading title="3 options for the next seasons" sub="Swipe or use the arrows. Compare them, then talk to your agronomist." />
      <RotationCarousel options={buildOptions(state.a, crop)} />
      <CtaBar>
        <Button variant="secondary" className="w-full" onClick={onRestart} icon={<MapPin className="size-6" aria-hidden />}>
          Check another field
        </Button>
      </CtaBar>
    </>
  );
}

function CtaBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-[600] -mx-4 mt-6 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("map");
  const [point, setPoint] = useState<Point | null>(() => load<Point>("ft:point"));
  const [cropId, setCropId] = useState<string | null>(() => load<string>("ft:crop"));
  const [sources, setSources] = useState(false);
  const crop = CROPS.find((c) => c.id === cropId) ?? null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);
  useEffect(() => {
    save("ft:point", point);
  }, [point]);
  useEffect(() => {
    save("ft:crop", cropId);
  }, [cropId]);

  const back = () => setStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[700] border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          {step !== "map" ? (
            <button onClick={back} className="-ml-2 grid size-12 place-items-center rounded-xl text-field hover:bg-field-50" aria-label="Back">
              <ArrowLeft className="size-7" aria-hidden />
            </button>
          ) : (
            <span className="grid size-10 place-items-center rounded-xl bg-field text-white" aria-hidden>
              <Sprout className="size-6" />
            </span>
          )}
          <span className="text-xl font-bold tracking-tight">Field Tracker</span>
          <span className="ml-auto">
            <Progress step={step} />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {step === "map" && (
          <>
            <Heading title="Where is your field?" sub="See how last season went on your field, using NASA data. Then compare what to plant next." />
            <FieldMap point={point} onPick={setPoint} />
            <CtaBar>
              <Button className="w-full" disabled={!point} onClick={() => setStep("crop")} icon={<ArrowRight className="size-6" aria-hidden />}>
                {point ? "Next: my crop" : "Tap the map first"}
              </Button>
            </CtaBar>
          </>
        )}

        {step === "crop" && (
          <>
            <Heading title="What do you grow here now?" sub="Pick one." />
            <CropPicker value={cropId} onChange={setCropId} />
            <CtaBar>
              <Button className="w-full" disabled={!crop} onClick={() => setStep("report")} icon={<ArrowRight className="size-6" aria-hidden />}>
                {crop ? "Show my field report" : "Pick a crop first"}
              </Button>
            </CtaBar>
          </>
        )}

        {(step === "report" || step === "plan") && point && crop && (
          <Results point={point} crop={crop} step={step} onPlan={() => setStep("plan")} onRestart={() => setStep("map")} />
        )}

        <footer className="mt-6 space-y-3 pb-28 text-base text-muted">
          <p className="rounded-2xl border border-line bg-card p-4">
            This tool supports your decisions. It does not replace your own judgement or local agricultural advice.
          </p>
          <Button variant="ghost" className="w-full" onClick={() => setSources(true)} icon={<BookOpen className="size-5" aria-hidden />}>
            Sources and how it works
          </Button>
        </footer>
      </main>

      <SourcesSheet open={sources} onClose={() => setSources(false)} />
    </div>
  );
}
