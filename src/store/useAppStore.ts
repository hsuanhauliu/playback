import { create } from "zustand";
import type { Clip } from "../types";

interface AppState {
  clips: Clip[];
  mode: "single" | "compare";
  activeClipId: string | null;
  compareClipIds: [string | null, string | null];
  /** Drive both compare panes from one transport. */
  syncPlayback: boolean;
  addClips: (files: File[]) => void;
  removeClip: (id: string) => void;
  setMode: (mode: "single" | "compare") => void;
  setActiveClip: (id: string | null) => void;
  setCompareClip: (index: 0 | 1, id: string | null) => void;
  setSyncPlayback: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  clips: [],
  mode: "single",
  activeClipId: null,
  compareClipIds: [null, null],
  syncPlayback: true,
  addClips: (files) => {
    const newClips: Clip[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));
    set((state) => ({ clips: [...state.clips, ...newClips] }));

    const state = get();
    let [slotA, slotB] = state.compareClipIds;
    const pool = [...newClips];
    if (!slotA && pool.length) slotA = pool.shift()!.id;
    if (!slotB && pool.length) slotB = pool.shift()!.id;

    set({
      activeClipId: state.activeClipId ?? newClips[0]?.id ?? null,
      compareClipIds: [slotA, slotB],
    });
  },
  removeClip: (id) => {
    set((state) => {
      const clip = state.clips.find((c) => c.id === id);
      if (clip) URL.revokeObjectURL(clip.url);
      return {
        clips: state.clips.filter((c) => c.id !== id),
        activeClipId: state.activeClipId === id ? null : state.activeClipId,
        compareClipIds: [
          state.compareClipIds[0] === id ? null : state.compareClipIds[0],
          state.compareClipIds[1] === id ? null : state.compareClipIds[1],
        ],
      };
    });
  },
  setMode: (mode) => set({ mode }),
  setActiveClip: (id) => set({ activeClipId: id }),
  setCompareClip: (index, id) =>
    set((state) => {
      const next: [string | null, string | null] = [...state.compareClipIds];
      next[index] = id;
      return { compareClipIds: next };
    }),
  setSyncPlayback: (value) => set({ syncPlayback: value }),
}));
