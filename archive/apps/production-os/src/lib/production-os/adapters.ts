import type { ProductionSnapshot, ProductionStep } from "./types";

type AdapterContext = {
  step: ProductionStep;
  snapshot: ProductionSnapshot;
  jobRunId: string;
};

export type AdapterResult = {
  status: "ok" | "error";
  output?: Record<string, unknown>;
  error?: string;
};

type ToolAdapter = {
  name: string;
  execute: (context: AdapterContext) => Promise<AdapterResult>;
};

const defaultAdapter: ToolAdapter = {
  name: "default",
  async execute({ step, jobRunId }) {
    return {
      status: "ok",
      output: {
        message: "adapter stub",
        jobRunId,
        step: {
          id: step.id,
          type: step.type,
          tool: step.tool ?? null,
          params: step.params ?? {}
        }
      }
    };
  }
};

const registry: Record<string, ToolAdapter> = {
  default: defaultAdapter
};

export function resolveAdapter(tool?: string) {
  if (!tool) return registry.default;
  return registry[tool] ?? registry.default;
}
