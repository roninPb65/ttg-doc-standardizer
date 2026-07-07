/**
 * structurers/transformers.ts
 * ---------------------------
 * The pre-trained "brain": a local zero-shot classification model (Hugging Face,
 * run in-process via Transformers.js / ONNX). It reads each paragraph and picks
 * the TTG body section it best fits — no external API, no API key. Model weights
 * are downloaded once (bundled at Docker build; see scripts/prewarm.mjs) and then
 * run fully offline.
 *
 * The package is an OPTIONAL dependency and is imported dynamically via a
 * non-literal specifier, so the backend still typechecks and installs in
 * environments where the native ONNX runtime can't be fetched. If the model
 * can't be loaded, callers fall back to the heuristic classifier.
 */

import { config } from "../../config";
import { CANDIDATE_LABELS } from "./shared";
import type { BodyLabel, ParagraphClassifier } from "./shared";

// value -> BodyLabel, to map the model's chosen candidate string back to a label
const LABEL_BY_TEXT = new Map<string, BodyLabel>(
  (Object.entries(CANDIDATE_LABELS) as [Exclude<BodyLabel, "other">, string][]).map(
    ([label, text]) => [text, label]
  )
);
const CANDIDATES = Object.values(CANDIDATE_LABELS);

// Below this top-score, we treat the paragraph as unclassified ("other").
const MIN_CONFIDENCE = 0.4;

let pipePromise: Promise<any> | null = null;

async function getPipeline(): Promise<any> {
  if (pipePromise) return pipePromise;
  pipePromise = (async () => {
    // Non-literal specifier: keeps tsc from resolving this optional module and
    // lets install succeed where the ONNX runtime binary can't be downloaded.
    const specifier = "@huggingface/transformers";
    const mod: any = await import(specifier);
    const { pipeline, env } = mod;
    if (config.transformersCacheDir) env.cacheDir = config.transformersCacheDir;
    if (config.transformersOffline) {
      env.allowRemoteModels = false; // must be pre-downloaded (prewarm at build)
    }
    return pipeline("zero-shot-classification", config.zeroShotModel);
  })();
  return pipePromise;
}

export const transformersClassifier: ParagraphClassifier = {
  async classify(paragraphs: string[]): Promise<BodyLabel[]> {
    const pipe = await getPipeline();
    const labels: BodyLabel[] = [];
    for (const p of paragraphs) {
      // Cap length so classification stays within the model's context window.
      const text = p.length > 1000 ? p.slice(0, 1000) : p;
      const res: any = await pipe(text, CANDIDATES, { multi_label: false });
      const topText: string = Array.isArray(res?.labels) ? res.labels[0] : "";
      const topScore: number = Array.isArray(res?.scores) ? res.scores[0] : 0;
      labels.push(
        topScore >= MIN_CONFIDENCE ? LABEL_BY_TEXT.get(topText) ?? "other" : "other"
      );
    }
    return labels;
  },
};

/** Eagerly load the model (used by /readyz and startup warmup). Throws on failure. */
export async function warmTransformers(): Promise<void> {
  await getPipeline();
}
