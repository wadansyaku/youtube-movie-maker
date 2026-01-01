export type ProductionStep = {
  id: string;
  name?: string;
  type: "external_call" | "transform" | "export" | string;
  tool?: string;
  params?: Record<string, unknown>;
};

export type ProductionSnapshot = {
  version: number;
  capturedAt: string;
  item: {
    id: string;
    title: string;
    status: string;
    tags: string[];
    inputText?: string | null;
    kpiNote?: string | null;
  };
  template?: {
    id: string;
    name: string;
    format: string;
    config: Record<string, unknown>;
    steps: ProductionStep[];
  } | null;
  assets: Array<{
    id: string;
    fileName: string;
    type: string;
    filePath: string;
    role?: string | null;
    notes?: string | null;
    metadata: Record<string, unknown>;
  }>;
  references: Array<{
    id: string;
    label: string;
    url?: string | null;
    notes?: string | null;
  }>;
  steps: ProductionStep[];
  params: Record<string, unknown>;
};
