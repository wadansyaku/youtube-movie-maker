import type { SimilarityItem } from "./types";
import { tokenize } from "./text";

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function similarityFromText(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}

type PastVideoForSimilarity = {
  id: string;
  title: string;
  youtubeUrl?: string | null;
  publishedAt?: Date | null;
  canonicalText: string;
};

export function buildSimilarityTop(
  ideaCanonicalText: string,
  pastVideos: PastVideoForSimilarity[]
): SimilarityItem[] {
  const results = pastVideos.map((video) => {
    const similarity = similarityFromText(
      ideaCanonicalText,
      video.canonicalText
    );
    return {
      id: video.id,
      title: video.title,
      youtubeUrl: video.youtubeUrl ?? null,
      publishedAt: video.publishedAt
        ? video.publishedAt.toISOString()
        : null,
      similarity: Number(similarity.toFixed(4)),
    };
  });

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}
