import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import type {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

function envOn(name: string) {
  return ["1", "true", "yes"].includes(
    (process.env[name] ?? "").toLowerCase()
  );
}

function listWebm(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) listWebm(p, acc);
    else if (ent.name === "video.webm") acc.push(p);
  }
  return acc;
}

/** Drop near-duplicate frames; keep a sequence of distinct UI states. */
function extractDistinctFrames(videoPath: string) {
  const imagesDir = path.join(path.dirname(videoPath), "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  const already = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (already.length > 0) return;

  const pattern = path.join(imagesDir, "frame_%03d.jpg");
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      videoPath,
      "-vf",
      "mpdecimate,setpts=N/FRAME_RATE/TB",
      "-fps_mode",
      "vfr",
      "-q:v",
      "5",
      pattern,
    ],
    { encoding: "utf8" }
  );

  if (result.error || result.status !== 0) {
    const detail =
      result.error?.message || result.stderr || `exit ${result.status}`;
    console.warn(
      `[e2e] frame extract failed for ${videoPath}: ${detail}\n` +
        "Install ffmpeg (e.g. brew install ffmpeg) and re-run with E2E_IMAGES=1."
    );
    return;
  }

  const count = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.jpe?g$/i.test(f)).length;
  console.log(`[e2e] wrote ${count} distinct frames → ${imagesDir}`);
}

/**
 * After a video run, dump distinct frames next to each video.webm.
 * Enable with E2E_IMAGES=1 (implies video recording in playwright.config.ts).
 */
class ExtractVideoFramesReporter implements Reporter {
  private outputDir = "";

  onBegin(config: FullConfig) {
    // Match this run's outputDir (e2e/videos/<timestamp>/).
    const fromProject = config.projects.find((p) => p.outputDir)?.outputDir;
    const configDir = config.configFile
      ? path.dirname(config.configFile)
      : process.cwd();
    this.outputDir = fromProject || path.resolve(configDir, "videos");
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    if (!envOn("E2E_IMAGES")) return;
    for (const a of result.attachments) {
      if (a.path && a.path.endsWith(".webm")) {
        extractDistinctFrames(a.path);
      }
    }
  }

  onEnd() {
    if (!envOn("E2E_IMAGES")) return;
    for (const video of listWebm(this.outputDir)) {
      extractDistinctFrames(video);
    }
  }
}

export default ExtractVideoFramesReporter;
