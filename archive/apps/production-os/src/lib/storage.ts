export function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    json: "application/json",
    pdf: "application/pdf",
    zip: "application/zip"
  };

  return contentTypes[ext || ""] || "application/octet-stream";
}

export function getAssetType(fileName: string): "video" | "audio" | "image" | "slides" | "other" {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "flac"];
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const slideExts = ["zip"];

  if (videoExts.includes(ext || "")) return "video";
  if (audioExts.includes(ext || "")) return "audio";
  if (imageExts.includes(ext || "")) return "image";
  if (slideExts.includes(ext || "")) return "slides";
  return "other";
}
