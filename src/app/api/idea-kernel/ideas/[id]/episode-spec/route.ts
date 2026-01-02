import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildEpisodeSpec, type EpisodeSpecFormat } from "@/lib/idea-kernel";

const parseFormat = (value: unknown): EpisodeSpecFormat | undefined => {
  if (value === "short_60" || value === "long_8m") {
    return value;
  }
  return undefined;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idea = await prisma.ideaKernelIdea.findUnique({
      where: { id: params.id },
    });

    if (!idea) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (idea.status !== "SELECTED") {
      return NextResponse.json(
        { error: "Idea is not selected" },
        { status: 400 }
      );
    }

    if (idea.episodeSpecJson) {
      return NextResponse.json({ episodeSpecJson: idea.episodeSpecJson });
    }

    const body = await request.json().catch(() => ({}));
    const format = parseFormat(body?.format);

    const spec = buildEpisodeSpec({
      ideaId: idea.id,
      title: idea.title,
      format,
    });
    const episodeSpecJson = JSON.stringify(spec, null, 2);

    const updated = await prisma.ideaKernelIdea.update({
      where: { id: idea.id },
      data: {
        episodeSpecJson,
        episodeSpecCreatedAt: new Date(),
      },
    });

    return NextResponse.json({
      episodeSpecJson: updated.episodeSpecJson,
    });
  } catch (error) {
    console.error("Failed to generate episode spec:", error);
    return NextResponse.json(
      { error: "Failed to generate episode spec" },
      { status: 500 }
    );
  }
}
