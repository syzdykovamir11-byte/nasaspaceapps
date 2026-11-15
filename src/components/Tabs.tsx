"use client";

import { useRef } from "react";
import styles from "./Tabs.module.css";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

/** ARIA tabs: roving tabindex, Left/Right/Home/End move and select. Panels are rendered by the parent. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  idPrefix,
  label,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  idPrefix: string;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const n = tabs.length;
    const j = (i + n) % n;
    onChange(tabs[j]!.id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={styles.list}>
      {tabs.map((t, i) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                move(i + 1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                move(i - 1);
              } else if (e.key === "Home") {
                e.preventDefault();
                move(0);
              } else if (e.key === "End") {
                e.preventDefault();
                move(tabs.length - 1);
              }
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
