// Converts the cached NASA POWER snapshots in data/ into compact files in public/data/.
// Fails loudly if a file is not a contiguous daily series or has unexpected units.
// Fill values (-999) become null. Nothing is interpolated or invented.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "data");
const OUT = join(ROOT, "public", "data");

// Team decision: demo points near these towns (see data/README.md).
const POINTS = [
  { id: "astana", label: "Near Astana", region: "Akmola region" },
  { id: "kokshetau", label: "Near Kokshetau", region: "Akmola region" },
  { id: "kostanay", label: "Near Kostanay", region: "Kostanay region" },
  { id: "petropavl", label: "Near Petropavl", region: "North Kazakhstan region" },
];

const DOWNLOADED = "2026-11-14";
const SOIL_DOWNLOADED = "2026-11-15";
const EXPECTED_UNITS = { T2M_MAX: "C", T2M_MIN: "C", PRECTOTCORR: "mm/day" };

const toIso = (k) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
const DAY_MS = 86_400_000;

mkdirSync(OUT, { recursive: true });
const pointIndex = [];

for (const p of POINTS) {
  const raw = JSON.parse(readFileSync(join(SRC, `power_${p.id}.json`), "utf8"));
  const header = raw.header;
  const fill = header.fill_value;
  const params = raw.properties.parameter;

  for (const [name, unit] of Object.entries(EXPECTED_UNITS)) {
    const got = raw.parameters?.[name]?.units;
    if (got !== unit) throw new Error(`${p.id}: ${name} units are "${got}", expected "${unit}"`);
  }

  const keys = Object.keys(params.T2M_MAX).sort();
  const start = toIso(keys[0]);
  const end = toIso(keys[keys.length - 1]);
  const t0 = Date.parse(`${start}T00:00:00Z`);
  keys.forEach((k, i) => {
    if (Date.parse(`${toIso(k)}T00:00:00Z`) !== t0 + i * DAY_MS) {
      throw new Error(`${p.id}: gap or duplicate day at ${k}`);
    }
  });

  const series = (name) =>
    keys.map((k) => {
      const v = params[name][k];
      if (v === undefined) throw new Error(`${p.id}: ${name} missing key ${k}`);
      return v === fill ? null : v;
    });

  // Root-zone soil wetness (GWETROOT, 0-1, unitless) from a separate POWER snapshot in data/soil/.
  const soilRaw = JSON.parse(readFileSync(join(SRC, "soil", `power_gwet_${p.id}.json`), "utf8"));
  if (soilRaw.parameters?.GWETROOT?.units !== "1") throw new Error(`${p.id}: GWETROOT units are not "1"`);
  const soilParam = soilRaw.properties.parameter.GWETROOT;
  const soilFill = soilRaw.header.fill_value;
  const soil = keys.map((k) => {
    const v = soilParam[k];
    if (v === undefined) throw new Error(`${p.id}: GWETROOT missing key ${k}`);
    if (v !== soilFill && (v < 0 || v > 1)) throw new Error(`${p.id}: GWETROOT out of range at ${k}: ${v}`);
    return v === soilFill ? null : v;
  });
  if (Object.keys(soilParam).length !== keys.length) throw new Error(`${p.id}: GWETROOT has a different day count`);
  const [sLon, sLat] = soilRaw.geometry.coordinates;
  if (sLon !== raw.geometry.coordinates[0] || sLat !== raw.geometry.coordinates[1]) {
    throw new Error(`${p.id}: GWETROOT snapshot is for a different point`);
  }

  const [lon, lat, elevation] = raw.geometry.coordinates;
  const out = {
    ...p,
    lat,
    lon,
    elevationM: typeof elevation === "number" ? elevation : null,
    start,
    end,
    source: {
      title: header.title,
      apiVersion: header.api?.version ?? "",
      sources: header.sources ?? [],
      timeStandard: header.time_standard ?? "",
      downloaded: DOWNLOADED,
      requestUrl:
        `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR` +
        `&community=AG&latitude=${lat}&longitude=${lon}&start=${keys[0]}&end=${keys[keys.length - 1]}&format=JSON`,
    },
    units: { tmax: "°C", tmin: "°C", prcp: "mm/day" },
    tmax: series("T2M_MAX"),
    tmin: series("T2M_MIN"),
    prcp: series("PRECTOTCORR"),
    soil,
    soilSource: {
      downloaded: SOIL_DOWNLOADED,
      requestUrl:
        `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=GWETROOT,GWETTOP` +
        `&community=AG&latitude=${lat}&longitude=${lon}&start=${keys[0]}&end=${keys[keys.length - 1]}&format=JSON`,
    },
  };
  const nulls = ["tmax", "tmin", "prcp", "soil"].map((s) => out[s].filter((v) => v === null).length);
  writeFileSync(join(OUT, `${p.id}.json`), JSON.stringify(out));
  pointIndex.push({ ...p, lat, lon });
  console.log(`${p.id}: ${keys.length} days ${start}..${end}, fill values (tmax,tmin,prcp,soil): ${nulls.join(",")}`);
}

writeFileSync(join(OUT, "points.json"), JSON.stringify(pointIndex));
