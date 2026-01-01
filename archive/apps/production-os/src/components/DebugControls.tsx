"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "production-os-debug";

type DebugState = {
  grid: boolean;
  outline: boolean;
  open: boolean;
};

const defaultState: DebugState = {
  grid: false,
  outline: false,
  open: false
};

function applyDebugState(state: DebugState) {
  const root = document.documentElement;
  if (state.grid) {
    root.dataset.debugGrid = "1";
  } else {
    delete root.dataset.debugGrid;
  }

  if (state.outline) {
    root.dataset.debugOutline = "1";
  } else {
    delete root.dataset.debugOutline;
  }
}

export default function DebugControls() {
  const [state, setState] = useState<DebugState>(defaultState);

  const hasQueryDebug = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DebugState;
        const next = { ...defaultState, ...parsed };
        setState(next);
        applyDebugState(next);
        return;
      } catch {
        // Ignore invalid storage
      }
    }

    if (hasQueryDebug) {
      const next = { ...defaultState, grid: true, outline: true };
      setState(next);
      applyDebugState(next);
    }
  }, [hasQueryDebug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyDebugState(state);
  }, [state]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => setState((prev) => ({ ...prev, open: !prev.open }))}
        className="rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--text)] shadow-lg transition hover:shadow-xl"
      >
        Debug
      </button>
      {state.open && (
        <div className="mt-3 w-48 space-y-3 rounded-2xl border border-[var(--border)] bg-white/95 p-4 text-xs text-[var(--muted)] shadow-xl">
          <label className="flex items-center justify-between">
            Grid
            <input
              type="checkbox"
              checked={state.grid}
              onChange={(event) =>
                setState((prev) => ({ ...prev, grid: event.target.checked }))
              }
            />
          </label>
          <label className="flex items-center justify-between">
            Outlines
            <input
              type="checkbox"
              checked={state.outline}
              onChange={(event) =>
                setState((prev) => ({ ...prev, outline: event.target.checked }))
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
