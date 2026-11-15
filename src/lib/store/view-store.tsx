import { create } from "zustand";

type ViewMode = "nvdi" | "satellite";

interface ViewParameters {
  mode: ViewMode;
  zoom: number;
  center: [number, number];
}

interface ViewState {
  viewParameters: ViewParameters;
  currentDate: Date;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
  setCurrentDate: (date: Date) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewParameters: {
    mode: "satellite",
    zoom: 10,
    center: [0, 0],
  },
  currentDate: new Date(),
  setViewMode: (mode) =>
    set((state) => ({
      viewParameters: { ...state.viewParameters, mode },
    })),
  setZoom: (zoom) =>
    set((state) => ({
      viewParameters: { ...state.viewParameters, zoom },
    })),
  setCenter: (center) =>
    set((state) => ({
      viewParameters: { ...state.viewParameters, center },
    })),
  setCurrentDate: (date) => set({ currentDate: date }),
}));
