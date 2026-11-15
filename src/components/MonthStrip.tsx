import type { MonthStrip as Strip } from "@/lib/indices/months";
import type { SeasonWindow } from "@/lib/indices/season";
import styles from "./MonthStrip.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Typical year as a 12-column table. The numbers carry the meaning; the tint only helps scanning. */
export function MonthStrip({ strip, window }: { strip: Strip; window: SeasonWindow }) {
  const inSeason = (m: number) => m >= window.startMonth && m <= window.endMonth;
  const maxRain = Math.max(1, ...strip.months.map((m) => m.medianPrecipMm));
  return (
    <div className={styles.wrap}>
      <table className={`${styles.table} ${styles.horizontal}`}>
        <caption className={styles.caption}>
          A typical year here, {strip.firstYear}–{strip.lastYear} ({strip.years} years, NASA POWER). Months in the growing
          season are marked with a line on top.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rowHead}>
              <span className="sr-only">Measure</span>
            </th>
            {strip.months.map((m) => (
              <th key={m.month} scope="col" className={inSeason(m.month) ? styles.season : undefined}>
                {MONTHS[m.month - 1]}
                {inSeason(m.month) && <span className="sr-only"> (growing season)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={styles.rowHead}>
              Frost<span className={styles.unit}>% of years</span>
            </th>
            {strip.months.map((m) => {
              const pct = Math.round(m.frostShare * 100);
              return (
                <td key={m.month} style={{ "--tint": `${pct}%` } as React.CSSProperties} className={styles.frost}>
                  {pct}
                </td>
              );
            })}
          </tr>
          <tr>
            <th scope="row" className={styles.rowHead}>
              Rain<span className={styles.unit}>mm, median</span>
            </th>
            {strip.months.map((m) => (
              <td
                key={m.month}
                style={{ "--tint": `${Math.round((m.medianPrecipMm / maxRain) * 100)}%` } as React.CSSProperties}
                className={styles.rain}
              >
                {Math.round(m.medianPrecipMm)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {/* Narrow screens: the same numbers as a vertical table. Only one of the two tables is displayed. */}
      <table className={styles.vertical}>
        <caption className={styles.caption}>
          A typical year here, {strip.firstYear}–{strip.lastYear} ({strip.years} years, NASA POWER). Growing-season months
          are in bold.
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Frost, % of years</th>
            <th scope="col">Rain, mm (median)</th>
          </tr>
        </thead>
        <tbody>
          {strip.months.map((m) => {
            const pct = Math.round(m.frostShare * 100);
            return (
              <tr key={m.month} className={inSeason(m.month) ? styles.seasonRow : undefined}>
                <th scope="row">
                  {MONTHS[m.month - 1]}
                  {inSeason(m.month) && <span className="sr-only"> (growing season)</span>}
                </th>
                <td style={{ "--tint": `${pct}%` } as React.CSSProperties} className={styles.frost}>
                  {pct}
                </td>
                <td
                  style={{ "--tint": `${Math.round((m.medianPrecipMm / maxRain) * 100)}%` } as React.CSSProperties}
                  className={styles.rain}
                >
                  {Math.round(m.medianPrecipMm)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.note}>
        Frost: share of years with at least one day below 0&nbsp;°C (daily minimum, T2M_MIN) in that month. Rain: median
        monthly total of precipitation, rain and snow (PRECTOTCORR).
      </p>
    </div>
  );
}
