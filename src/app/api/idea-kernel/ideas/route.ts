import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
    buildIdeaCanonicalText,
    buildSimilarityTop,
    scoreIdeaCandidate,
    type IdeaCandidate,
} from "@/lib/idea-kernel";

const ensureArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return [];
};

const toJsonString = (value: unknown, fallback: unknown) => {
    try {
        return JSON.stringify(value ?? fallback);
    } catch {
        return JSON.stringify(fallback);
    }
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : body.items;

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: "items must be an array" },
                { status: 400 }
            );
        }

        const pastVideos = await prisma.pastVideo.findMany({
            select: {
                id: true,
                title: true,
                youtubeUrl: true,
                publishedAt: true,
                canonicalText: true,
            },
        });

        const errors: string[] = [];
        const data: Prisma.IdeaKernelIdeaCreateManyInput[] = [];

        items.forEach((raw: IdeaCandidate, index: number) => {
            if (!raw?.title || !raw?.hook || !raw?.claim) {
                errors.push(`index ${index}: title/hook/claim は必須です`);
                return;
            }

            const candidate: IdeaCandidate = {
                title: String(raw.title),
                hook: String(raw.hook),
                claim: String(raw.claim),
                templateFit: ensureArray(raw.templateFit),
                targetViewer: raw.targetViewer ? String(raw.targetViewer) : undefined,
                comparisons: ensureArray(raw.comparisons),
                experiment: raw.experiment ? String(raw.experiment) : undefined,
                requiredEvidenceTypes: ensureArray(raw.requiredEvidenceTypes),
                estimatedCost: raw.estimatedCost ?? undefined,
                riskFlags: ensureArray(raw.riskFlags),
            };

            const canonicalText = buildIdeaCanonicalText(candidate);
            const similarityTop = buildSimilarityTop(canonicalText, pastVideos);
            const maxSimilarity = similarityTop[0]?.similarity ?? 0;
            const scoring = scoreIdeaCandidate({
                candidate,
                maxSimilarity,
            });

            data.push({
                status: "EVALUATED",
                title: candidate.title,
                hook: candidate.hook,
                claim: candidate.claim,
                templateFit: toJsonString(candidate.templateFit ?? [], []),
                comparisons: toJsonString(candidate.comparisons ?? [], []),
                experiment: candidate.experiment ?? null,
                requiredEvidenceTypes: toJsonString(
                    candidate.requiredEvidenceTypes ?? [],
                    []
                ),
                estimatedCost: toJsonString(candidate.estimatedCost ?? {}, {}),
                riskFlags: toJsonString(candidate.riskFlags ?? [], []),
                canonicalText,
                scoreTotal: scoring.total,
                scoreBreakdown: toJsonString(scoring.breakdown, {}),
                noveltyScore: scoring.noveltyScore,
                similarityTop: toJsonString(similarityTop, []),
            });
        });

        if (data.length === 0) {
            return NextResponse.json(
                { error: "No valid items to import", errors },
                { status: 400 }
            );
        }

        const result = await prisma.ideaKernelIdea.createMany({ data });
        return NextResponse.json({ imported: result.count, errors });
    } catch (error) {
        console.error("Failed to import ideas:", error);
        return NextResponse.json(
            { error: "Failed to import ideas" },
            { status: 500 }
        );
    }
}
