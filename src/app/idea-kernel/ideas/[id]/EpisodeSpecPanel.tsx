"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";

type Props = {
  ideaId: string;
  episodeSpecJson?: string | null;
};

const formatJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default function EpisodeSpecPanel({ ideaId, episodeSpecJson }: Props) {
  const [specJson, setSpecJson] = useState(episodeSpecJson ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayJson = useMemo(
    () => (specJson ? formatJson(specJson) : ""),
    [specJson]
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/idea-kernel/ideas/${ideaId}/episode-spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました。");
      }
      setSpecJson(data.episodeSpecJson || "");
      setMessage("✅ EpisodeSpecを生成しました。");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "生成に失敗しました。"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <FileText size={16} />
          EpisodeSpec雛形
        </div>
        {!specJson && (
          <button
            type="button"
            className="btn btn-primary px-4 py-2 text-sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "生成中..." : "EpisodeSpec雛形を生成"}
          </button>
        )}
      </div>
      {specJson ? (
        <textarea
          className="textarea min-h-[260px]"
          value={displayJson}
          readOnly
        />
      ) : (
        <div className="text-xs text-gray-500">
          まだEpisodeSpecが生成されていません。
        </div>
      )}
      {message && <div className="text-xs text-gray-300">{message}</div>}
    </div>
  );
}
