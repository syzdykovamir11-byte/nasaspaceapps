"use client";

import { useEffect, useState } from "react";
import type { SummaryFacts } from "@/lib/ai/summary";
import styles from "./RotationSection.module.css";

type State =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "error"; message: string }
  | { s: "done"; text: string; model: string; created: string };

// One request per set of facts per page visit.
const cache = new Map<string, Extract<State, { s: "done" }>>();

async function requestSummary(key: string, set: (st: State) => void): Promise<void> {
  set({ s: "loading" });
  try {
    const res = await fetch("api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: key });
    const data = (await res.json().catch(() => ({}))) as { text?: string; model?: string; created?: string; error?: string };
    if (!res.ok || !data.text) {
      set({ s: "error", message: data.error ?? `The summary could not be made (HTTP ${res.status}).` });
      return;
    }
    const done = { s: "done" as const, text: data.text, model: data.model ?? "Gemini", created: data.created ?? "" };
    cache.set(key, done);
    set(done);
  } catch {
    set({ s: "error", message: "Could not reach the summary service. Check your internet connection." });
  }
}

/** AI summary of the rotation facts, made automatically. Optional: the cards below never depend on it. */
export function RotationSummary({ facts }: { facts: SummaryFacts }) {
  const key = JSON.stringify(facts);
  const [state, setState] = useState<{ key: string; st: State }>({ key, st: { s: "idle" } });
  const st: State = cache.get(key) ?? (state.key === key ? state.st : { s: "idle" });

  const run = () => void requestSummary(key, (st) => setState({ key, st }));

  // Runs by itself once the farmer has filled in the rotation; waits a moment so quick changes send one request.
  const idle = st.s === "idle";
  useEffect(() => {
    if (!idle) return;
    const t = setTimeout(() => void requestSummary(key, (st) => setState({ key, st })), 800);
    return () => clearTimeout(t);
  }, [key, idle]);

  const lines = st.s === "done" ? st.text.split("\n").map((l) => l.trim()).filter(Boolean) : [];
  const items = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
  const rest = lines.filter((l) => !l.startsWith("- "));

  return (
    <section className={styles.aiBox} aria-labelledby="ai-summary-title" aria-busy={st.s === "loading"} aria-live="polite">
      <h4 id="ai-summary-title" className={styles.aiTitle}>Summary</h4>
      {(st.s === "idle" || st.s === "loading") && <p className={styles.muted}>Writing a short summary of the options below…</p>}
      {st.s === "error" && (
        <div role="status">
          <p className={styles.muted}>{st.message} The table and cards below have all the facts.</p>
          <button type="button" className={styles.aiButton} onClick={run}>
            Try again
          </button>
        </div>
      )}
      {st.s === "done" && (
        <>
          {items.length > 0 && <ul className={styles.aiList}>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>}
          {rest.map((t, i) => <p key={i}>{t}</p>)}
          <p className={styles.aiLabel}>
            Written by AI (Google {st.model}){st.created && `, ${st.created}`} from the cards below. Every number is
            checked against the cards. The cards are the reference.
          </p>
        </>
      )}
    </section>
  );
}
