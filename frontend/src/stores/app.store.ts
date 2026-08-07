/*
========================================================

File:
stores/app.store.ts

Purpose:
Zustand store for global application state.

Responsibilities:
- Manages sidebar visibility state
- Manages global modals and dialogs
- Tracks navigation state

Connected Files:
- src/layouts/ (sidebar consumers)
- src/components/ui/ (dialog consumers)
- src/app/router.tsx

Depends On:
- zustand

Notes:
Keep this store minimal. Feature-specific state
belongs in feature-specific stores.

========================================================
*/

import { create } from "zustand";

interface AppState {
  /** Sidebar open/close state */
  isSidebarOpen: boolean;
  /** Active command palette */
  isCommandPaletteOpen: boolean;

  /** Actions */
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  isCommandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
