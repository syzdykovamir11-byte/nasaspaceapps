import { buildFixedParts, checkSummary, isSummaryFacts, SYSTEM_PROMPT, userPrompt, type SummaryFacts } from "@/lib/ai/summary";

/**
 * POST /api/summary: plain-language summary of the rotation facts, written by Gemini.
 * The API key stays on the server (GEMINI_API_KEY in .env.local / Vercel env vars).
 */

// Tested 15 Nov 2026: answers in about 2 s. gemini-2.5-flash is closed to new keys; larger flash models took 17-60 s.
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const MAX_BODY = 20_000;

export async function POST(req: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "The summary is not set up on this server (no Gemini API key)." }, 503);

  const body = await req.text();
  if (body.length > MAX_BODY) return json({ error: "Request too large." }, 413);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  if (!isSummaryFacts(parsed)) return json({ error: "Bad request." }, 400);
  // Sources and limits are fixed on the server, so a client cannot widen the allowed source list.
  const facts: SummaryFacts = { ...parsed, ...buildFixedParts() };

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  // Up to 2 attempts: if the first answer fails the fact check, ask again once, naming what failed.
  let feedback = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await generate(key, model, userPrompt(facts) + feedback);
    if ("error" in r) return json({ error: r.error }, 502);
    const problems = checkSummary(r.text, facts);
    if (!problems.length) return json({ text: r.text, model, created: new Date().toISOString().slice(0, 10) }, 200);
    console.error(`Gemini summary rejected (attempt ${attempt}): ${problems.join("; ")}`);
    feedback = `\n\nYour previous answer was rejected because it ${problems.join("; ")}. Follow the rules exactly.`;
  }
  return json({ error: "The AI summary did not pass our fact check, so it is not shown. The cards below have the facts." }, 422);
}

async function generate(key: string, model: string, prompt: string): Promise<{ text: string } | { error: string }> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return { error: "Could not reach Gemini in time. Try again." };
  }
  if (!res.ok) {
    // Log status only; never log the key or the full response.
    console.error(`Gemini HTTP ${res.status} for model ${model}`);
    return { error: `Gemini returned an error (HTTP ${res.status}).` };
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return { text: (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim() };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
