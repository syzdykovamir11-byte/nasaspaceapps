"use client";

import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { useModalStore } from "~/lib/store/modal-store";
import { useLandStore } from "~/lib/store/land-store";
import { CREATE_FIELD_MODAL_KEY } from "../fields/create-field";
import { useLandMonitoring } from "~/lib/logic/hooks";
import { useViewStore } from "~/lib/store/view-store";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const MapBox: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const { isDrawingMode, selectedLand, setDrawingMode, clearSelectedLand } =
    useLandStore();
  const {
    viewParameters: { mode },
  } = useViewStore();

  const { openModal } = useModalStore();
  const sateliteData = useLandMonitoring();

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: [-121, 37],
      zoom: 12,
    });

    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "simple_select",
    });

    mapRef.current.addControl(drawRef.current);
  }, []);

  const handleDrawingModeChange = useCallback(() => {
    if (!mapRef.current || !drawRef.current) return;

    if (isDrawingMode) {
      drawRef.current.changeMode("draw_polygon");
      mapRef.current.getCanvas().style.cursor = "crosshair";
    } else {
      drawRef.current.changeMode("simple_select");
      mapRef.current.getCanvas().style.cursor = "";
    }
  }, [isDrawingMode]);

  const handleFieldCreation = useCallback(() => {
    if (!drawRef.current) return;

    const data = drawRef.current.getAll();
    if (data.features.length === 0) return;

    const areaInHectars = Math.round(turf.area(data) * 100) / 10010000;
    if (areaInHectars < 1) return;

    openModal(
      CREATE_FIELD_MODAL_KEY,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any).features[0].geometry.coordinates[0]
    );
    setDrawingMode(false);
    clearSelectedLand();
  }, [openModal, setDrawingMode, clearSelectedLand]);

  const setupNDVI = useCallback(() => {
    if (!mapRef.current) return;

    const data = {
      type: "image",
      url: "http://api.agromonitoring.com/image/1.0/13067008180/6702cb5393997d66a1bffbd6?appid=bdbb1d904427d2a68f5b4e0152403dec",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      coordinates: [
        [-120.92396660132226, 37.03349913198788],
        [-120.92344968706053, 37.025815702616484],
        [-120.91818208458301, 37.02461693894337],
        [-120.91791131996962, 37.030119304847716],
      ],
    } as const;

    mapRef.current.on("load", () => {
      mapRef.current?.addSource("ndvi", data);

      mapRef.current?.addLayer({
        id: "ndvi-layer",
        type: "raster",
        source: "ndvi",
        paint: { "raster-fade-duration": 0 },
      });
    });
  }, [sateliteData, selectedLand, mode]);

  const setupEventListeners = useCallback(() => {
    if (!mapRef.current) return;

    mapRef.current.on("draw.create", handleFieldCreation);
    mapRef.current.on("click", clearSelectedLand);

    return () => {
      mapRef.current?.off("draw.create", handleFieldCreation);
      mapRef.current?.off("click", clearSelectedLand);
    };
  }, [handleFieldCreation, clearSelectedLand]);

  const displaySelectedLand = useCallback(() => {
    if (!drawRef.current || !selectedLand) return;

    drawRef.current.set({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [selectedLand.coordinates],
          },
        },
      ],
    });
  }, [selectedLand]);

  useEffect(() => {
    initializeMap();
    return () => mapRef.current?.remove();
  }, [initializeMap]);

  useEffect(() => {
    handleDrawingModeChange();
  }, [handleDrawingModeChange]);

  useEffect(() => {
    return setupEventListeners();
  }, [setupEventListeners]);

  useEffect(() => {
    setupNDVI();
  }, [setupNDVI]);

  useEffect(() => {
    displaySelectedLand();
  }, [displaySelectedLand]);

  return <div ref={mapContainerRef} id="map" style={{ height: "100%" }} />;
};

export default MapBox;
