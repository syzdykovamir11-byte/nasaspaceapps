"use client";

import { useMemo, useState } from "react";
import { CROP_BY_ID, CROPS, SOURCES, type SourceTag } from "@/lib/crops/crops";
import { frostFreeByYear } from "@/lib/crops/frost";
import { formatDoy, frostDates } from "@/lib/crops/frostDates";
import { buildOptions, daysFor, WATER_SAME_MM, type CropFit, type FarmerDays, type Priority, type RotationOption } from "@/lib/crops/rotation";
import { median } from "@/lib/indices/rank";
import { cellSizeKm } from "@/lib/power/grid";
import type { PowerSeries } from "@/lib/power/types";
import { buildFacts } from "@/lib/ai/summary";
import { Carousel } from "./Carousel";
import { RotationSummary } from "./RotationSummary";
import styles from "./RotationSection.module.css";

export const ROTATION_YEARS = 3;

export interface RotationInput {
  years: (string | null)[];
  priority: Priority;
  /** Days from sowing to harvest the farmer typed, by crop id. */
  days: FarmerDays;
}

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "soil", label: "Improve soil" },
  { id: "water", label: "Save water" },
];

const MIN_DAYS = 30;
const MAX_DAYS = 365;

const TITLE: Record<RotationOption["kind"], string> = {
  current: "Your current rotation",
  legume: "Option: add a legume",
  water: "Option: lower water need",
  season: "Option: a crop that fits between the frosts more often",
  family: "Option: break the run of one crop family",
};

function Src({ tag }: { tag: SourceTag }) {
  return (
    <a href={`#src-${tag}`} className={styles.src} aria-label={`Source ${tag}: ${SOURCES[tag].title}`}>
      [{tag}]
    </a>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Word joiner after the dash and a no-break space before the unit keep "120–150 days" on one line.
const range = (r: readonly [number, number], unit: string) => `${r[0]}–\u2060${r[1]}\u00a0${unit}`;

interface Props {
  /** null while the place's data is loading or failed: the form stays, results wait. */
  series: PowerSeries | null;
  input: RotationInput;
  onChange: (next: RotationInput) => void;
}

export function RotationSection({ series, input, onChange }: Props) {
  const { years, priority, days } = input;
  const setYears = (f: (ys: (string | null)[]) => (string | null)[]) => onChange({ ...input, years: f(years) });
  const setPriority = (p: Priority) => onChange({ ...input, priority: p });
  /** Returns false if the value was rejected. An empty field goes back to the FAO guide value. */
  const setDays = (id: string, raw: string): boolean => {
    const next: Record<string, number> = { ...days };
    const n = Number(raw);
    if (raw.trim() === "") delete next[id];
    else if (!Number.isInteger(n) || n < MIN_DAYS || n > MAX_DAYS) return false;
    else next[id] = n;
    onChange({ ...input, days: next });
    return true;
  };
  const chosenCrops = [...new Set(years.filter((y): y is string => y !== null))]
    .map((id) => CROP_BY_ID[id]!)
    .filter((c) => c.group !== "fallow");

  const ffy = useMemo(() => (series ? frostFreeByYear(series) : []), [series]);
  const lengths = useMemo(() => ffy.map((y) => y.frostFreeDays), [ffy]);
  const period = ffy.length ? `${ffy[0]!.year}–${ffy[ffy.length - 1]!.year}` : "";
  const dates = useMemo(() => frostDates(ffy), [ffy]);
  const noFrostYears = ffy.filter((y) => y.lastSpringFrost === null || y.firstAutumnFrost === null).length;

  const chosenKey = years.every((y) => y !== null) ? years.join(",") : null;
  const options = useMemo(
    () => (chosenKey && ffy.length ? buildOptions(chosenKey.split(","), priority, ffy, days) : null),
    [chosenKey, priority, ffy, days],
  );
  const cell = cellSizeKm(series?.lat ?? 0);
  const cellText = `${Math.round(cell.northSouth)} × ${Math.round(cell.eastWest)} km`;

  return (
    <section aria-labelledby="rotations" className={styles.section}>
      <h2 id="rotations">Compare rotations</h2>
      {series && ffy.length === 0 && (
        <p className={styles.note}>
          There is no complete year of temperature data for this place, so the season check is not available.
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend>Your current crop rotation</legend>
        <div className={styles.selects}>
          {years.map((v, i) => (
            <label key={i} className={styles.selectLabel}>
              <span>Year {i + 1}</span>
              <select
                value={v ?? ""}
                onChange={(e) => setYears((ys) => ys.map((y, j) => (j === i ? e.target.value || null : y)))}
              >
                <option value="">Choose a crop</option>
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>What matters most to you?</legend>
        <div className={styles.radios}>
          {PRIORITIES.map((p) => (
            <label key={p.id} className={styles.radio}>
              <input type="radio" name="priority" value={p.id} checked={priority === p.id} onChange={() => setPriority(p.id)} />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      {chosenCrops.length > 0 && (
        <details className={styles.details}>
          <summary>Optional: days from sowing to harvest</summary>
          <fieldset className={styles.fieldset}>
            <legend>How many days from sowing to harvest?</legend>
            <p className={styles.hint}>
              Filled in from FAO guide values <Src tag="C1" />. Change them to fit your varieties.
            </p>
            <div className={styles.selects}>
              {chosenCrops.map((c) => (
                <DaysInput key={c.id} cropId={c.id} name={c.name} days={days} onCommit={setDays} />
              ))}
            </div>
          </fieldset>
        </details>
      )}

      {!series && <p className={styles.muted}>Choose a location to compare rotations.</p>}
      {series && !chosenKey && <p className={styles.muted}>Choose a crop for each year to compare up to three rotations.</p>}
      {options && (
        <>
          <h3 className={styles.stepTitle}>Your result</h3>
          {options.length === 1 && (
            <p className={styles.note}>No alternative found for these crops. See the questions at the bottom.</p>
          )}
          {options.length === 2 && <p className={styles.note}>Only 1 alternative found for these crops.</p>}
          {series && <RotationSummary facts={buildFacts(options, period, series.label, priority)} />}
          <GlanceTable options={options} period={period} />
          <Carousel
            label="Rotation options"
            items={options.map((o) => ({
              key: o.kind,
              title: TITLE[o.kind],
              node: <OptionCard option={o} period={period} cellText={cellText} />,
            }))}
          />
        </>
      )}

      <div className={styles.faq}>
        <h3 className={styles.stepTitle}>Questions</h3>
        {lengths.length > 0 && (
          <details className={styles.details}>
            <summary>How long is the frost-free season here?</summary>
            <p>
              Typically <strong>{Math.round(median(lengths))} days</strong> (median), from {Math.min(...lengths)} to{" "}
              {Math.max(...lengths)} days ({period}, NASA POWER).
              {dates &&
                ` In 9 of 10 years the last spring frost was by ${formatDoy(dates.spring9of10)} and the first autumn frost came on or after ${formatDoy(dates.autumn9of10)}.`}
            </p>
            <p className={styles.muted}>
              Counted from the last day below 0&nbsp;°C before 15 July to the first one on or after 15 July, using daily
              minimum air temperature at 2&nbsp;m, averaged over the grid cell. This is air frost over a wide area, not
              ground frost in your field.
              {noFrostYears > 0 &&
                ` In ${noFrostYears} of ${ffy.length} years there was no spring or no autumn frost; the season is then counted from 1 January or to 31 December.`}
            </p>
          </details>
        )}
        <details className={styles.details}>
          <summary>Where do the days from sowing to harvest come from?</summary>
          <p className={styles.muted}>
            We start from FAO&apos;s global guide, which FAO calls a rough approximation and says local values are better{" "}
            <Src tag="C1" />. You can change them to what your own varieties need under &quot;Optional: days from sowing to
            harvest&quot;. The tool then counts how many past years had at least that many frost-free days here.
          </p>
        </details>
        {options && !options.some((o) => o.kind === "water") && (
          <details className={styles.details}>
            <summary>Why is there no lower-water option?</summary>
            <p className={styles.muted}>
              Either no crop in our table has a lower FAO water need than yours without repeating an option already shown,
              or that option was not among the two chosen for your priority <Src tag="C1" />.
            </p>
          </details>
        )}
        {options && options.length < 3 && (
          <details className={styles.details}>
            <summary>Why are there fewer than 3 options?</summary>
            <p className={styles.muted}>
              Our rules need FAO growing periods or water values, and some crops in the list do not have them{" "}
              <Src tag="C1" />.
            </p>
          </details>
        )}
        <details className={styles.details}>
          <summary>Where does the crop data come from?</summary>
          <ul className={styles.sources}>
            {(Object.keys(SOURCES) as SourceTag[]).map((t) => (
              <li key={t} id={`src-${t}`}>
                [{t}] <a href={SOURCES[t].url} target="_blank" rel="noreferrer">{SOURCES[t].title}</a>, read{" "}
                <span className={styles.nowrap}>{SOURCES[t].read}</span>.
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

const GLANCE_LABEL: Record<RotationOption["kind"], string> = {
  current: "Your current rotation",
  legume: "Add a legume",
  water: "Lower water need",
  season: "A crop that fits between the frosts more often",
  family: "Break the run of one crop family",
};

/**
 * The main comparison values for every option at once, so options can be compared without swiping.
 * A real table on wider screens and a labelled list on narrow ones; only one of the two is displayed.
 */
function GlanceTable({ options, period }: { options: RotationOption[]; period: string }) {
  const fitText = (o: RotationOption) => {
    const known = o.evaluation.fits.filter((f) => f.fitsYears !== null);
    if (!known.length) return "Unknown";
    const worst = known.reduce((a, b) => (b.fitsYears! < a.fitsYears! ? b : a));
    const unknown = o.evaluation.fits.some((f) => f.fitsYears === null && f.crop.group !== "fallow");
    return `${unknown ? "At most " : ""}${worst.fitsYears} of ${worst.totalYears} years`;
  };
  const changeText = (o: RotationOption) =>
    o.change
      ? `Year ${o.change.index + 1}: ${o.change.to.crop.name} instead of ${o.change.from.crop.name}`
      : o.evaluation.crops.map((c) => c.name).join(" → ");
  const waterText = (o: RotationOption) => (o.kind === "current" ? "–" : capitalize(o.water));
  const nText = (o: RotationOption) => (o.evaluation.legumes.length ? "Yes" : "No");
  const fitHead = `Frost-free season long enough (${period})`;
  return (
    <div className={styles.glanceWrap}>
      <p className={styles.glanceCaption} id="glance-caption">
        Quick comparison. Frost data: NASA POWER, {period}. Crop days and water: FAO guide values <Src tag="C1" />.
        Details are in the cards below.
      </p>
      <table className={styles.glance} aria-labelledby="glance-caption">
        <thead>
          <tr>
            <th scope="col">Option</th>
            <th scope="col">What changes</th>
            <th scope="col">{fitHead}</th>
            <th scope="col">Water need vs now</th>
            <th scope="col">Adds nitrogen to soil</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o) => (
            <tr key={o.kind}>
              <th scope="row">{GLANCE_LABEL[o.kind]}</th>
              <td>{changeText(o)}</td>
              <td>{fitText(o)}</td>
              <td>{waterText(o)}</td>
              <td>{nText(o)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={styles.glanceList} aria-labelledby="glance-caption">
        {options.map((o) => (
          <li key={o.kind}>
            <p className={styles.glanceItemTitle}>{GLANCE_LABEL[o.kind]}</p>
            <dl>
              <div>
                <dt>What changes</dt>
                <dd>{changeText(o)}</dd>
              </div>
              <div>
                <dt>{fitHead}</dt>
                <dd>{fitText(o)}</dd>
              </div>
              <div>
                <dt>Water need vs now</dt>
                <dd>{waterText(o)}</dd>
              </div>
              <div>
                <dt>Adds nitrogen to soil</dt>
                <dd>{nText(o)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DaysInput({ cropId, name, days, onCommit }: { cropId: string; name: string; days: FarmerDays; onCommit: (id: string, raw: string) => boolean }) {
  const crop = CROP_BY_ID[cropId]!;
  const current = daysFor(crop, days);
  const [error, setError] = useState(false);
  // Local draft so typing is free; it is checked on Enter or blur. The input is never remounted, so focus stays.
  const [draft, setDraft] = useState(current.days === null ? "" : String(current.days));
  const inputId = `days-${cropId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const commit = () => {
    const ok = onCommit(cropId, draft);
    setError(!ok);
    if (!ok) setDraft(current.days === null ? "" : String(current.days));
    else if (draft.trim() === "") setDraft(crop.growingDays ? String(crop.growingDays[0]) : "");
  };
  return (
    <div className={styles.selectLabel}>
      <label htmlFor={inputId}>{name}</label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={MIN_DAYS}
        max={MAX_DAYS}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="days"
        aria-describedby={error ? `${errorId} ${hintId}` : hintId}
        aria-invalid={error || undefined}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          Not used: enter whole days from {MIN_DAYS} to {MAX_DAYS}. Still using {current.days ?? "no value"}.
        </span>
      )}
      <span id={hintId} className={styles.hint}>
        {crop.growingDays
          ? `FAO guide: ${range(crop.growingDays, "days")}${current.source === "farmer" ? " · using your value" : ""}`
          : current.source === "farmer"
            ? "Using your value (FAO lists no period)"
            : "FAO lists no period; enter yours to include this crop"}
        {`. Whole days, ${MIN_DAYS}–⁠${MAX_DAYS}.`}
      </span>
    </div>
  );
}

const daysText = (f: CropFit) => (f.days === null ? "" : `, needs ${f.days} days (${f.daysSource === "farmer" ? "your value" : "FAO guide"})`);

function OptionCard({ option: o, period, cellText }: { option: RotationOption; period: string; cellText: string }) {
  const ev = o.evaluation;
  const withPeriod = ev.fits.filter((f) => f.fitsYears !== null);
  const worst = withPeriod.length ? withPeriod.reduce((a, b) => (b.fitsYears! < a.fitsYears! ? b : a)) : null;
  const total = ev.fits[0]?.totalYears ?? 0;
  const unknownFit = [...new Set(ev.fits.filter((f) => f.fitsYears === null && f.crop.group !== "fallow").map((f) => f.crop.name))];
  const legume = ev.legumes.find((c) => c.nFixKgHa);
  const hasFallow = ev.crops.some((c) => c.group === "fallow");

  const benefits: React.ReactNode[] = [];
  if (ev.legumes.length) {
    benefits.push(
      <>Includes a nitrogen-fixing legume ({ev.legumes.map((c) => c.name).join(", ")}). The amount fixed varies widely and depends mostly on growing conditions <Src tag="C3" />.</>,
    );
  }
  if (o.kind !== "current" && o.water === "less") {
    benefits.push(<>{o.change?.to.crop.name} has a lower FAO water need than {o.change?.from.crop.name} (guide values for irrigated crops) <Src tag="C1" />.</>);
  }
  if (ev.mixesRoots) benefits.push(<>Mixes shallower and deeper rooting crops <Src tag="C2" />.</>);

  return (
    <article className={`${styles.card} ${o.kind === "current" ? styles.current : ""}`}>
      <h3 className={styles.cardTitle}>{TITLE[o.kind]}</h3>
      <ol className={styles.sequence} aria-label="Crops by year">
        {ev.crops.map((c, i) => {
          const changed = o.change?.index === i;
          return (
            <li key={i} className={changed ? styles.changed : undefined}>
              <span className={styles.yearNo}>Year {i + 1}</span> {c.name}
              {changed && <span className={styles.changedTag}> (changed)</span>}
            </li>
          );
        })}
      </ol>

      <p className={styles.why}>
        <strong>Why: </strong>
        {o.kind === "current" && "This is what you grow now. The other options are compared with it."}
        {o.kind === "legume" && o.change &&
          `${o.change.to.crop.name} instead of ${o.change.from.crop.name} in year ${o.change.index + 1}. Our rule: where a cereal follows a cereal, put in a legume, a crop that adds nitrogen to the soil.`}
        {o.kind === "water" && o.change &&
          `${o.change.to.crop.name} instead of ${o.change.from.crop.name} in year ${o.change.index + 1}. Our rule: swap the crop with the highest FAO water need for the crop in our table with the lowest${o.legumesExcluded ? " (legumes left out, as they have their own option)" : ""}.`}
        {o.kind === "family" && o.change &&
          `${o.change.to.crop.name} instead of ${o.change.from.crop.name} in year ${o.change.index + 1}. Our rule: where one crop family follows itself, put a crop from another family in that slot${o.legumesExcluded ? " (legumes left out, as they have their own option)" : ""}. Whether this helps against pests or disease on your farm is for your agronomist to judge; this tool has no pest data.`}
        {o.kind === "season" && o.change &&
          `${o.change.to.crop.name} instead of ${o.change.from.crop.name} in year ${o.change.index + 1}. Our rule: swap the crop whose days from sowing to harvest fit between the frosts in the fewest years for the crop that fits in the most years${o.legumesExcluded ? " (legumes left out, as they have their own option)" : ""}.`}
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Years the frost-free season was long enough for every crop</dt>
          <dd>
            {!worst
              ? "Unknown: no days from sowing to harvest for these crops"
              : unknownFit.length
                ? `At most ${worst.fitsYears} of ${total} years (${period}); unknown for ${unknownFit.join(", ")}`
                : `${worst.fitsYears} of ${total} years (${period})`}
            {worst && !unknownFit.length && (
              <span className={styles.ddNote}>Hardest to fit: {worst.crop.name}{daysText(worst)}.</span>
            )}
          </dd>
        </div>
        {o.change && (
          <div>
            <dt>Long enough for {o.change.to.crop.name}</dt>
            <dd>
              {o.change.to.fitsYears === null ? "Unknown" : `${o.change.to.fitsYears} of ${total} years${daysText(o.change.to)}`}
              {o.change.from.fitsYears !== null && (
                <span className={styles.ddNote}>
                  {o.change.from.crop.name}: {o.change.from.fitsYears} of {total} years{daysText(o.change.from)}
                </span>
              )}
            </dd>
          </div>
        )}
        {o.kind !== "current" && (
          <div>
            <dt>Water need{o.change ? `: ${o.change.to.crop.name} vs ${o.change.from.crop.name}` : " vs now"}</dt>
            <dd>
              {o.water === "unknown" ? "Unknown (no FAO value for one of them)" : capitalize(o.water)}
              {o.change?.to.crop.waterMm && o.change.from.crop.waterMm && (
                <span className={styles.ddNote}>
                  {range(o.change.to.crop.waterMm, "mm")} vs {range(o.change.from.crop.waterMm, "mm")} per season <Src tag="C1" />.
                  FAO guide values for irrigated crops, compared by the middle of each range; under {WATER_SAME_MM}&nbsp;mm
                  apart counts as &quot;about the same&quot; (our choice).
                </span>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>Adds nitrogen to soil</dt>
          <dd>{ev.legumes.length ? `Yes (${ev.legumes.map((c) => c.name).join(", ")})` : "No"}</dd>
        </div>
      </dl>

      <p className={styles.caveat}>
        Frost-free season: days between the last spring frost and the first autumn frost (air below 0&nbsp;°C, NASA
        POWER, area average). Many crops survive a light frost.
      </p>

      <details className={styles.details}>
        <summary>Evidence</summary>
        <ul>
          {ev.fits.filter((f, i) => f.crop.group !== "fallow" && ev.fits.findIndex((g) => g.crop.id === f.crop.id) === i).map((f) => (
            <li key={f.crop.id}>
              {f.crop.name}:{" "}
              {f.crop.growingDays ? <>FAO total growing period {range(f.crop.growingDays, "days")} <Src tag="C1" />. </> : <>no growing period listed by FAO <Src tag="C1" />. </>}
              {f.days !== null && f.fitsYears !== null && (
                <>
                  Using {f.days} days ({f.daysSource === "farmer" ? "your value" : "the shortest FAO value"}), the
                  days between frosts were at least that many in {f.fitsYears} of {f.totalYears} years (NASA POWER).{" "}
                </>
              )}
              {f.crop.waterMm && <>Water need {range(f.crop.waterMm, "mm")} per season for an irrigated crop <Src tag="C1" />.</>}{" "}
              {f.crop.rootM && <>Rooting depth {range(f.crop.rootM, "m")} <Src tag="C2" />.</>}
            </li>
          ))}
          {legume && legume.nFixKgHa && (
            <li>
              {legume.name}: in Saskatchewan, {legume.nFromAirPct}% of plant nitrogen comes from the air and{" "}
              {range(legume.nFixKgHa, "kg N/ha")} is fixed <Src tag="C3" />.
            </li>
          )}
        </ul>
      </details>

      <details className={styles.details}>
        <summary>Possible benefits</summary>
        {benefits.length ? (
          <ul>{benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
        ) : (
          <p>No benefit can be shown from the data in this tool.</p>
        )}
      </details>

      <details className={styles.details}>
        <summary>What this tool does not know</summary>
        <ul>
          <li>FAO values are rough global guide values, not local measurements <Src tag="C1" />.</li>
          <li>Nitrogen values come from Saskatchewan, Canada, not from Kazakhstan. We use them as a stand-in; this is our choice and needs checking.</li>
          <li>No data on your soil, pests, diseases, prices, markets, sowing dates or equipment, so income cannot be compared.</li>
          {ev.waterMissing.length > 0 && <li>No FAO water value for {[...new Set(ev.waterMissing.map((c) => c.name))].join(", ")}.</li>}
          {unknownFit.length > 0 && <li>No days from sowing to harvest for {unknownFit.join(", ")}, so the between-frosts check skips it. You can enter your own value above.</li>}
          <li>Fitting between the frosts does not mean the crop will succeed: sowing date, soil moisture and heat also matter.</li>
          {hasFallow && <li>No source on the effects of fallow has been read for this tool.</li>}
          <li>The weather data describes an area of about {cellText}, not your field.</li>
        </ul>
      </details>

      <details className={styles.details}>
        <summary>Ask your agronomist</summary>
        <ul>
          <li>Crops differ in how much frost they tolerate. This check simply uses 0&nbsp;°C, which is strict for some crops.</li>
          <li>How many days from sowing to harvest your varieties need here.</li>
          <li>Which varieties and sowing dates fit your farm.</li>
          <li>Whether there is a market and a fair price for {o.change ? o.change.to.crop.name : "these crops"} near you.</li>
          <li>FAO water needs are for irrigated crops. Use them only to compare crops with each other.</li>
        </ul>
      </details>
    </article>
  );
}

