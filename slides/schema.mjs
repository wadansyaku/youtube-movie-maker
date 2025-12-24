import { z } from "zod";

const ImageSpec = z.union([
  z.string(),
  z.object({
    path: z.string(),
    alt: z.string().optional(),
    fit: z.enum(["cover", "contain"]).optional()
  })
]);

const SlideSpec = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string()).optional(),
  images: z.array(ImageSpec).optional(),
  durationSec: z.number().positive().optional()
});

const MetaSpec = z.object({
  width: z.number().positive().int().optional(),
  height: z.number().positive().int().optional(),
  theme: z.string().optional(),
  template: z.string().optional(),
  slideDuration: z.number().positive().optional(),
  audio: z.string().optional()
});

export const DeckSpec = z.object({
  meta: MetaSpec.optional(),
  slides: z.array(SlideSpec).min(1)
});

export function normalizeSpec(raw) {
  const meta = {
    width: raw.meta?.width ?? 1920,
    height: raw.meta?.height ?? 1080,
    theme: raw.meta?.theme ?? "dark",
    template: raw.meta?.template ?? "classic",
    slideDuration: raw.meta?.slideDuration ?? 5,
    audio: raw.meta?.audio
  };

  const slides = raw.slides.map((slide) => ({
    title: slide.title,
    bullets: slide.bullets ?? [],
    images: slide.images ?? [],
    durationSec: slide.durationSec ?? meta.slideDuration
  }));

  return { meta, slides };
}
