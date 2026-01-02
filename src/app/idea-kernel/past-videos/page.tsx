"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, RefreshCw } from "lucide-react";

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
    "title": "視聴維持率が伸びた3つの編集ルール",
    "youtubeUrl": "https://www.youtube.com/watch?v=example",
    "publishedAt": "2024-06-01",
    "summary": "編集テンポとテロップ設計を比較検証した回。",
    "tags": ["編集", "視聴維持率"]
  }
]`;

export default function PastVideosPage() {
  const [videos, setVideos] = useState<PastVideo[]>([]);
  const [input, setInput] = useState(sampleJson);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    youtubeUrl: "",
    publishedAt: "",
    summary: "",
    tags: "",
  });

  const fetchVideos = async () => {
    const res = await fetch("/api/idea-kernel/past-videos");
    const data = await res.json();
    if (res.ok) {
      setVideos(data.videos || []);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleImport = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        throw new Error("JSONは配列形式で入力してください。");
      }
      const res = await fetch("/api/idea-kernel/past-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "インポートに失敗しました。");
      }
      setMessage(`✅ ${data.imported}件の過去動画を登録しました。`);
      await fetchVideos();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "インポートに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (video: PastVideo) => {
    setEditingId(video.id);
    setEditForm({
      title: video.title ?? "",
      youtubeUrl: video.youtubeUrl ?? "",
      publishedAt: video.publishedAt ? video.publishedAt.slice(0, 10) : "",
      summary: video.summary ?? "",
      tags: (video.tags ?? []).join(", "),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/idea-kernel/past-videos/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        youtubeUrl: editForm.youtubeUrl,
        publishedAt: editForm.publishedAt,
        summary: editForm.summary,
        tags: editForm.tags,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      await fetchVideos();
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("この動画を削除しますか？")) return;
    const res = await fetch(`/api/idea-kernel/past-videos/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchVideos();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">過去動画データ</h1>
          <p className="text-sm text-gray-400">
            既出チェックのために過去動画を登録します。
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary px-4 py-2 text-sm" onClick={fetchVideos}>
            <RefreshCw size={14} className="inline mr-2" />
            再読み込み
          </button>
          <Link href="/idea-kernel" className="btn btn-secondary px-4 py-2 text-sm">
            一覧へ戻る
          </Link>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Upload size={16} />
          JSONインポート
        </div>
        <textarea
          className="textarea min-h-[220px]"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="btn btn-primary px-4 py-2" onClick={handleImport} disabled={isSubmitting}>
          {isSubmitting ? "登録中..." : "インポート"}
        </button>
        {message && <div className="text-sm text-gray-300">{message}</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">タイトル</th>
                <th className="px-4 py-3 text-left">公開日</th>
                <th className="px-4 py-3 text-left">タグ</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    登録された過去動画がありません。
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{video.title}</div>
                      {video.summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {video.summary}
                        </p>
                      )}
                      {video.youtubeUrl && (
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-300"
                        >
                          {video.youtubeUrl}
                        </a>
                      )}
                      {editingId === video.id && (
                        <div className="mt-3 space-y-2">
                          <input
                            className="input"
                            placeholder="タイトル"
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                          />
                          <input
                            className="input"
                            placeholder="YouTube URL"
                            value={editForm.youtubeUrl}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))
                            }
                          />
                          <input
                            className="input"
                            type="date"
                            value={editForm.publishedAt}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, publishedAt: event.target.value }))
                            }
                          />
                          <input
                            className="input"
                            placeholder="タグ（カンマ区切り）"
                            value={editForm.tags}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, tags: event.target.value }))
                            }
                          />
                          <textarea
                            className="textarea min-h-[120px]"
                            placeholder="概要"
                            value={editForm.summary}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, summary: event.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <button className="btn btn-primary px-3 py-2" onClick={saveEdit}>
                              保存
                            </button>
                            <button className="btn btn-secondary px-3 py-2" onClick={cancelEdit}>
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {video.publishedAt ? video.publishedAt.slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {(video.tags ?? []).length === 0 ? "-" : (video.tags ?? []).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        className="btn btn-secondary px-3 py-1 text-xs"
                        onClick={() => startEdit(video)}
                      >
                        編集
                      </button>
                      <button
                        className="btn btn-danger px-3 py-1 text-xs"
                        onClick={() => deleteVideo(video.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
