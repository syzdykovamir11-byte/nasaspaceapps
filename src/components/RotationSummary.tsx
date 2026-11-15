"use client";

import { useState } from "react";
import type { SummaryFacts } from "@/lib/ai/summary";
import styles from "./RotationSection.module.css";

type State =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "error"; message: string }
  | { s: "done"; text: string; model: string; created: string };

// One request per set of facts per page visit.
const cache = new Map<string, Extract<State, { s: "done" }>>();

/** On-demand AI summary of the rotation facts. Optional: the cards below never depend on it. */
export function RotationSummary({ facts }: { facts: SummaryFacts }) {
  const key = JSON.stringify(facts);
  const [state, setState] = useState<{ key: string; st: State }>({ key, st: { s: "idle" } });
  const st: State = cache.get(key) ?? (state.key === key ? state.st : { s: "idle" });

  const run = async () => {
    setState({ key, st: { s: "loading" } });
    try {
      const res = await fetch("api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: key });
      const data = (await res.json().catch(() => ({}))) as { text?: string; model?: string; created?: string; error?: string };
      if (!res.ok || !data.text) {
        setState({ key, st: { s: "error", message: data.error ?? `The summary could not be made (HTTP ${res.status}).` } });
        return;
      }
      const done = { s: "done" as const, text: data.text, model: data.model ?? "Gemini", created: data.created ?? "" };
      cache.set(key, done);
      setState({ key, st: done });
    } catch {
      setState({ key, st: { s: "error", message: "Could not reach the summary service. Check your internet connection." } });
    }
  };

  const lines = st.s === "done" ? st.text.split("\n").map((l) => l.trim()).filter(Boolean) : [];
  const items = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
  const rest = lines.filter((l) => !l.startsWith("- "));

  return (
    <section className={styles.aiBox} aria-labelledby="ai-summary-title" aria-busy={st.s === "loading"}>
      <h3 id="ai-summary-title" className={styles.aiTitle}>In plain words</h3>
      {st.s === "idle" && (
        <>
          <p className={styles.hint}>A short summary of the options below, written by AI from the facts on the cards only.</p>
          <button type="button" className={styles.aiButton} onClick={run}>
            Summarize in plain words
          </button>
        </>
      )}
      {st.s === "loading" && <p className={styles.muted}>Writing the summary…</p>}
      {st.s === "error" && (
        <div role="alert">
          <p className={styles.error}>{st.message}</p>
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
            Written by AI (Google {st.model}){st.created && `, ${st.created}`}, from the facts on the cards below and only
            the sources listed there. Our check rejects it if it adds a number. The cards are the reference; check them
            before acting.
          </p>
        </>
      )}
    </section>
  );
}
