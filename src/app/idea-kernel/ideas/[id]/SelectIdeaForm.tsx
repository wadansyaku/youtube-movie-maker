"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SelectIdeaForm({ ideaId }: { ideaId: string }) {
    const [selectionReason, setSelectionReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSelect = () => {
        setError(null);
        const reason = selectionReason.trim();
        if (!reason) {
            setError("採用理由を入力してください。");
            return;
        }

        startTransition(async () => {
            const res = await fetch(`/api/idea-kernel/ideas/${ideaId}/select`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selectionReason: reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "採用に失敗しました。");
                return;
            }

            setSelectionReason("");
            router.refresh();
        });
    };

    return (
        <div className="card p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-200">採用理由（必須）</div>
            <textarea
                className="textarea min-h-[120px]"
                value={selectionReason}
                onChange={(event) => setSelectionReason(event.target.value)}
                placeholder="なぜこのアイデアを採用するかを記述してください。"
            />
            {error && <div className="text-xs text-red-300">{error}</div>}
            <button
                className="btn btn-primary px-4 py-2"
                onClick={handleSelect}
                disabled={isPending}
            >
                {isPending ? "採用中..." : "採用する"}
            </button>
        </div>
    );
}
