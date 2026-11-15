// types.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Polygon {
  id: string;
  name: string;
  coordinates: Coordinates[];
}

export interface ImageryData {
  cl: number;
  type: string;
  image?: {
    ndvi?: string;
  };
  stats?: {
    ndvi?: string;
    ndwi?: string;
    evi?: string;
    dswi?: string;
    nri?: string;
  };
  dt: number;
}
