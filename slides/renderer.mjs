import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import yaml from "yaml";

import { DeckSpec, normalizeSpec } from "./schema.mjs";
import { resolveTheme } from "./themes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontDir = path.join(__dirname, "fonts");

let fontCache = null;

function loadFonts() {
  if (fontCache) return fontCache;

  const regularPath = path.join(fontDir, "NotoSansJP-Regular.otf");
  const boldPath = path.join(fontDir, "NotoSansJP-Bold.otf");

  const regular = fs.readFileSync(regularPath);
  const bold = fs.readFileSync(boldPath);

  fontCache = [
    { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" }
  ];

  return fontCache;
}

function toDataUri(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg"
    ? "image/jpeg"
    : ext === ".svg"
      ? "image/svg+xml"
      : "image/png";
  const data = fs.readFileSync(imagePath);
  const base64 = data.toString("base64");
  return `data:${mime};base64,${base64}`;
}

function normalizeImages(images, specDir) {
  return images.map((image) => {
    const normalized = typeof image === "string"
      ? { path: image, alt: "", fit: "cover" }
      : { path: image.path, alt: image.alt ?? "", fit: image.fit ?? "cover" };

    const resolvedPath = path.resolve(specDir, normalized.path);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Image not found: ${resolvedPath}`);
    }

    return {
      path: resolvedPath,
      alt: normalized.alt,
      fit: normalized.fit
    };
  });
}

export function parseSpec(specPath) {
  const resolvedPath = path.resolve(specPath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const ext = path.extname(resolvedPath).toLowerCase();

  const data = ext === ".json" ? JSON.parse(raw) : yaml.parse(raw);
  const parsed = DeckSpec.parse(data);
  const normalized = normalizeSpec(parsed);

  return {
    ...normalized,
    specPath: resolvedPath,
    specDir: path.dirname(resolvedPath)
  };
}

function renderClassicSlide(slide, meta, theme, images) {
  const titleSize = Math.round(meta.height * 0.08);
  const bulletSize = Math.round(meta.height * 0.035);
  const bulletGap = Math.round(meta.height * 0.015);

  const bulletNodes = slide.bullets.map((text, index) =>
    React.createElement(
      "div",
      {
        key: `bullet-${index}`,
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          lineHeight: 1.4
        }
      },
      React.createElement("div", {
        style: {
          width: 12,
          height: 12,
          borderRadius: 999,
          marginTop: 12,
          backgroundColor: theme.accent
        }
      }),
      React.createElement(
        "div",
        {
          style: {
            fontSize: bulletSize,
            color: theme.text
          }
        },
        text
      )
    )
  );

  const imageColumn = images.length
    ? React.createElement(
        "div",
        {
          style: {
            width: Math.round(meta.width * 0.34),
            display: "flex",
            flexDirection: "column",
            gap: 20,
            justifyContent: "center"
          }
        },
        images.map((image, index) =>
          React.createElement("img", {
            key: `image-${index}`,
            src: image.src,
            style: {
              width: Math.round(meta.width * 0.34),
              height: Math.round((meta.height * 0.65) / images.length),
              borderRadius: 24,
              objectFit: image.fit,
              border: `2px solid ${theme.panelBorder}`
            },
            alt: image.alt
          })
        )
      )
    : null;

  return React.createElement(
    "div",
    {
      style: {
        width: meta.width,
        height: meta.height,
        display: "flex",
        flexDirection: "row",
        gap: 48,
        padding: 80,
        backgroundColor: theme.background,
        position: "relative",
        fontFamily: "Noto Sans JP",
        color: theme.text
      }
    },
    React.createElement("div", {
      style: {
        position: "absolute",
        top: -120,
        right: -140,
        width: 360,
        height: 360,
        borderRadius: 999,
        backgroundColor: theme.shape1,
        opacity: 0.6
      }
    }),
    React.createElement("div", {
      style: {
        position: "absolute",
        bottom: -160,
        left: -120,
        width: 420,
        height: 420,
        borderRadius: 999,
        backgroundColor: theme.shape2,
        opacity: 0.55
      }
    }),
    React.createElement(
      "div",
      {
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: bulletGap * 2,
          backgroundColor: theme.panel,
          borderRadius: 28,
          padding: 48,
          border: `1px solid ${theme.panelBorder}`
        }
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.1,
            color: theme.text
          }
        },
        slide.title
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: bulletGap
          }
        },
        ...bulletNodes
      )
    ),
    imageColumn
  );
}

function renderCenteredSlide(slide, meta, theme, images) {
  const titleSize = Math.round(meta.height * 0.085);
  const bulletSize = Math.round(meta.height * 0.034);
  const bulletGap = Math.round(meta.height * 0.016);

  const bulletNodes = slide.bullets.map((text, index) =>
    React.createElement(
      "div",
      {
        key: `bullet-${index}`,
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          lineHeight: 1.4
        }
      },
      React.createElement("div", {
        style: {
          width: 12,
          height: 12,
          borderRadius: 999,
          marginTop: 12,
          backgroundColor: theme.accentSoft
        }
      }),
      React.createElement(
        "div",
        {
          style: {
            fontSize: bulletSize,
            color: theme.text
          }
        },
        text
      )
    )
  );

  const imageRow = images.length
    ? React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 24,
            marginTop: 32
          }
        },
        images.map((image, index) =>
          React.createElement("img", {
            key: `image-${index}`,
            src: image.src,
            style: {
              width: Math.round(meta.width * 0.25),
              height: Math.round(meta.height * 0.25),
              borderRadius: 20,
              objectFit: image.fit,
              border: `2px solid ${theme.panelBorder}`
            },
            alt: image.alt
          })
        )
      )
    : null;

  return React.createElement(
    "div",
    {
      style: {
        width: meta.width,
        height: meta.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 90,
        backgroundColor: theme.background,
        position: "relative",
        fontFamily: "Noto Sans JP",
        color: theme.text
      }
    },
    React.createElement("div", {
      style: {
        position: "absolute",
        inset: 70,
        borderRadius: 32,
        border: `1px solid ${theme.panelBorder}`
      }
    }),
    React.createElement(
      "div",
      {
        style: {
          fontSize: titleSize,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: 28
        }
      },
      slide.title
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: bulletGap,
          maxWidth: Math.round(meta.width * 0.7)
        }
      },
      ...bulletNodes
    ),
    imageRow
  );
}

export async function renderSlideToSvg(slide, meta) {
  const theme = resolveTheme(meta.theme);
  const specDir = meta.specDir ?? process.cwd();
  const images = normalizeImages(slide.images ?? [], specDir).map((image) => ({
    ...image,
    src: toDataUri(image.path)
  }));

  const element = meta.template === "centered"
    ? renderCenteredSlide(slide, meta, theme, images)
    : renderClassicSlide(slide, meta, theme, images);

  return satori(element, {
    width: meta.width,
    height: meta.height,
    fonts: loadFonts()
  });
}

export async function renderSlideToPng(slide, meta, outputPath) {
  const svg = await renderSlideToSvg(slide, meta);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: meta.width
    }
  });
  const pngData = resvg.render();
  fs.writeFileSync(outputPath, pngData.asPng());
  return outputPath;
}

export async function renderDeck({ specPath, outputDir, emitSvg = false, template }) {
  const spec = parseSpec(specPath);
  const meta = {
    ...spec.meta,
    specDir: spec.specDir,
    template: template ?? spec.meta.template
  };

  if (meta.audio) {
    const audioPath = path.resolve(spec.specDir, meta.audio);
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio not found: ${audioPath}`);
    }
    meta.audio = audioPath;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const svgDir = emitSvg ? path.join(outputDir, "svg") : null;
  if (emitSvg && svgDir) {
    fs.mkdirSync(svgDir, { recursive: true });
  }

  const slides = [];

  for (let index = 0; index < spec.slides.length; index += 1) {
    const slide = spec.slides[index];
    const basename = `slide-${String(index + 1).padStart(3, "0")}`;
    const pngPath = path.join(outputDir, `${basename}.png`);

    await renderSlideToPng(slide, meta, pngPath);

    let svgPath = null;
    if (emitSvg && svgDir) {
      const svg = await renderSlideToSvg(slide, meta);
      svgPath = path.join(svgDir, `${basename}.svg`);
      fs.writeFileSync(svgPath, svg);
    }

    slides.push({
      index: index + 1,
      title: slide.title,
      durationSec: slide.durationSec,
      pngPath,
      svgPath
    });
  }

  const manifest = {
    meta,
    outputDir,
    slideCount: slides.length,
    slides,
    specPath: spec.specPath,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(outputDir, "deck.json"),
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}
