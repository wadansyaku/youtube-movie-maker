import promptPack from "../../../templates/idea-kernel-prompt-pack.json";

type PastVideoSummary = {
  title: string;
  youtubeUrl?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  tags?: string[] | null;
};

const PROMPT_TEMPLATE =
  promptPack.prompts.ideaCandidateGenerator.template as string;

export function buildIdeaKernelPrompt(
  pastVideos?: PastVideoSummary[]
): string {
  const placeholder = "{{PAST_VIDEOS_JSON}}";
  if (!pastVideos || pastVideos.length === 0) {
    return PROMPT_TEMPLATE;
  }

  const payload = pastVideos.slice(0, 20).map((video) => ({
    title: video.title,
    publishedAt: video.publishedAt ?? null,
    youtubeUrl: video.youtubeUrl ?? null,
    summary: video.summary ?? null,
    tags: video.tags ?? [],
  }));

  return PROMPT_TEMPLATE.replace(
    placeholder,
    JSON.stringify(payload, null, 2)
  );
}

export const IDEA_KERNEL_PROMPT_TEMPLATE = PROMPT_TEMPLATE;
