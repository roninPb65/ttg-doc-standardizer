/**
 * structurers/heuristic.ts
 * ------------------------
 * A pure-JavaScript paragraph classifier: no model, no download, no API key.
 * Each paragraph is routed to the TTG body section whose keyword set it overlaps
 * most strongly. Used automatically when the model structurer is disabled or
 * unavailable, so the app always produces a document.
 */

import type { BodyLabel, ParagraphClassifier } from "./shared";

const KEYWORDS: Record<Exclude<BodyLabel, "other">, string[]> = {
  problem: [
    "problem", "issue", "challenge", "pain", "bug", "gap", "sponsor", "requirement",
    "need", "background", "motivation", "why", "currently", "today", "lack",
  ],
  scope: [
    "scope", "plan", "timeline", "sequence", "phase", "milestone", "order", "approach",
    "deliverable", "schedule", "roadmap", "stage", "first", "then", "next we", "build order",
  ],
  description: [
    "implement", "build", "developed", "code", "architecture", "design", "method",
    "process", "result", "test", "deploy", "api", "database", "system", "function",
    "module", "endpoint", "service", "table", "schema", "query", "component", "config",
  ],
  manual: [
    "how to", "usage", "instruction", "guide", "run", "install", "configure", "click",
    "open", "setup", "operate", "user", "step", "select", "enter", "navigate", "command",
  ],
  next: [
    "future", "next step", "improvement", "recommend", "enhance", "roadmap", "todo",
    "follow-up", "follow up", "later", "further", "consider", "should", "could", "would",
    "potential", "opportunity",
  ],
};

function score(paragraph: string, words: string[]): number {
  const lower = paragraph.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (w.includes(" ")) {
      if (lower.includes(w)) s += 2; // phrase match weighted higher
    } else {
      // word-boundary-ish match
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
      const m = lower.match(re);
      if (m) s += m.length;
    }
  }
  // normalize by paragraph length so long paragraphs don't always win
  const tokens = Math.max(1, lower.split(/\s+/).length);
  return s / Math.sqrt(tokens);
}

export const heuristicClassifier: ParagraphClassifier = {
  async classify(paragraphs: string[]): Promise<BodyLabel[]> {
    return paragraphs.map((p) => {
      let best: BodyLabel = "other";
      let bestScore = 0.2; // minimum confidence to leave "other"
      for (const label of Object.keys(KEYWORDS) as Array<Exclude<BodyLabel, "other">>) {
        const sc = score(p, KEYWORDS[label]);
        if (sc > bestScore) {
          bestScore = sc;
          best = label;
        }
      }
      return best;
    });
  },
};
