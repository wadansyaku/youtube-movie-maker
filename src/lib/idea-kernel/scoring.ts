import type { IdeaCandidate, ScoreBreakdown } from "./types";

export const SCORE_WEIGHTS = {
  novelty: 0.3,
  evidence: 0.2,
  experimentability: 0.15,
  decisionValue: 0.15,
  productionCost: 0.1,
  evergreen: 0.1,
} as const;

const clamp = (value: number, min = 0, max = 5) =>
  Math.min(max, Math.max(min, value));

const toFixedScore = (value: number) => Number(value.toFixed(2));

function scoreEvidence(requiredEvidenceTypes?: string[]) {
  const count = requiredEvidenceTypes?.length ?? 0;
  if (count >= 2) {
    return { score: 5, reason: "複数の証拠タイプが必要（信頼性が高い）" };
  }
  if (count === 1) {
    return { score: 3, reason: "単一の証拠タイプ（限定的な裏付け）" };
  }
  return { score: 1, reason: "必要証拠が未定義（裏付けが弱い）" };
}

function scoreExperimentability(experiment?: string) {
  if (!experiment) {
    return { score: 1, reason: "実験内容が未記載" };
  }
  if (experiment.trim().length >= 40) {
    return { score: 5, reason: "実験内容が具体的で再現しやすい" };
  }
  return { score: 3, reason: "実験内容が簡潔（補足で強化可能）" };
}

function scoreDecisionValue(comparisons?: string[], claim?: string) {
  const count = comparisons?.length ?? 0;
  if (count >= 3) {
    return { score: 5, reason: "比較軸が十分で意思決定に直結" };
  }
  if (count >= 1) {
    return { score: 3, reason: "比較対象あり（判断材料は限定的）" };
  }
  if (claim && claim.trim().length >= 20) {
    return { score: 2, reason: "主張はあるが比較軸が未定義" };
  }
  return { score: 1, reason: "意思決定に必要な比較情報が不足" };
}

function scoreProductionCost(estimatedCost?: Record<string, string>) {
  if (!estimatedCost) {
    return { score: 3, reason: "コスト情報が未定（仮置き）" };
  }

  const penaltyMap: Record<string, number> = {
    none: 0,
    reuse: 0.5,
    low: 1,
    medium: 2,
    high: 3,
    required: 2,
  };

  const penalties = Object.entries(estimatedCost).map(([key, value]) => {
    const penalty = penaltyMap[value] ?? 1;
    return { key, value, penalty };
  });

  const totalPenalty = penalties.reduce((sum, item) => sum + item.penalty, 0);
  const score = clamp(5 - totalPenalty / 2);

  const expensive = penalties
    .filter((item) => item.penalty >= 2)
    .map((item) => `${item.key}:${item.value}`);

  const reason =
    expensive.length > 0
      ? `高コスト要素: ${expensive.join(", ")}`
      : "コスト低めで制作しやすい";

  return { score: toFixedScore(score), reason };
}

function scoreEvergreen(riskFlags?: string[]) {
  const count = riskFlags?.length ?? 0;
  if (count === 0) {
    return { score: 5, reason: "リスク要因なし（長期運用向き）" };
  }
  if (count <= 2) {
    return { score: 3, reason: "一部リスクあり（要確認）" };
  }
  return { score: 1, reason: "リスク要因が多く更新頻度が高い" };
}

export function scoreIdeaCandidate(params: {
  candidate: IdeaCandidate;
  maxSimilarity: number;
}): { total: number; noveltyScore: number; breakdown: ScoreBreakdown } {
  const noveltyScore = clamp(5 * (1 - params.maxSimilarity));

  const novelty = {
    score: toFixedScore(noveltyScore),
    reason: `既存との最大類似度 ${(params.maxSimilarity * 100).toFixed(1)}%`,
  };
  const evidence = scoreEvidence(params.candidate.requiredEvidenceTypes);
  const experimentability = scoreExperimentability(params.candidate.experiment);
  const decisionValue = scoreDecisionValue(
    params.candidate.comparisons,
    params.candidate.claim
  );
  const productionCost = scoreProductionCost(params.candidate.estimatedCost);
  const evergreen = scoreEvergreen(params.candidate.riskFlags);

  const breakdown: ScoreBreakdown = {
    novelty,
    evidence,
    experimentability,
    decisionValue,
    productionCost,
    evergreen,
  };

  const total =
    novelty.score * SCORE_WEIGHTS.novelty +
    evidence.score * SCORE_WEIGHTS.evidence +
    experimentability.score * SCORE_WEIGHTS.experimentability +
    decisionValue.score * SCORE_WEIGHTS.decisionValue +
    productionCost.score * SCORE_WEIGHTS.productionCost +
    evergreen.score * SCORE_WEIGHTS.evergreen;

  return {
    total: toFixedScore(total),
    noveltyScore: novelty.score,
    breakdown,
  };
}
