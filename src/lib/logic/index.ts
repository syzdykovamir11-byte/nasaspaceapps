import { ImageryData, Polygon } from "./types";

const API_KEY = "bdbb1d904427d2a68f5b4e0152403dec";
const API_BASE_URL = "http://api.agromonitoring.com/agro/1.0";

export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function createPolygon(
  coordinates: number[][],
  name: string
): Promise<string> {
  const polygonData = {
    name,
    geo_json: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          coordinates.map((coord) =>
            coord.map((coord) => parseFloat(coord.toFixed(4)))
          ),
        ],
      },
    },
  };

  const url = `${API_BASE_URL}/polygons?appid=${API_KEY}&duplicated=true`;
  const data: Polygon = await fetchJson<Polygon>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(polygonData),
  });

  return data.id;
}

export async function getSatelliteImagery(
  polygonId: string,
  startDate: string,
  endDate: string
): Promise<ImageryData[]> {
  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

  const url = new URL(`${API_BASE_URL}/image/search`);
  url.searchParams.append("polyid", polygonId);
  url.searchParams.append("start", startTimestamp.toString());
  url.searchParams.append("end", endTimestamp.toString());
  url.searchParams.append("appid", API_KEY);

  const data: ImageryData[] = await fetchJson<ImageryData[]>(url.toString());
  return data;
}

export async function getAgroMonitoringData(polygonId: string, date: string) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 1 || 1);
  const endDate = new Date(date);

  const satelliteData = await getSatelliteImagery(
    polygonId,
    startDate.toISOString(),
    endDate.toISOString()
  );

  if (satelliteData.length === 0) {
    throw new Error("No satellite data available for the given date.");
  }

  const latestData = satelliteData.at(-1);

  return latestData;
}

export type MonitoringData = ReturnType<typeof getAgroMonitoringData>;
