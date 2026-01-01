"use client";

import { useMemo, useState } from "react";
import type { ProductionStep } from "@/lib/production-os/types";

const TYPE_OPTIONS = ["external_call", "transform", "export"];

type StepState = {
  id: string;
  name: string;
  type: string;
  tool: string;
  paramsText: string;
};

type TemplateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initial?: {
    id?: string;
    name?: string;
    format?: string;
    description?: string;
    config?: string;
    steps?: ProductionStep[];
  };
  configPlaceholder?: string;
};

function formatParams(params?: Record<string, unknown>) {
  if (!params) return "";
  return Object.entries(params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("\n");
}

function parseParams(text: string) {
  const params: Record<string, unknown> = {};
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  lines.forEach((line) => {
    const colonIndex = line.indexOf(":");
    const equalsIndex = line.indexOf("=");
    let splitIndex = -1;

    if (colonIndex >= 0 && equalsIndex >= 0) {
      splitIndex = Math.min(colonIndex, equalsIndex);
    } else {
      splitIndex = colonIndex >= 0 ? colonIndex : equalsIndex;
    }

    if (splitIndex === -1) return;

    const key = line.slice(0, splitIndex).trim();
    const rawValue = line.slice(splitIndex + 1).trim();
    if (!key) return;

    if (rawValue === "true" || rawValue === "false") {
      params[key] = rawValue === "true";
      return;
    }

    const numberValue = Number(rawValue);
    if (!Number.isNaN(numberValue) && rawValue !== "") {
      params[key] = numberValue;
      return;
    }

    params[key] = rawValue;
  });

  return params;
}

function mapToState(steps?: ProductionStep[]): StepState[] {
  if (!steps || steps.length === 0) {
    return [
      {
        id: `step-${Date.now()}`,
        name: "",
        type: "external_call",
        tool: "",
        paramsText: ""
      }
    ];
  }

  return steps.map((step) => ({
    id: step.id || `step-${Math.random().toString(36).slice(2, 8)}`,
    name: step.name || "",
    type: step.type || "external_call",
    tool: step.tool || "",
    paramsText: formatParams(step.params)
  }));
}

export default function TemplateForm({ action, submitLabel, initial, configPlaceholder }: TemplateFormProps) {
  const [steps, setSteps] = useState<StepState[]>(() => mapToState(initial?.steps));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const stepsPayload = useMemo(() => {
    return steps.map((step) => ({
      id: step.id,
      name: step.name || undefined,
      type: step.type || "external_call",
      tool: step.tool || undefined,
      params: parseParams(step.paramsText)
    }));
  }, [steps]);

  const stepsJson = useMemo(() => JSON.stringify(stepsPayload), [stepsPayload]);

  const updateStep = (index: number, field: keyof StepState, value: string) => {
    setSteps((prev) =>
      prev.map((step, idx) => (idx === index ? { ...step, [field]: value } : step))
    );
  };

  const moveStep = (from: number, to: number) => {
    setSteps((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => (event: React.DragEvent) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index: number) => (event: React.DragEvent) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveStep(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        type: "external_call",
        tool: "",
        paramsText: ""
      }
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <form action={action} className="space-y-4">
      {initial?.id && <input type="hidden" name="templateId" value={initial.id} />}
      <div>
        <label className="text-xs text-[var(--muted)]">テンプレ名</label>
        <input name="name" defaultValue={initial?.name || ""} className="input" required />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">出力フォーマット</label>
        <input name="format" defaultValue={initial?.format || ""} className="input" placeholder="shorts / long / clip" />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">説明</label>
        <input name="description" defaultValue={initial?.description || ""} className="input" placeholder="説明 (任意)" />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">config</label>
        <textarea
          name="config"
          defaultValue={initial?.config || ""}
          className="input h-28"
          placeholder={configPlaceholder}
        />
      </div>

      <div className="panel-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">steps</p>
            <p className="text-xs text-[var(--muted)]">外部ツール呼び出しをフォームで管理</p>
          </div>
          <button type="button" onClick={addStep} className="button-outline">
            Step追加
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-2xl border border-[var(--border)] bg-white/80 p-4 ${draggedIndex === index ? "border-[var(--accent)]/40 shadow-lg" : ""}`}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="rounded-full border border-[var(--border)] bg-white/70 px-2 py-1">STEP {index + 1}</span>
                  <span className="hidden text-[11px] md:inline">ドラッグで並び替え</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveStep(index, index - 1)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, index + 1)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    disabled={index === steps.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    disabled={steps.length === 1}
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--muted)]">name</label>
                  <input
                    value={step.name}
                    onChange={(event) => updateStep(index, "name", event.target.value)}
                    className="input"
                    placeholder="例: 動画生成"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">type</label>
                  <input
                    list="step-type-options"
                    value={step.type}
                    onChange={(event) => updateStep(index, "type", event.target.value)}
                    className="input"
                    placeholder="external_call / transform / export"
                  />
                  <datalist id="step-type-options">
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">tool</label>
                  <input
                    value={step.tool}
                    onChange={(event) => updateStep(index, "tool", event.target.value)}
                    className="input"
                    placeholder="例: runway / capcut"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">params</label>
                  <textarea
                    value={step.paramsText}
                    onChange={(event) => updateStep(index, "paramsText", event.target.value)}
                    className="input h-24"
                    placeholder="key=value\nquality=high"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <input type="hidden" name="steps" value={stepsJson} />
      </div>

      <button className="button-primary w-full">{submitLabel}</button>
    </form>
  );
}
