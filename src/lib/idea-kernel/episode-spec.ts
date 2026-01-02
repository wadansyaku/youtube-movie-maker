export type EpisodeSpecFormat = "short_60" | "long_8m";

export type EpisodeSpecScene = {
  type: string;
  narration: string;
};

export type EpisodeSpec = {
  episode_id: string;
  format: EpisodeSpecFormat;
  title: string;
  scenes: EpisodeSpecScene[];
  assetPolicy: {
    reuseBgm: boolean;
    reuseSfx: boolean;
  };
};

export function buildEpisodeSpec(params: {
  ideaId: string;
  title: string;
  format?: EpisodeSpecFormat;
}): EpisodeSpec {
  const sceneCount = 20;
  const scenes: EpisodeSpecScene[] = Array.from(
    { length: sceneCount },
    (_, index) => ({
      type: "narration",
      narration: `TODO: Scene ${index + 1} narration`,
    })
  );

  return {
    episode_id: params.ideaId,
    format: params.format ?? "long_8m",
    title: params.title,
    scenes,
    assetPolicy: {
      reuseBgm: true,
      reuseSfx: true,
    },
  };
}
