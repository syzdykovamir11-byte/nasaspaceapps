import type { Level } from "@/lib/indices/rank";
import type { SeasonSummary, ThreatResult } from "@/lib/indices/threats";
import { formatDoy, type FrostDates } from "@/lib/crops/frostDates";
import { ACTION_SOURCES, ACTIONS, type ActionSourceTag } from "@/lib/indices/actions";
import { formatWindow } from "@/lib/indices/format";
import { GRID_LAT_DEG, GRID_LON_DEG } from "@/lib/power/grid";
import type { PowerSeries } from "@/lib/power/types";
import styles from "./ThreatCard.module.css";

const LEVEL_WORD: Record<Level, string> = { unusual: "Unusual", watch: "Watch", normal: "Normal" };

interface Copy {
  title: string;
  /** Definition shown below the measured value. */
  description: string;
  compare: string;
  howWeKnow: (seasonWindow: string) => string;
  parameter: string;
  unit: string;
  /** What rank 1 means. */
  rankOne: string;
  /** Text next to the big number. */
  metricUnit: (v: number) => string;
  format: (v: number) => string;
  /** Data source line under the number. */
  provenance: string;
  /** Extra "How we know" text about where the values come from. */
  dataNote?: string;
}

const days = (v: number) => (v === 1 ? "day" : "days");

const COPY: Record<ThreatResult["id"], Copy> = {
  dry: {
    title: "Dry spells",
    description: "Longest run with less than 1 mm of rain or snow each day.",
    compare: "had a dry spell this long or longer",
    howWeKnow: (w) =>
      `Index: CDD, the largest number of consecutive days with precipitation below 1 mm (ETCCDI definition). Counted here only inside the season window (${w}), so spells are cut at its edges.`,
    parameter: "PRECTOTCORR (corrected precipitation)",
    unit: "days",
    rankOne: "longest dry spell",
    metricUnit: days,
    format: formatNum,
    provenance: "NASA POWER",
  },
  frost: {
    title: "Frost",
    description: "Days with a minimum air temperature below 0\u00a0°C.",
    compare: "had this many frost days or more",
    howWeKnow: (w) =>
      `Index: FD, the count of days when the daily minimum temperature is below 0\u00a0°C (ETCCDI definition). Counted here only inside the season window (${w}), not over the whole year.`,
    parameter: "T2M_MIN (daily minimum air temperature at 2 m)",
    unit: "days",
    rankOne: "most frost days",
    metricUnit: days,
    format: formatNum,
    provenance: "NASA POWER",
  },
  soil: {
    title: "Soil moisture",
    description: "Average wetness of the root-zone soil over the season. 0 means completely dry, 1 means saturated.",
    compare: "had soil this dry or drier",
    howWeKnow: (w) =>
      `Index: the average of NASA POWER daily root-zone soil wetness (GWETROOT) over the season window (${w}). This is a model estimate from the MERRA-2 reanalysis, not a measurement in a field. A lower value is ranked as worse.`,
    parameter: "GWETROOT (root zone soil wetness, 0 to 1, unitless)",
    unit: "(0 to 1)",
    rankOne: "driest soil",
    metricUnit: () => "of 1",
    format: (v) => v.toFixed(2),
    provenance: "NASA POWER · Model estimate",
    dataNote: "It does not show how much water a crop can use in your soil type; a soil test or a moisture probe in the field does that.",
  },
};

interface Props {
  threat: ThreatResult;
  summary: SeasonSummary;
  series: PowerSeries;
  onPickYear: (year: number) => void;
  /** Frost dates for this place, shown on the frost card next to the sowing advice. */
  frostDates: FrostDates | null;
  frostPeriod: string;
}

function ActionSrc({ tag }: { tag: ActionSourceTag }) {
  return (
    <a href={`#src-${tag}`} className={styles.src} aria-label={`Source ${tag}: ${ACTION_SOURCES[tag].title}`}>
      [{tag}]
    </a>
  );
}

export const THREAT_TITLE: Record<ThreatResult["id"], string> = {
  dry: COPY.dry.title,
  frost: COPY.frost.title,
  soil: COPY.soil.title,
};

/** Filled segments out of 4 for each level. A picture of the level word, not a new measurement. */
const LEVEL_SEGMENTS: Record<Level, number> = { normal: 4, watch: 2, unusual: 1 };

/** One compact line for the "Field health" list: title, level bar, level word, value and definition. */
export function ThreatRow({ threat }: { threat: ThreatResult }) {
  const c = COPY[threat.id];
  const r = threat.ranking;
  const filled = LEVEL_SEGMENTS[r.level];
  return (
    <li className={`${styles.row} ${styles[r.level]}`}>
      <div className={styles.rowHead}>
        <h3 className={styles.rowTitle}>{c.title}</h3>
        <span className={styles.segments} role="img" aria-label={`${LEVEL_WORD[r.level]} for this place`}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={i <= filled ? styles.segOn : styles.segOff} />
          ))}
        </span>
      </div>
      <p className={styles.rowText}>
        <span className={styles.rowWord}>{LEVEL_WORD[r.level]}</span> · {c.format(r.value)} {c.metricUnit(r.value)}. {c.description}
      </p>
    </li>
  );
}

export function ThreatCard({ threat, summary, series, onPickYear, frostDates, frostPeriod }: Props) {
  const actions = ACTIONS[threat.id];
  const c = COPY[threat.id];
  const r = threat.ranking;
  const others = `${summary.firstOtherYear}–${summary.lastOtherYear}`;
  return (
    <article className={`${styles.card} ${styles[r.level]}`}>
      <header className={styles.head}>
        <LevelIcon level={r.level} />
        <h3 className={styles.title}>{c.title}</h3>
        <span className={styles.word}>{LEVEL_WORD[r.level]}</span>
      </header>
      <p className={styles.metric}>
        <strong>{c.format(r.value)}</strong> <span>{c.metricUnit(r.value)}</span>
      </p>
      <p className={styles.sentence}>{c.description}</p>
      <p className={styles.provenance}>
        {c.provenance} · {formatWindow(summary.window)} {summary.year} · Area average
      </p>
      <details className={styles.details}>
        <summary>Compare with other seasons</summary>
        <SeasonHistory
          history={threat.history}
          year={summary.year}
          unit={c.unit}
          title={c.title}
          onPickYear={onPickYear}
        />
        <p className={styles.compare}>
          Rank {threat.rank} of {threat.rankOf} seasons
          {threat.tiedWith > 0 && `, shared with ${threat.tiedWith} other${threat.tiedWith === 1 ? "" : "s"}`} (1 = {c.rankOne}). {r.asBadOrWorse} of {r.pastCount} other seasons (
          {others}) {c.compare}. Those other seasons: median {c.format(r.pastMedian)} {c.unit}, from {c.format(r.pastMin)} to{" "}
          {c.format(r.pastMax)} {c.unit}.
        </p>
      </details>
      <details className={styles.details}>
        <summary>What you can do</summary>
        <ul>
          {actions.doNow.map((a) => (
            <li key={a.text}>
              {a.text} <ActionSrc tag={a.source} />
            </li>
          ))}
        </ul>
        {threat.id === "frost" && frostDates && (
          <p>
            Frost dates here ({frostPeriod}, NASA POWER, air at 2&nbsp;m over the grid cell): the last spring frost is
            typically around {formatDoy(frostDates.springMedian)}, and in 9 of 10 years it was by{" "}
            {formatDoy(frostDates.spring9of10)}. The first autumn frost is typically around{" "}
            {formatDoy(frostDates.autumnMedian)}, and in 9 of 10 years it came on or after {formatDoy(frostDates.autumn9of10)}.
          </p>
        )}
        <p className={styles.askTitle}>Ask your agronomist</p>
        <ul>
          {actions.askAgronomist.map((a) => (
            <li key={a.text}>
              {a.text} <ActionSrc tag={a.source} />
            </li>
          ))}
        </ul>
      </details>
      <details className={styles.details}>
        <summary>How we know</summary>
        <p>{c.howWeKnow(formatWindow(summary.window))}</p>
        {c.dataNote && <p>{c.dataNote}</p>}
        <p>
          Data: NASA POWER Daily API, parameter {c.parameter}, point {series.lat.toFixed(2)}° N {series.lon.toFixed(2)}° E,{" "}
          {series.start} to {series.end}, downloaded{" "}
          {threat.id === "soil" && series.soilSource ? series.soilSource.downloaded : series.source.downloaded}. POWER weather data sits on a {GRID_LAT_DEG}° latitude by{" "}
          {GRID_LON_DEG}° longitude grid, so this describes the surrounding area, not one field.
        </p>
        <p>
          Colour: compared with this place&apos;s other seasons since 1981. Among the worst 10% is &quot;Unusual&quot;, among the
          worst 25% is &quot;Watch&quot;. These cut-offs are a team choice, not a crop-damage threshold.
        </p>
      </details>
    </article>
  );
}

/**
 * One bar per season, the shown season highlighted and labelled. Decorative for screen readers:
 * the same choice is in the season list above the cards, and the numbers are in the text.
 */
function SeasonHistory({
  history,
  year,
  unit,
  title,
  onPickYear,
}: {
  history: { year: number; value: number }[];
  year: number;
  unit: string;
  title: string;
  onPickYear: (y: number) => void;
}) {
  const max = Math.max(1, ...history.map((h) => h.value));
  const w = 100 / history.length;
  const first = history[0]?.year;
  const last = history[history.length - 1]?.year;
  return (
    <figure className={styles.history}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={styles.historySvg} aria-hidden="true">
        {history.map((h, i) => {
          const hgt = (h.value / max) * 38;
          const active = h.year === year;
          return (
            <g key={h.year} className={styles.barHit} onClick={() => onPickYear(h.year)}>
              <title>{`${h.year}: ${h.value} ${unit}`}</title>
              <rect x={i * w} y={0} width={w} height={40} fill="transparent" />
              <rect
                x={i * w + w * 0.15}
                y={40 - Math.max(hgt, 0.6)}
                width={w * 0.7}
                height={Math.max(hgt, 0.6)}
                className={active ? styles.barActive : styles.bar}
              />
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.historyCaption}>
        <span>{first}</span>
        <span>
          {title}, {unit} · {year} highlighted. Choose a bar or use the Season selector.
        </span>
        <span>{last}</span>
      </figcaption>
    </figure>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function LevelIcon({ level }: { level: Level }) {
  // Shape differs by level so colour is never the only signal.
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", "aria-hidden": true, className: styles.icon };
  if (level === "unusual") {
    return (
      <svg {...common}>
        <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" fill="currentColor" />
        <rect x="11" y="6" width="2" height="8" fill="var(--surface)" />
        <rect x="11" y="16" width="2" height="2" fill="var(--surface)" />
      </svg>
    );
  }
  if (level === "watch") {
    return (
      <svg {...common}>
        <polygon points="12,2 23,21 1,21" fill="currentColor" />
        <rect x="11" y="9" width="2" height="6" fill="var(--surface)" />
        <rect x="11" y="17" width="2" height="2" fill="var(--surface)" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <polyline points="7,12.5 10.5,16 17,9" fill="none" stroke="var(--surface)" strokeWidth="2.2" />
    </svg>
  );
}
