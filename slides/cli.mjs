#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDeck } from "./renderer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const specPath = args.spec;
const outputDir = args.out;
const emitSvg = Boolean(args["emit-svg"]);
const template = args.template;

if (!specPath || !outputDir) {
  console.error("Usage: node slides/cli.mjs --spec <path> --out <dir> [--template classic|centered] [--emit-svg]");
  process.exit(1);
}

const resolvedOutputDir = path.isAbsolute(outputDir)
  ? outputDir
  : path.resolve(__dirname, "..", outputDir);

try {
  const result = await renderDeck({
    specPath,
    outputDir: resolvedOutputDir,
    emitSvg,
    template
  });

  process.stdout.write(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
