/**
 * prewarm.mjs
 * -----------
 * Downloads the local zero-shot model into the image at Docker BUILD time, so
 * the running container never needs network access to Hugging Face and starts
 * instantly. Run by the Dockerfile:  node scripts/prewarm.mjs
 *
 * Requires network access to huggingface.co during build only.
 */
import { pipeline, env } from "@huggingface/transformers";

const model = process.env.ZEROSHOT_MODEL || "Xenova/nli-deberta-v3-xsmall";
const cacheDir = process.env.TRANSFORMERS_CACHE_DIR || "/models";

env.cacheDir = cacheDir;
env.allowRemoteModels = true; // building: download is expected

console.log(`[prewarm] downloading zero-shot model "${model}" into ${cacheDir} ...`);
await pipeline("zero-shot-classification", model);
console.log("[prewarm] done.");
