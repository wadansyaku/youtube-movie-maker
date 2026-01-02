"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Sparkles } from "lucide-react";
import { buildIdeaKernelPrompt } from "@/lib/idea-kernel";

type PastVideo = {
  id: string;
  title: string;
  youtubeUrl?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  tags?: string[] | null;
};

const sampleJson = `[
  {
    "title": "AIが作った台本は本当に視聴維持率を伸ばすのか？",
    "hook": "AI台本だけで平均視聴維持率は上がるのか検証します。",
    "claim": "AI台本の方がフック構造が明確になり離脱率が下がる",
    "templateFit": ["experiment_log", "decision_lab"],
    "targetViewer": "動画制作を効率化したい制作者",
    "comparisons": ["人間台本", "AI台本", "ハイブリッド"],
    "experiment": "同じテーマで3本制作し、平均視聴維持率とCTRを比較する。",
    "requiredEvidenceTypes": ["公式", "実測"],
    "estimatedCost": { "runway": "low", "sora": "none", "suno": "reuse", "tts": "required" },
    "riskFlags": ["検証規模が小さい"]
  }
]`;

export default function IdeaKernelNewPage() {
  const [input, setInput] = useState(sampleJson);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pastVideos, setPastVideos] = useState<PastVideo[]>([]);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"success" | "error" | null>(null);

  const promptText = useMemo(
    () => buildIdeaKernelPrompt(pastVideos),
    [pastVideos]
  );
  const embeddedCount = Math.min(pastVideos.length, 20);
  const hasPastVideos = embeddedCount > 0;

  useEffect(() => {
    const fetchPastVideos = async () => {
      try {
        const res = await fetch("/api/idea-kernel/past-videos");
        const data = await res.json();
        if (res.ok) {
          setPastVideos(data.videos || []);
        }
      } catch {
        // ignore
      }
    };

    fetchPastVideos();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrors([]);

    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        throw new Error("JSONは配列形式で入力してください。");
      }

      const res = await fetch("/api/idea-kernel/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "登録に失敗しました。");
      }

      setMessage(`✅ ${data.imported}件のIdeaを評価・保存しました。`);
      if (data.errors?.length) {
        setErrors(data.errors);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "登録に失敗しました。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrompt = async () => {
    setCopyMessage(null);
    setCopyStatus(null);
    try {
      await navigator.clipboard.writeText(promptText);
      setCopyMessage("✅ プロンプトをコピーしました。");
      setCopyStatus("success");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("コピーに失敗しました。");
      setCopyStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Idea Kernel - 新規登録</h1>
          <p className="text-sm text-gray-400">
            JSON配列を貼り付けると、スコアリングと被り判定を自動で行います。
          </p>
        </div>
        <Link href="/idea-kernel" className="btn btn-secondary px-4 py-2 text-sm">
          一覧へ戻る
        </Link>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-200">生成用プロンプト</div>
            <p className="text-xs text-gray-500 mt-1">
              {hasPastVideos
                ? `PastVideo ${embeddedCount}件を埋め込み済み`
                : "PastVideoが未登録の場合は {{PAST_VIDEOS_JSON}} が残ります"}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary px-4 py-2 text-sm"
            onClick={handleCopyPrompt}
          >
            <Copy size={14} className="mr-2 inline" />
            生成用プロンプトをコピー
          </button>
        </div>
        <textarea className="textarea min-h-[200px]" value={promptText} readOnly />
        {copyMessage && (
          <div
            className={`text-xs ${copyStatus === "error" ? "text-red-300" : "text-emerald-300"}`}
          >
            {copyMessage}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Sparkles size={16} />
          IdeaCandidate JSON
        </div>
        <textarea
          className="textarea min-h-[260px]"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary px-4 py-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "評価中..." : "評価して保存"}
        </button>

        {message && (
          <div className="text-sm text-gray-300">{message}</div>
        )}
        {errors.length > 0 && (
          <div className="text-xs text-red-300 space-y-1">
            {errors.map((error, index) => (
              <div key={index}>・{error}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
