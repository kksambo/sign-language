import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const wasmDest = join(root, "public", "mediapipe", "wasm");
const modelDir = join(root, "public", "models");
const modelPath = join(modelDir, "hand_landmarker.task");
const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

if (existsSync(wasmSrc)) {
  mkdirSync(dirname(wasmDest), { recursive: true });
  cpSync(wasmSrc, wasmDest, { recursive: true });
  console.log("Copied MediaPipe WASM to public/mediapipe/wasm");
} else {
  console.warn("MediaPipe WASM not found; skip copy");
}

mkdirSync(modelDir, { recursive: true });

if (!existsSync(modelPath)) {
  console.log("Downloading hand landmarker model...");
  try {
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(modelPath, buffer);
    console.log("Saved public/models/hand_landmarker.task");
  } catch (error) {
    console.error("Could not download hand landmarker model:", error);
    process.exit(1);
  }
} else {
  console.log("Hand landmarker model already present");
}
