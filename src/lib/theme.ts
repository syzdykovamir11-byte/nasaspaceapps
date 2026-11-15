/** Light / dark theme. Light is the default; the choice is remembered in this browser. */
export type Theme = "light" | "dark";

export const THEME_KEY = "ft:theme";
/** Fired on window after the theme changes, so code that reads CSS variables (the map) can refresh. */
export const THEME_EVENT = "ft-themechange";

/** Runs in <head> before the page paints, so a saved dark theme does not flash light first. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export function currentTheme(): Theme {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this visit.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
