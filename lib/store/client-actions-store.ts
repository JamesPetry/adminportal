"use client";

import { create } from "zustand";

interface ClientActionsStore {
  completedIds: string[];
  toggleComplete: (id: string) => void;
}

export const useClientActionsStore = create<ClientActionsStore>((set) => ({
  completedIds: [],
  toggleComplete: (id) =>
    set((state) => ({
      completedIds: state.completedIds.includes(id)
        ? state.completedIds.filter((item) => item !== id)
        : [...state.completedIds, id],
    })),
}));
