import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Layers, LocateFixed } from "lucide-react";
import { Button, cx } from "./ui";

export type Point = { lat: number; lon: number };

const pinIcon = L.divIcon({
  className: "pin",
  html: `<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg"><path d="M20 51s17-17.6 17-31A17 17 0 0 0 3 20c0 13.4 17 31 17 31Z" fill="#1f5130" stroke="#fff" stroke-width="3"/><circle cx="20" cy="20" r="6.5" fill="#fff"/></svg>`,
  iconSize: [40, 52],
  iconAnchor: [20, 50],
});

// Default view: northern Kazakhstan, the region used in the team's wireframes.
const START: [number, number] = [51.2, 71.4];

function ClickToPin({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

function FlyTo({ target }: { target: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export function FieldMap({ point, onPick }: { point: Point | null; onPick: (p: Point) => void }) {
  const [satellite, setSatellite] = useState(true);
  const [flyTarget, setFlyTarget] = useState<Point | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Your device cannot share its location. Tap the map instead.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        onPick(p);
        setFlyTarget(p);
        setLocating(false);
      },
      () => {
        setGeoError("Location is turned off. Tap your field on the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-line shadow-sm">
        <MapContainer center={START} zoom={6} className="h-[52vh] min-h-80 w-full" zoomControl={false}>
          {satellite ? (
            <>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
                maxZoom={18}
              />
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
            </>
          ) : (
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
            />
          )}
          <ClickToPin onPick={onPick} />
          <FlyTo target={flyTarget} />
          {point && <Marker position={[point.lat, point.lon]} icon={pinIcon} />}
        </MapContainer>

        <button
          onClick={() => setSatellite((s) => !s)}
          className="absolute right-3 top-3 z-[500] inline-flex min-h-12 items-center gap-2 rounded-xl bg-white/95 px-4 text-base font-semibold text-ink shadow-md"
          aria-label={satellite ? "Show road map" : "Show satellite photo"}
        >
          <Layers className="size-5" aria-hidden />
          {satellite ? "Map" : "Photo"}
        </button>

        {!point && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-2xl bg-ink/80 px-4 py-3 text-center text-base font-medium text-white">
            Tap your field on the map
          </div>
        )}
      </div>

      <div className={cx("flex items-center justify-between gap-3 rounded-2xl px-1 text-base", point ? "text-ink" : "text-muted")}>
        <span>
          {point ? (
            <>
              Field marked at <b className="font-semibold">{point.lat.toFixed(3)}°, {point.lon.toFixed(3)}°</b>
            </>
          ) : (
            "No field marked yet"
          )}
        </span>
      </div>

      <Button variant="secondary" className="w-full" onClick={locate} disabled={locating} icon={<LocateFixed className="size-6" aria-hidden />}>
        {locating ? "Finding you…" : "I am standing in my field"}
      </Button>
      {geoError && <p className="text-base text-bad">{geoError}</p>}
    </div>
  );
}
