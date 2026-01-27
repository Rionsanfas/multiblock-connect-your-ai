import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DisabledModelInfo = {
  reason: string;
  updatedAt: number;
};

// IMPORTANT: This store is intentionally scoped to ONLY the user-specified model IDs.
// Do NOT add other models here unless the user explicitly requests it.
// These are the EXACT canonical IDs from the user's list.
export const MODEL_IDS_IN_SCOPE = new Set<string>([
  // OpenAI
  "o3-deep-search",
  // Anthropic
  "claude-haiku-4-5-20251001",
  "claude-opus-4-1-20250805",
  "claude-sonnet-4-20250514",
  // Google
  "gemini-2.5-flash",
  "gemini-live-2.5-flash-native-audio",
  // xAI
  "grok-4-0709",
  "xai.grok-4.1-fast-non-reasoning",
  "xai.grok-4.1-fast-reasoning",
  // DeepSeek
  "deepseek-v3.2-speciale",
  // Mistral
  "mistral-large-25-12",
  "mistral-small-2506",
  "ministral-3-14b",
  "ministral-3-8b",
  "ministral-3-3b",
  "mistralai/Mistral-Nemo-Instruct-2407",
  "magistral-medium-2509",
  "magistral-small-2509",
  // Cohere
  "command-a-03-2025",
  "command-a-reasoning-08-2025",
  "command-a-translate-08-2025",
  "command-r-plus-08-2024",
  "c4ai-aya-expanse-32b",
  // Meta/Together
  "meta-llama/Llama-3.3-70B-Instruct",
  "meta-llama/Llama-4-Maverick-17B-128E",
  "meta-llama/Llama-4-Scout-17B-16E",
  // Qwen
  "Qwen3-235B-A22B-Instruct-2507",
]);

export function isModelInScope(modelId: string | undefined | null): boolean {
  if (!modelId) return false;
  return MODEL_IDS_IN_SCOPE.has(modelId);
}

type ModelDisableState = {
  disabledById: Record<string, DisabledModelInfo>;
  disableModel: (modelId: string, reason: string) => void;
  clearDisabledModel: (modelId: string) => void;
  getDisabledReason: (modelId: string) => string | null;
};

export const useModelDisableStore = create<ModelDisableState>()(
  persist(
    (set, get) => ({
      disabledById: {
        // Capability-aware hard disable (known incompatible)
        "gemini-live-2.5-flash-native-audio": {
          reason: "Audio-only model, text generation not supported",
          updatedAt: Date.now(),
        },
      },

      disableModel: (modelId, reason) => {
        if (!isModelInScope(modelId)) return;
        set((s) => ({
          disabledById: {
            ...s.disabledById,
            [modelId]: { reason, updatedAt: Date.now() },
          },
        }));
      },

      clearDisabledModel: (modelId) => {
        if (!isModelInScope(modelId)) return;
        const next = { ...get().disabledById };
        delete next[modelId];
        set({ disabledById: next });
      },

      getDisabledReason: (modelId) => {
        if (!isModelInScope(modelId)) return null;
        return get().disabledById[modelId]?.reason ?? null;
      },
    }),
    {
      name: "multiblock:model-disable:v1",
      partialize: (s) => ({ disabledById: s.disabledById }),
    }
  )
);
