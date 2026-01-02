export type IdeaCandidate = {
  title: string;
  hook: string;
  claim: string;
  templateFit?: string[];
  targetViewer?: string;
  comparisons?: string[];
  experiment?: string;
  requiredEvidenceTypes?: string[];
  estimatedCost?: Record<string, string>;
  riskFlags?: string[];
};

export type PastVideoInput = {
  id?: string;
  title: string;
  youtubeUrl?: string;
  publishedAt?: string;
  summary?: string;
  tags?: string[] | string;
};

export type SimilarityItem = {
  id: string;
  title: string;
  youtubeUrl?: string | null;
  publishedAt?: string | null;
  similarity: number;
};

export type ScoreAxis = {
  score: number;
  reason: string;
};

export type ScoreBreakdown = Record<string, ScoreAxis>;
