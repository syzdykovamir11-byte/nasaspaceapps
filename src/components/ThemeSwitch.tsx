"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, setTheme, THEME_EVENT, type Theme } from "@/lib/theme";
import styles from "./ThemeSwitch.module.css";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light theme" },
  { value: "dark", label: "Dark theme" },
];

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

export function ThemeSwitch() {
  // The theme lives on <html data-theme>; "light" on the server, the real value after hydration.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);

  return (
    <div className={styles.switch} role="group" aria-label="Colour theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.option}
          aria-pressed={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setTheme(o.value)}
        >
          {o.value === "light" ? <SunIcon /> : <MoonIcon />}
        </button>
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
