import { test, expect } from "@playwright/test";
import { similarityFromText } from "../../src/lib/idea-kernel/similarity";
import { scoreIdeaCandidate } from "../../src/lib/idea-kernel/scoring";
import type { IdeaCandidate } from "../../src/lib/idea-kernel/types";

test.describe("Idea Kernel logic", () => {
    test("similarity is deterministic and normalized", () => {
        const identical = similarityFromText("AI台本!!", "ai 台本");
        const unrelated = similarityFromText("alpha", "beta");

        expect(identical).toBe(1);
        expect(unrelated).toBe(0);
    });

    test("scoring returns weighted total with reasons", () => {
        const candidate: IdeaCandidate = {
            title: "AI台本の視聴維持率検証",
            hook: "AIで作った台本は本当に伸びるのか？",
            claim: "AI台本はフック構造が明確で離脱率が下がる",
            templateFit: ["experiment_log", "decision_lab"],
            targetViewer: "動画制作を効率化したい制作者",
            comparisons: ["人間台本", "AI台本", "ハイブリッド"],
            experiment: "同じテーマで3本制作し、平均視聴維持率とCTRを比較する。",
            requiredEvidenceTypes: ["公式", "実測"],
            estimatedCost: { runway: "low", sora: "none" },
            riskFlags: [],
        };

        const result = scoreIdeaCandidate({ candidate, maxSimilarity: 0.2 });

        expect(result.noveltyScore).toBeCloseTo(4, 2);
        expect(result.total).toBeCloseTo(4.65, 2);
        expect(result.breakdown.novelty.reason).toContain("20.0%");
        expect(result.breakdown.evidence.score).toBe(5);
    });
});

test.describe("Idea Kernel UI", () => {
    test("should render Idea Kernel page", async ({ page }) => {
        await page.goto("/idea-kernel");
        await expect(page.locator("h1:has-text('Idea Kernel')")).toBeVisible();
    });
});
