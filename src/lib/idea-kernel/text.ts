import type { IdeaCandidate, PastVideoInput } from "./types";

const JP_CHAR_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu;

export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): Set<string> {
  const normalized = normalizeText(input);
  const tokens = new Set<string>();

  const asciiWords = normalized.match(/[a-z0-9]+/g) ?? [];
  for (const word of asciiWords) {
    tokens.add(word);
  }

  const jpChunks = normalized.match(JP_CHAR_RE) ?? [];
  for (const chunk of jpChunks) {
    if (chunk.length < 2) {
      continue;
    }
    for (let i = 0; i < chunk.length - 1; i += 1) {
      tokens.add(chunk.slice(i, i + 2));
    }
  }

  return tokens;
}

export function buildIdeaCanonicalText(candidate: IdeaCandidate): string {
  const parts: string[] = [
    candidate.title,
    candidate.hook,
    candidate.claim,
    candidate.targetViewer ?? "",
    ...(candidate.templateFit ?? []),
    ...(candidate.comparisons ?? []),
    ...(candidate.requiredEvidenceTypes ?? []),
    ...(candidate.riskFlags ?? []),
  ];

  if (candidate.experiment) {
    parts.push(candidate.experiment);
  }

  if (candidate.estimatedCost) {
    parts.push(JSON.stringify(candidate.estimatedCost));
  }

  return normalizeText(parts.filter(Boolean).join(" "));
}

export function buildPastVideoCanonicalText(video: PastVideoInput): string {
  const tags = Array.isArray(video.tags)
    ? video.tags
    : video.tags
      ? video.tags.split(",").map((tag) => tag.trim())
      : [];

  const parts = [video.title, video.summary ?? "", ...tags];
  return normalizeText(parts.filter(Boolean).join(" "));
}
