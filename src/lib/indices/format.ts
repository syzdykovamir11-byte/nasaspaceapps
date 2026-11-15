import type { SeasonWindow } from "./season";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "1 Apr – 30 Sep" from the season window. */
export function formatWindow(win: SeasonWindow): string {
  const a = fmt.format(new Date(Date.UTC(2001, win.startMonth - 1, win.startDay)));
  const b = fmt.format(new Date(Date.UTC(2001, win.endMonth - 1, win.endDay)));
  // Non-breaking spaces keep each date on one line.
  // en-GB formats September as "Sept"; use "Sep" like the rest of the page. Non-breaking spaces keep dates whole.
  const nb = (d: string) => d.replace("Sept", "Sep").replace(/ /g, "\u00a0");
  return `${nb(a)} – ${nb(b)}`;
}
