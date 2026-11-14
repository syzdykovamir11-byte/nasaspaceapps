import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Satellite } from "lucide-react";
import { analyse, dayMonth, fmt, latestSeasonYear, MONTHS, seasonBounds, type Analysis, type Ranked, type Status } from "../lib/analysis";
import { fetchDaily } from "../lib/power";
import type { Crop, ThreatId } from "../lib/content";
import { cropMonths } from "../lib/rotation";
import { ThreatCard } from "./ThreatCard";
import { YearStrip } from "./YearStrip";
import { Button, Card } from "./ui";
import type { Point } from "./FieldMap";

const ORDER: Record<Status, number> = { red: 0, amber: 1, green: 2 };

// "3 of 44 past seasons had a longer one." / "No past season since 1981 had a longer one."
function compare(r: Ranked, first: number, plural: string, single = plural) {
  if (r.worseCount === 0) return `No past season since ${first} ${single}.`;
  if (r.worseCount === 1) return `Only 1 of ${r.pastCount} past seasons ${single}.`;
  return `${r.worseCount} of ${r.pastCount} past seasons ${plural}.`;
}

export function seasonLabel(a: Analysis) {
  const { start, end } = a.latest;
  return `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()} – ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

function threats(a: Analysis) {
  const f = a.firstYear;
  const cddWorse = ORDER[a.dry.cdd.status] <= ORDER[a.dry.rain.status];
  const list: { id: ThreatId; status: Status; headline: string; facts: string[] }[] = [
    {
      id: "dry",
      status: a.dry.status,
      headline: cddWorse
        ? `Longest dry spell: ${a.dry.cdd.value} days in a row. ${compare(a.dry.cdd, f, "had a longer one")}`
        : `Season rain: ${Math.round(a.dry.rain.value)} mm. ${compare(a.dry.rain, f, "were drier", "was drier")}`,
      facts: [
        `Longest run of days with almost no rain: ${a.dry.cdd.value} days.`,
        `Rain in the season: ${Math.round(a.dry.rain.value)} mm.`,
      ],
    },
    {
      id: "heat",
      status: a.heat.status,
      headline: `${Math.round(a.heat.tx90p.value)}% of days were hotter than usual for the date. ${compare(a.heat.tx90p, f, "had more")}`,
      facts: [
        `"Hotter than usual" means hotter than 9 in 10 days on that date in ${a.baseYears[0]}–${a.baseYears[1]}. Normally about 10% of days are like this.`,
      ],
    },
    {
      id: "frost",
      status: a.frost.status,
      headline:
        a.frost.fd.value === 0
          ? `No frost nights in the season. ${compare(a.frost.fd, f, "had more")}`
          : `${a.frost.fd.value} frost nights in the season. ${compare(a.frost.fd, f, "had more")}`,
      facts: [
        `Last spring frost this year: ${dayMonth(a.frost.lastSpring)} (usually ${dayMonth(a.frost.medianLastSpring)}).`,
        `First autumn frost: ${dayMonth(a.frost.firstAutumn)} (usually ${dayMonth(a.frost.medianFirstAutumn)}).`,
        `Frost-free days in a usual year: ${a.frost.medianFrostFreeDays}.`,
      ],
    },
    {
      id: "rain",
      status: a.rain.status,
      headline: `Wettest day: ${Math.round(a.rain.rx1day.value)} mm. ${compare(a.rain.rx1day, f, "had a wetter day")}`,
      facts: [`Days with 20 mm of rain or more: ${a.rain.r20.value}.`],
    },
  ];
  return list.sort((x, y) => ORDER[x.status] - ORDER[y.status]);
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; a: Analysis };

export function useAnalysis(point: Point) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setState({ kind: "loading" });
    const hemi = point.lat >= 0 ? "north" : "south";
    const year = latestSeasonYear(new Date(), hemi);
    const end = fmt(seasonBounds(year, hemi).end);
    fetchDaily(point.lat, point.lon, "19810101", end, ctrl.signal)
      .then((s) => setState({ kind: "ready", a: analyse(s) }))
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => ctrl.abort();
  }, [point.lat, point.lon, attempt]);
  return { state, retry: () => setAttempt((n) => n + 1) };
}

export function Loading() {
  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="relative">
        <Satellite className="size-12 text-field" aria-hidden />
        <Loader2 className="absolute -right-3 -top-3 size-6 animate-spin text-wheat" aria-hidden />
      </div>
      <p className="text-xl font-semibold">Getting NASA weather for your field</p>
      <p className="max-w-sm text-base text-muted">Daily records since 1981. The first time can take up to a minute.</p>
    </Card>
  );
}

export function ErrorBox({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Card className="space-y-3 border-bad/30 bg-bad-50">
      <p className="text-xl font-semibold text-bad">We could not get NASA data</p>
      <p className="text-base">Check your internet connection and try again.</p>
      <p className="text-sm text-muted">Details: {message}</p>
      <Button onClick={retry} icon={<RefreshCw className="size-5" aria-hidden />} className="w-full">
        Try again
      </Button>
    </Card>
  );
}

export function ReportView({ a, crop }: { a: Analysis; crop: Crop }) {
  const list = threats(a);
  const attention = list.filter((t) => t.status !== "green").length;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-base text-muted">Last season · {seasonLabel(a)}</p>
        <h2 className="mt-1 text-3xl font-bold leading-tight">
          {attention === 0 ? "A normal season for your area" : attention === 1 ? "1 thing needs attention" : `${attention} things need attention`}
        </h2>
        <p className="mt-2 text-base text-muted">Compared with {a.past.length} past seasons at this place, since {a.firstYear}.</p>
      </div>

      <div className="space-y-3">
        {list.map((t) => (
          <ThreatCard key={t.id} {...t} />
        ))}
      </div>

      <Card>
        <h3 className="text-xl font-bold">Your usual year</h3>
        <p className="mb-4 mt-1 text-base text-muted">When frost and rain usually come, and when the field is bare.</p>
        <YearStrip months={a.months} inGround={cropMonths(a, crop)} cropName={crop.name} />
      </Card>
    </div>
  );
}
