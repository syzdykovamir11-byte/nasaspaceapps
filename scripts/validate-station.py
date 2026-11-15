"""Compare NASA POWER (the cached demo-point series) with an independent weather station from NOAA GHCN-Daily.

Usage (from the repository root; the .gz is read directly):
  python3 -I scripts/validate-station.py data/stations/KZ000028952.csv.gz data/power_kostanay.json > data/stations/validate-kostanay.txt

GHCN-Daily by_station files: https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/<ID>.csv.gz
Units in GHCN: PRCP in tenths of mm, TMIN in tenths of degrees C (readme.txt). Rows with a quality flag are dropped.
Only seasons (1 Apr-30 Sep) with all 183 station days present for the element are compared.
Season indices follow src/lib/indices/season.ts: CDD = longest run of days with precipitation < 1 mm,
FD = days with daily minimum < 0 degrees C, both counted inside the season window.
"""
import csv
import datetime as dt
import gzip
import json
import math
import sys
from collections import Counter


def season_days(year):
    d = dt.date(year, 4, 1)
    while d <= dt.date(year, 9, 30):
        yield d
        d += dt.timedelta(days=1)


def cdd(values):
    best = run = 0
    for v in values:
        run = run + 1 if v < 1 else 0
        best = max(best, run)
    return best


def fd(values):
    return sum(1 for v in values if v < 0)


def pearson(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    return sxy / math.sqrt(sxx * syy) if sxx and syy else float("nan")


def main(station_csv, power_json):
    station = {"PRCP": {}, "TMIN": {}}
    dropped = Counter()
    obs_time = Counter()
    opener = gzip.open if station_csv.endswith(".gz") else open
    with opener(station_csv, "rt") as f:
        for row in csv.reader(f):
            if row[0] == "ID" or row[2] not in station:  # header, other elements
                continue
            if row[5]:  # any quality flag: drop the value (the season is then incomplete and not compared)
                dropped[(row[2], row[5])] += 1
                continue
            if row[3] == "-9999":
                dropped[(row[2], "missing")] += 1
                continue
            station[row[2]][row[1]] = int(row[3]) / 10.0
            if row[2] == "PRCP" and "19810101" <= row[1] <= "20061231" and len(row) > 7:
                obs_time[row[7] or "blank"] += 1

    power = json.load(open(power_json))
    p = power["properties"]["parameter"]
    fill = power["header"]["fill_value"]

    rows = []
    for year in range(1981, 2026):
        days = list(season_days(year))
        keys = [d.strftime("%Y%m%d") for d in days]
        out = {"year": year}
        if all(k in station["PRCP"] for k in keys) and all(p["PRECTOTCORR"][k] != fill for k in keys):
            sp = [station["PRCP"][k] for k in keys]
            pp = [p["PRECTOTCORR"][k] for k in keys]
            out.update(st_prcp=sum(sp), pw_prcp=sum(pp), st_cdd=cdd(sp), pw_cdd=cdd(pp))
        if all(k in station["TMIN"] for k in keys) and all(p["T2M_MIN"][k] != fill for k in keys):
            st = [station["TMIN"][k] for k in keys]
            pt = [p["T2M_MIN"][k] for k in keys]
            out.update(st_fd=fd(st), pw_fd=fd(pt))
        rows.append(out)

    def summarize(a, b, label, unit):
        pairs = [(r[a], r[b]) for r in rows if a in r]
        if not pairs:
            print(f"{label}: no complete seasons")
            return
        xs, ys = zip(*pairs)  # xs = station, ys = POWER
        bias = sum(y - x for x, y in pairs) / len(pairs)
        mae = sum(abs(y - x) for x, y in pairs) / len(pairs)
        years = [r["year"] for r in rows if a in r]
        print(f"{label}: {len(pairs)} seasons {years[0]}-{years[-1]} | station mean {sum(xs)/len(xs):.1f} {unit}, "
              f"POWER mean {sum(ys)/len(ys):.1f} {unit} | POWER minus station: mean {bias:+.1f} {unit}, "
              f"mean abs {mae:.1f} {unit} | correlation r = {pearson(xs, ys):.2f}")

    print(f"Station file: {station_csv}")
    print(f"POWER file: {power_json} (point {power['geometry']['coordinates']})")
    print(f"Station values dropped for a quality flag or -9999 (element, flag): count = {dict(dropped) or 'none'}")
    print(f"Station PRCP observation-time column, 1981-2006 (HHMM or blank): {dict(obs_time)}. POWER days are local solar time (LST) "
          f"calendar days; a station day ending at a morning observation can shift one day's rain across the date line between the two.")
    summarize("st_prcp", "pw_prcp", "Season precipitation total (1 Apr-30 Sep)", "mm")
    summarize("st_cdd", "pw_cdd", "Longest dry spell in season, CDD", "days")
    summarize("st_fd", "pw_fd", "Frost days in season, FD", "days")
    # Rank agreement for the headline use: is the driest / frostiest station season also extreme in POWER?
    pr = [r for r in rows if "st_cdd" in r]
    if pr:
        worst_st = max(pr, key=lambda r: r["st_cdd"])
        rank_pw = 1 + sum(1 for r in pr if r["pw_cdd"] > worst_st["pw_cdd"])
        print(f"Longest station dry spell: {worst_st['year']} ({worst_st['st_cdd']} d); POWER gives {worst_st['pw_cdd']} d, "
              f"rank {rank_pw} of {len(pr)} seasons in POWER")
        rest = [r for r in pr if r is not worst_st]
        print(f"CDD correlation without that one extreme season ({worst_st['year']}): r = "
              f"{pearson([r['st_cdd'] for r in rest], [r['pw_cdd'] for r in rest]):.2f} over {len(rest)} seasons")
    # Frost dates and the days between frosts, as in src/lib/crops/frost.ts: last day with Tmin < 0 before 15 July,
    # first such day on or after 15 July, days strictly between. Only calendar years with all station days present.
    def frost_window(tmin_by_key, year):
        last_spring = first_autumn = None
        d = dt.date(year, 1, 1)
        while d.year == year:
            v = tmin_by_key.get(d.strftime("%Y%m%d"))
            if v is None:
                return None
            if v < 0:
                if d < dt.date(year, 7, 15):
                    last_spring = d.timetuple().tm_yday
                elif first_autumn is None:
                    first_autumn = d.timetuple().tm_yday
            d += dt.timedelta(days=1)
        end = (dt.date(year, 12, 31).timetuple().tm_yday + 1) if first_autumn is None else first_autumn
        return (last_spring or 0, end, end - (last_spring or 0) - 1)

    pw_tmin = {k: v for k, v in p["T2M_MIN"].items() if v != fill}
    fw = []
    for year in range(1981, 2026):
        a, b = frost_window(station["TMIN"], year), frost_window(pw_tmin, year)
        if a and b:
            fw.append((year, a, b))
    if fw:
        n = len(fw)
        d_spring = sum(b[0] - a[0] for _, a, b in fw) / n
        d_autumn = sum(b[1] - a[1] for _, a, b in fw) / n
        d_window = sum(b[2] - a[2] for _, a, b in fw) / n
        r_window = pearson([a[2] for _, a, _ in fw], [b[2] for _, _, b in fw])
        print(f"\nFrost dates, {n} complete years {fw[0][0]}-{fw[-1][0]} (POWER minus station): last spring frost {d_spring:+.1f} days, "
              f"first autumn frost {d_autumn:+.1f} days, days between frosts {d_window:+.1f} days (station mean "
              f"{sum(a[2] for _, a, _ in fw)/n:.0f}, POWER mean {sum(b[2] for _, _, b in fw)/n:.0f}), correlation r = {r_window:.2f}")
        for crop, need in (("spring wheat", 120), ("field pea", 90), ("lentil", 150)):
            st_fit = sum(1 for _, a, _ in fw if a[2] >= need)
            pw_fit = sum(1 for _, _, b in fw if b[2] >= need)
            flips = sum(1 for _, a, b in fw if (a[2] >= need) != (b[2] >= need))
            print(f"  Years with at least {need} days between frosts ({crop}): station {st_fit} of {n}, POWER {pw_fit} of {n}, "
                  f"years where the two disagree: {flips}")

    print("\nYear | station precip | POWER precip | station CDD | POWER CDD | station FD | POWER FD")
    for r in rows:
        if len(r) <= 1:
            continue
        cell = lambda k, fmt: (fmt % r[k]) if k in r else "-"  # noqa: E731
        print(f"{r['year']} | {cell('st_prcp', '%.1f'):>6} | {cell('pw_prcp', '%.1f'):>6} | {cell('st_cdd', '%d'):>3} | "
              f"{cell('pw_cdd', '%d'):>3} | {cell('st_fd', '%d'):>3} | {cell('pw_fd', '%d'):>3}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
