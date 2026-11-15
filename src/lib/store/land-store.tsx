import { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { MonitoringData } from "../logic";

export const qc = new QueryClient();

export interface Land {
  id: string;
  name: string;
  coordinates: number[][];
  polygonId: string;
}

interface LandState {
  selectedLand: Land | null;
  isDrawingMode: boolean;
  setData: (data: MonitoringData | null) => void;
  setSelectedLand: (land: Land | null) => void;
  setDrawingMode: (isDrawing: boolean) => void;
  clearSelectedLand: () => void;
  data: MonitoringData | null;
}

export const useLandStore = create<LandState>((set) => ({
  selectedLand: null,
  isDrawingMode: false,
  data: null,
  setSelectedLand: (land) => set({ selectedLand: land }),
  setDrawingMode: (isDrawing) => set({ isDrawingMode: isDrawing }),
  clearSelectedLand: () => set({ selectedLand: null }),
  setData: (data) => set({ data }),
}));
