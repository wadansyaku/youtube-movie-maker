export const themes = {
  dark: {
    background: "#0b0f1a",
    panel: "#111827",
    panelBorder: "#1f2937",
    text: "#f8fafc",
    muted: "#cbd5f5",
    accent: "#38bdf8",
    accentSoft: "#0ea5e9",
    shape1: "#1e293b",
    shape2: "#0f172a"
  },
  light: {
    background: "#f8fafc",
    panel: "#ffffff",
    panelBorder: "#e2e8f0",
    text: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    accentSoft: "#0ea5e9",
    shape1: "#e2e8f0",
    shape2: "#cbd5f5"
  },
  slate: {
    background: "#0f172a",
    panel: "#111827",
    panelBorder: "#334155",
    text: "#f1f5f9",
    muted: "#94a3b8",
    accent: "#f59e0b",
    accentSoft: "#fbbf24",
    shape1: "#1f2937",
    shape2: "#0f172a"
  }
};

export function resolveTheme(name) {
  if (!name) return themes.dark;
  return themes[name] || themes.dark;
}
