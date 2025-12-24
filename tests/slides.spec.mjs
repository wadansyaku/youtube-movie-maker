import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { parseSpec, renderDeck } from "../slides/renderer.mjs";

function writeTempSpec(dir) {
  const specPath = path.join(dir, "spec.yml");
  const contents = [
    "meta:",
    "  width: 1280",
    "  height: 720",
    "  theme: light",
    "slides:",
    "  - title: \"Test Slide\"",
    "    bullets:",
    "      - \"One\"",
    "      - \"Two\"",
  ].join("\n");
  fs.writeFileSync(specPath, contents, "utf8");
  return specPath;
}

test("parseSpec normalizes defaults", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "slides-spec-"));
  const specPath = writeTempSpec(tempDir);
  const spec = parseSpec(specPath);

  assert.equal(spec.meta.width, 1280);
  assert.equal(spec.meta.height, 720);
  assert.equal(spec.meta.theme, "light");
  assert.equal(spec.slides.length, 1);
  assert.equal(spec.slides[0].title, "Test Slide");
});

test("renderDeck writes png and manifest", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "slides-render-"));
  const specPath = writeTempSpec(tempDir);
  const outputDir = path.join(tempDir, "out");

  const result = await renderDeck({
    specPath,
    outputDir,
    emitSvg: false,
  });

  const manifestPath = path.join(outputDir, "deck.json");
  assert.ok(fs.existsSync(manifestPath));
  assert.equal(result.slideCount, 1);

  const slidePath = result.slides[0].pngPath;
  assert.ok(fs.existsSync(slidePath));
});
