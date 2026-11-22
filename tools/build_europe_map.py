#!/usr/bin/env python3
"""Turn public-domain Natural Earth data into the geometry the blind-map applet needs.

The applet ships one generated file, ``static/media/europe-blind-map/map.json``.
Everything in it is already projected into the SVG coordinate system, so the
browser only has to draw strings and measure distances.

Inputs (public domain, downloaded once into a scratch directory):

  countries-50m.json                       https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json
  ne_50m_rivers_lake_centerlines.geojson   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/
  ne_50m_lakes.geojson                     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/

Usage:

    python3 -I tools/build_europe_map.py <input-dir> [output.json]

The curated layers (capitals, seas, mountain ridges, islands, sites) are not in
the Natural Earth files at a useful granularity, so they live in this file as
plain latitude/longitude tables. They are the part a human has to get right.
"""

import json
import math
import os
import sys

# --------------------------------------------------------------- projection
#
# Albers equal-area conic. The two standard parallels sit where the map should
# be true to scale, which for a map of Europe is roughly southern France and
# central Scandinavia. Equal-area matters here: a child comparing Sweden with
# Spain should be comparing the real thing.

LON0, LAT0 = 10.0, 52.0
LAT1, LAT2 = 43.0, 62.0

_N = (math.sin(math.radians(LAT1)) + math.sin(math.radians(LAT2))) / 2.0
_C = (math.cos(math.radians(LAT1)) ** 2
      + 2.0 * _N * math.sin(math.radians(LAT1)))
_RHO0 = math.sqrt(_C - 2.0 * _N * math.sin(math.radians(LAT0))) / _N


def project(lon, lat):
    """Longitude and latitude in degrees to planar coordinates, y pointing down."""
    rho = math.sqrt(max(_C - 2.0 * _N * math.sin(math.radians(lat)), 0.0)) / _N
    theta = _N * math.radians(lon - LON0)
    return rho * math.sin(theta), -(_RHO0 - rho * math.cos(theta))


# The geographic window. North Cape sits at 71.2 N, so the north edge leaves a
# strip of the Barents Sea; the east edge stops short of the Urals, which is
# why the Urals are not among the mountain ranges the quiz asks for.
WINDOW = {"lon": (-26.0, 46.0), "lat": (34.0, 73.0)}
OUT_W = 1000.0
PAD = 6.0


def window_box():
    """Projected bounding box of the geographic window, sampled on its edges."""
    xs, ys = [], []
    lo_lon, hi_lon = WINDOW["lon"]
    lo_lat, hi_lat = WINDOW["lat"]
    steps = 200
    for i in range(steps + 1):
        f = i / steps
        for lon, lat in ((lo_lon + f * (hi_lon - lo_lon), lo_lat),
                         (lo_lon + f * (hi_lon - lo_lon), hi_lat),
                         (lo_lon, lo_lat + f * (hi_lat - lo_lat)),
                         (hi_lon, lo_lat + f * (hi_lat - lo_lat))):
            x, y = project(lon, lat)
            xs.append(x)
            ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


_BOX = window_box()
_SCALE = OUT_W / (_BOX[2] - _BOX[0])
OUT_H = round((_BOX[3] - _BOX[1]) * _SCALE, 1)


def to_svg(lon, lat):
    x, y = project(lon, lat)
    return ((x - _BOX[0]) * _SCALE, (y - _BOX[1]) * _SCALE)


CLIP = (0.0, 0.0, OUT_W, OUT_H)

# A ring is cut in longitude and latitude *before* it is projected. Without
# this, Russia's ring runs out to 180 E, the conic projection folds it back
# across the map, and the result is one polygon covering most of Europe. The
# geographic window is given a margin so the projected clip still does the
# final, curved trim.
# The margin is wide on purpose. The projected box is the bounding rectangle of
# a curved window, so its corners reach well past the window itself; a narrow
# geographic margin would leave the geographic cut visible as a straight line
# across the north-east corner instead of letting real land fill it.
GEO_CLIP = (-45.0, 26.0, 70.0, 82.0)


# ----------------------------------------------------------------- geometry

def clip_polygon(ring, box):
    """Sutherland-Hodgman against an axis-aligned rectangle."""
    x0, y0, x1, y1 = box
    edges = (("x", x0, 1), ("x", x1, -1), ("y", y0, 1), ("y", y1, -1))
    out = list(ring)
    for axis, value, sign in edges:
        if not out:
            return []
        idx = 0 if axis == "x" else 1

        def inside(p):
            return (p[idx] - value) * sign >= 0

        clipped = []
        prev = out[-1]
        for cur in out:
            if inside(cur):
                if not inside(prev):
                    clipped.append(intersect(prev, cur, idx, value))
                clipped.append(cur)
            elif inside(prev):
                clipped.append(intersect(prev, cur, idx, value))
            prev = cur
        out = clipped
    return out


def intersect(a, b, idx, value):
    da = b[idx] - a[idx]
    t = 0.0 if da == 0 else (value - a[idx]) / da
    return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))


def clip_line(points, box):
    """Split a polyline at the window border, keeping the pieces inside."""
    x0, y0, x1, y1 = box

    def inside(p):
        return x0 <= p[0] <= x1 and y0 <= p[1] <= y1

    pieces, cur = [], []
    for p in points:
        if inside(p):
            cur.append(p)
        else:
            if len(cur) > 1:
                pieces.append(cur)
            cur = []
    if len(cur) > 1:
        pieces.append(cur)
    return pieces


def simplify(points, tol):
    """Douglas-Peucker, iterative so a long coastline cannot blow the stack."""
    if len(points) < 3:
        return list(points)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        lo, hi = stack.pop()
        ax, ay = points[lo]
        bx, by = points[hi]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        worst, worst_i = -1.0, -1
        for i in range(lo + 1, hi):
            px, py = points[i]
            if norm == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > worst:
                worst, worst_i = d, i
        if worst > tol and worst_i > 0:
            keep[worst_i] = True
            stack.append((lo, worst_i))
            stack.append((worst_i, hi))
    return [p for p, k in zip(points, keep) if k]


def ring_area(ring):
    s = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i - 1]
        x1, y1 = ring[i]
        s += x0 * y1 - x1 * y0
    return abs(s) / 2.0


def point_in_ring(pt, ring):
    x, y = pt
    inside = False
    for i in range(len(ring)):
        x0, y0 = ring[i - 1]
        x1, y1 = ring[i]
        if (y0 > y) != (y1 > y):
            xx = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            if xx > x:
                inside = not inside
    return inside


def label_point(ring):
    """A point inside the ring: the centroid, or the middle of the widest span."""
    cx = sum(p[0] for p in ring) / len(ring)
    cy = sum(p[1] for p in ring) / len(ring)
    if point_in_ring((cx, cy), ring):
        return (cx, cy)
    best, best_mid = 0.0, (cx, cy)
    lo = min(p[1] for p in ring)
    hi = max(p[1] for p in ring)
    for i in range(1, 40):
        y = lo + (hi - lo) * i / 40.0
        xs = []
        for j in range(len(ring)):
            x0, y0 = ring[j - 1]
            x1, y1 = ring[j]
            if (y0 > y) != (y1 > y):
                xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for k in range(0, len(xs) - 1, 2):
            span = xs[k + 1] - xs[k]
            if span > best:
                best, best_mid = span, ((xs[k] + xs[k + 1]) / 2.0, y)
    return best_mid


def path_d(rings, digits=1):
    out = []
    for ring in rings:
        if len(ring) < 3:
            continue
        out.append("M" + " ".join(
            "%s,%s" % (round(x, digits), round(y, digits)) for x, y in ring) + "Z")
    return "".join(out)


def line_d(pieces, digits=1):
    out = []
    for piece in pieces:
        if len(piece) < 2:
            continue
        out.append("M" + " ".join(
            "%s,%s" % (round(x, digits), round(y, digits)) for x, y in piece))
    return "".join(out)


# ------------------------------------------------------------- topojson I/O

def decode_arcs(topo):
    scale = topo["transform"]["scale"]
    translate = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * scale[0] + translate[0], y * scale[1] + translate[1]))
        arcs.append(points)
    return arcs


def arc_ring(arcs, indexes):
    ring = []
    for idx in indexes:
        piece = arcs[~idx][::-1] if idx < 0 else arcs[idx]
        ring.extend(piece if not ring else piece[1:])
    return ring


def geometry_rings(geom, arcs):
    if geom["type"] == "Polygon":
        return [arc_ring(arcs, part) for part in geom["arcs"]]
    if geom["type"] == "MultiPolygon":
        rings = []
        for poly in geom["arcs"]:
            rings.extend(arc_ring(arcs, part) for part in poly)
        return rings
    return []


# ------------------------------------------------------------- curated data
#
# Everything below is hand-entered. Coordinates are decimal degrees, latitude
# first in the comments but (lat, lon) in the tuples, which is how they read
# off an atlas.

COUNTRIES = {
    # Natural Earth name: (id, German, English, tier 1 = easy .. 3 = hard)
    "Portugal":              ("pt", "Portugal", "Portugal", 1),
    "Spain":                 ("es", "Spanien", "Spain", 1),
    "France":                ("fr", "Frankreich", "France", 1),
    "Ireland":               ("ie", "Irland", "Ireland", 1),
    "United Kingdom":        ("gb", "Vereinigtes Königreich", "United Kingdom", 1),
    "Netherlands":           ("nl", "Niederlande", "Netherlands", 1),
    "Belgium":               ("be", "Belgien", "Belgium", 2),
    "Luxembourg":            ("lu", "Luxemburg", "Luxembourg", 3),
    "Germany":               ("de", "Deutschland", "Germany", 1),
    "Denmark":               ("dk", "Dänemark", "Denmark", 1),
    "Norway":                ("no", "Norwegen", "Norway", 1),
    "Sweden":                ("se", "Schweden", "Sweden", 1),
    "Finland":               ("fi", "Finnland", "Finland", 1),
    "Estonia":               ("ee", "Estland", "Estonia", 3),
    "Latvia":                ("lv", "Lettland", "Latvia", 3),
    "Lithuania":             ("lt", "Litauen", "Lithuania", 3),
    "Poland":                ("pl", "Polen", "Poland", 1),
    "Czechia":               ("cz", "Tschechien", "Czechia", 2),
    "Slovakia":              ("sk", "Slowakei", "Slovakia", 2),
    "Austria":               ("at", "Österreich", "Austria", 1),
    "Switzerland":           ("ch", "Schweiz", "Switzerland", 1),
    "Italy":                 ("it", "Italien", "Italy", 1),
    "Slovenia":              ("si", "Slowenien", "Slovenia", 3),
    "Croatia":               ("hr", "Kroatien", "Croatia", 2),
    "Bosnia and Herz.":      ("ba", "Bosnien und Herzegowina", "Bosnia and Herzegovina", 3),
    "Serbia":                ("rs", "Serbien", "Serbia", 2),
    "Montenegro":            ("me", "Montenegro", "Montenegro", 3),
    "Kosovo":                ("xk", "Kosovo", "Kosovo", 3),
    "Albania":               ("al", "Albanien", "Albania", 3),
    "Macedonia":             ("mk", "Nordmazedonien", "North Macedonia", 3),
    "Greece":                ("gr", "Griechenland", "Greece", 1),
    "Bulgaria":              ("bg", "Bulgarien", "Bulgaria", 2),
    "Romania":               ("ro", "Rumänien", "Romania", 2),
    "Hungary":               ("hu", "Ungarn", "Hungary", 2),
    "Moldova":               ("md", "Moldau", "Moldova", 3),
    "Ukraine":               ("ua", "Ukraine", "Ukraine", 1),
    "Belarus":               ("by", "Belarus", "Belarus", 2),
    "Iceland":               ("is", "Island", "Iceland", 1),
    "Turkey":                ("tr", "Türkei", "Türkiye", 2),
    "Russia":                ("ru", "Russland", "Russia", 1),
    "Cyprus":                ("cy", "Zypern", "Cyprus", 3),
    "Malta":                 ("mt", "Malta", "Malta", 3),
}

# Countries drawn for context but never asked for: too small to drop onto.
CONTEXT_COUNTRIES = [
    "Andorra", "Monaco", "San Marino", "Vatican", "Liechtenstein",
    "Morocco", "Algeria", "Tunisia", "Libya", "Egypt", "Syria", "Lebanon",
    "Israel", "Jordan", "Iraq", "Iran", "Georgia", "Armenia", "Azerbaijan",
    "Kazakhstan", "Greenland", "Faeroe Is.", "Isle of Man", "Jersey",
    "Guernsey", "Gibraltar", "N. Cyprus", "Kuwait", "Saudi Arabia",
]

CAPITALS = [
    # (id, German, English, lat, lon, tier, country id)
    ("lisbon", "Lissabon", "Lisbon", 38.72, -9.14, 1, "pt"),
    ("madrid", "Madrid", "Madrid", 40.42, -3.70, 1, "es"),
    ("paris", "Paris", "Paris", 48.86, 2.35, 1, "fr"),
    ("dublin", "Dublin", "Dublin", 53.35, -6.26, 1, "ie"),
    ("london", "London", "London", 51.51, -0.13, 1, "gb"),
    ("amsterdam", "Amsterdam", "Amsterdam", 52.37, 4.90, 1, "nl"),
    ("brussels", "Brüssel", "Brussels", 50.85, 4.35, 2, "be"),
    ("luxembourg", "Luxemburg", "Luxembourg", 49.61, 6.13, 3, "lu"),
    ("berlin", "Berlin", "Berlin", 52.52, 13.40, 1, "de"),
    ("copenhagen", "Kopenhagen", "Copenhagen", 55.68, 12.57, 1, "dk"),
    ("oslo", "Oslo", "Oslo", 59.91, 10.75, 1, "no"),
    ("stockholm", "Stockholm", "Stockholm", 59.33, 18.07, 1, "se"),
    ("helsinki", "Helsinki", "Helsinki", 60.17, 24.94, 2, "fi"),
    ("tallinn", "Tallinn", "Tallinn", 59.44, 24.75, 3, "ee"),
    ("riga", "Riga", "Riga", 56.95, 24.11, 3, "lv"),
    ("vilnius", "Wilna", "Vilnius", 54.69, 25.28, 3, "lt"),
    ("warsaw", "Warschau", "Warsaw", 52.23, 21.01, 1, "pl"),
    ("prague", "Prag", "Prague", 50.09, 14.42, 2, "cz"),
    ("bratislava", "Bratislava", "Bratislava", 48.15, 17.11, 3, "sk"),
    ("vienna", "Wien", "Vienna", 48.21, 16.37, 1, "at"),
    ("bern", "Bern", "Bern", 46.95, 7.45, 2, "ch"),
    ("rome", "Rom", "Rome", 41.90, 12.50, 1, "it"),
    ("ljubljana", "Ljubljana", "Ljubljana", 46.06, 14.51, 3, "si"),
    ("zagreb", "Zagreb", "Zagreb", 45.81, 15.98, 3, "hr"),
    ("sarajevo", "Sarajevo", "Sarajevo", 43.86, 18.41, 3, "ba"),
    ("belgrade", "Belgrad", "Belgrade", 44.79, 20.45, 2, "rs"),
    ("podgorica", "Podgorica", "Podgorica", 42.44, 19.26, 3, "me"),
    ("pristina", "Pristina", "Pristina", 42.66, 21.17, 3, "xk"),
    ("tirana", "Tirana", "Tirana", 41.33, 19.82, 3, "al"),
    ("skopje", "Skopje", "Skopje", 41.99, 21.43, 3, "mk"),
    ("athens", "Athen", "Athens", 37.98, 23.73, 1, "gr"),
    ("sofia", "Sofia", "Sofia", 42.70, 23.32, 2, "bg"),
    ("bucharest", "Bukarest", "Bucharest", 44.43, 26.10, 2, "ro"),
    ("budapest", "Budapest", "Budapest", 47.50, 19.04, 1, "hu"),
    ("chisinau", "Chisinau", "Chisinau", 47.01, 28.86, 3, "md"),
    ("kyiv", "Kyjiw", "Kyiv", 50.45, 30.52, 1, "ua"),
    ("minsk", "Minsk", "Minsk", 53.90, 27.57, 2, "by"),
    ("reykjavik", "Reykjavík", "Reykjavík", 64.15, -21.94, 1, "is"),
    ("ankara", "Ankara", "Ankara", 39.93, 32.86, 2, "tr"),
    ("moscow", "Moskau", "Moscow", 55.76, 37.62, 1, "ru"),
    ("nicosia", "Nikosia", "Nicosia", 35.17, 33.36, 3, "cy"),
    ("valletta", "Valletta", "Valletta", 35.90, 14.51, 3, "mt"),
]

WATERS = [
    # (id, German, English, lat, lon, radius in map units, tier)
    ("atlantic", "Atlantischer Ozean", "Atlantic Ocean", 46.0, -18.0, 90, 1),
    ("northsea", "Nordsee", "North Sea", 56.2, 3.0, 45, 1),
    ("baltic", "Ostsee", "Baltic Sea", 57.0, 19.0, 45, 1),
    ("mediterranean", "Mittelmeer", "Mediterranean Sea", 36.3, 15.0, 70, 1),
    ("blacksea", "Schwarzes Meer", "Black Sea", 43.3, 34.0, 55, 1),
    ("norwegiansea", "Europäisches Nordmeer", "Norwegian Sea", 67.0, 2.0, 60, 2),
    ("barents", "Barentssee", "Barents Sea", 71.6, 34.0, 45, 3),
    ("biscay", "Golf von Biskaya", "Bay of Biscay", 45.5, -4.5, 36, 2),
    ("bothnia", "Bottnischer Meerbusen", "Gulf of Bothnia", 62.0, 20.0, 36, 3),
    ("adriatic", "Adriatisches Meer", "Adriatic Sea", 43.2, 15.2, 34, 2),
    ("aegean", "Ägäisches Meer", "Aegean Sea", 38.6, 25.0, 32, 2),
    ("tyrrhenian", "Tyrrhenisches Meer", "Tyrrhenian Sea", 39.8, 12.2, 32, 3),
    ("ionian", "Ionisches Meer", "Ionian Sea", 37.8, 18.5, 32, 3),
    ("irishsea", "Irische See", "Irish Sea", 53.6, -5.0, 26, 3),
    ("channel", "Ärmelkanal", "English Channel", 50.0, -1.5, 28, 2),
    ("skagerrak", "Skagerrak", "Skagerrak", 57.8, 9.0, 26, 3),
    ("gibraltar", "Straße von Gibraltar", "Strait of Gibraltar", 35.95, -5.6, 22, 3),
    ("azov", "Asowsches Meer", "Sea of Azov", 46.0, 36.5, 26, 3),
]

# Rivers. Natural Earth 50m carries only the large ones, and it splits several
# of them across language variants and delta arms, so each river is matched by a
# set of names rather than one. Rivers the 50m file simply does not have (Weser,
# Main, Meuse, Tiber, Shannon, Guadalquivir, Neman) are therefore not asked for.
RIVERS = [
    # (id, German, English, tier, Natural Earth names that belong to it)
    ("danube", "Donau", "Danube", 1,
     {"Danube", "Donau", "Borcea", "Soroksari Duna",
      "Bratul Chillia", "Bratul Sfintu Gheorghe", "Bratul Sulina"}),
    ("rhine", "Rhein", "Rhine", 1,
     {"Rhine", "Rhein", "Rhin", "Nederrijn", "Lek", "Waal"}),
    ("elbe", "Elbe", "Elbe", 2, {"Elbe"}),
    ("oder", "Oder", "Oder", 2, {"Oder"}),
    ("vistula", "Weichsel", "Vistula", 2, {"Vistula"}),
    ("loire", "Loire", "Loire", 2, {"Loire"}),
    ("seine", "Seine", "Seine", 1, {"Seine"}),
    ("rhone", "Rh\u00f4ne", "Rh\u00f4ne", 1, {"Rh\u00f4ne"}),
    ("garonne", "Garonne", "Garonne", 3, {"Garonne", "Ari\u00e8ge"}),
    ("po", "Po", "Po", 2, {"Po"}),
    ("ebro", "Ebro", "Ebro", 2, {"Ebro"}),
    ("tagus", "Tejo", "Tagus", 2, {"Tejo", "Tajo"}),
    ("douro", "Duero", "Douro", 3, {"Duero"}),
    ("thames", "Themse", "Thames", 1, {"Thames"}),
    ("dnieper", "Dnepr", "Dnieper", 2, {"Dnipro", "Dnepre"}),
    ("don", "Don", "Don", 3, {"Don"}),
    ("volga", "Wolga", "Volga", 1, {"Volga"}),
    ("dniester", "Dnestr", "Dniester", 3, {"Dniester"}),
    ("daugava", "D\u00fcna", "Daugava", 3, {"Daugava"}),
    ("neva", "Newa", "Neva", 3, {"Neva"}),
    ("tisza", "Thei\u00df", "Tisza", 3, {"Tisza", "Tisa"}),
    ("drava", "Drau", "Drava", 3, {"Drava"}),
    ("glomma", "Glomma", "Glomma", 3, {"Glomma"}),
    ("gota", "G\u00f6ta \u00e4lv", "G\u00f6ta \u00e4lv", 3, {"G\u00f6ta \u00e4lv"}),
    ("kemijoki", "Kemijoki", "Kemijoki", 3, {"Kemijoki"}),
    ("sevdvina", "N\u00f6rdliche Dwina", "Northern Dvina", 3, {"Severnaya Dvina"}),
]

MOUNTAINS = [
    # (id, German, English, tier, ridge as (lat, lon) points)
    ("alps", "Alpen", "Alps", 1, "h\u00f6chstes Gebirge Mitteleuropas", "the highest range in central Europe", [
        (44.2, 6.9), (45.0, 7.1), (45.9, 7.7), (46.5, 8.6),
        (46.8, 10.0), (47.0, 11.4), (47.2, 13.0), (47.3, 14.6)]),
    ("pyrenees", "Pyrenäen", "Pyrenees", 1, "Grenze zwischen Spanien und Frankreich", "the border between Spain and France", [
        (42.5, -1.6), (42.8, -0.5), (42.6, 0.7), (42.5, 1.6), (42.4, 2.6)]),
    ("carpathians", "Karpaten", "Carpathians", 1, "Bogen durch die Slowakei, Ukraine und Rum\u00e4nien", "an arc through Slovakia, Ukraine and Romania", [
        (49.3, 19.0), (49.0, 21.0), (48.2, 23.5), (47.5, 25.0),
        (46.5, 25.5), (45.6, 25.0), (45.2, 23.0), (45.4, 22.0)]),
    ("scandes", "Skanden", "Scandinavian Mountains", 2, "R\u00fcckgrat von Norwegen und Schweden", "the spine of Norway and Sweden", [
        (58.9, 7.0), (60.5, 8.0), (62.0, 10.0), (64.0, 13.5),
        (66.5, 15.5), (68.3, 18.5), (69.4, 21.0)]),
    ("apennines", "Apennin", "Apennines", 2, "R\u00fcckgrat Italiens", "the spine of Italy", [
        (44.3, 8.5), (43.5, 11.0), (42.5, 13.0), (41.5, 14.5),
        (40.0, 16.0), (38.8, 16.4)]),
    ("dinarides", "Dinarisches Gebirge", "Dinaric Alps", 3, "entlang der Adriak\u00fcste", "along the Adriatic coast", [
        (46.3, 14.5), (45.3, 16.0), (44.3, 17.0), (43.2, 18.3), (42.3, 19.4)]),
    ("balkan", "Balkangebirge", "Balkan Mountains", 3, "quer durch Bulgarien", "straight across Bulgaria", [
        (43.2, 22.6), (42.8, 24.0), (42.8, 25.5), (42.9, 27.0)]),
    ("caucasus", "Kaukasus", "Caucasus", 2, "mit dem Elbrus, 5642 m", "home of Mount Elbrus, 5642 m", [
        (43.4, 40.5), (43.2, 42.0), (42.9, 43.5), (42.2, 45.3)]),
    ("sierranevada", "Sierra Nevada", "Sierra Nevada", 3, "S\u00fcdspanien", "southern Spain", [
        (37.0, -3.6), (37.1, -3.0), (37.2, -2.5)]),
    ("massifcentral", "Zentralmassiv", "Massif Central", 3, "Hochland in der Mitte Frankreichs", "upland in the middle of France", [
        (45.8, 2.4), (45.2, 3.1), (44.6, 3.6)]),
]

LANDFORMS = [
    # (id, German, English, lat, lon, radius, tier, kind)
    ("sicily", "Sizilien", "Sicily", 37.6, 14.0, 26, 1, "island"),
    ("sardinia", "Sardinien", "Sardinia", 40.1, 9.1, 24, 2, "island"),
    ("corsica", "Korsika", "Corsica", 42.1, 9.1, 20, 2, "island"),
    ("crete", "Kreta", "Crete", 35.2, 24.9, 22, 2, "island"),
    ("mallorca", "Mallorca", "Mallorca", 39.6, 3.0, 18, 2, "island"),
    ("gotland", "Gotland", "Gotland", 57.5, 18.5, 18, 3, "island"),
    ("ruegen", "R\u00fcgen", "R\u00fcgen", 54.4, 13.4, 16, 3, "island"),
    ("iberia", "Iberische Halbinsel", "Iberian Peninsula", 40.0, -4.0, 70, 1, "peninsula"),
    ("apennine", "Apenninenhalbinsel", "Apennine Peninsula", 42.5, 13.0, 45, 2, "peninsula"),
    ("balkan", "Balkanhalbinsel", "Balkan Peninsula", 42.5, 21.5, 55, 2, "peninsula"),
    ("scandinavia", "Skandinavische Halbinsel", "Scandinavian Peninsula", 63.0, 15.0, 70, 1, "peninsula"),
    ("jutland", "Jütland", "Jutland", 56.2, 9.4, 24, 2, "peninsula"),
    ("crimea", "Krim", "Crimea", 45.3, 34.2, 22, 2, "peninsula"),
    ("peloponnese", "Peloponnes", "Peloponnese", 37.3, 22.2, 20, 3, "peninsula"),
    ("brittany", "Bretagne", "Brittany", 48.2, -3.2, 22, 3, "peninsula"),
    ("kola", "Halbinsel Kola", "Kola Peninsula", 67.6, 36.0, 26, 3, "peninsula"),
]

SITES = [
    # (id, German, English, lat, lon, tier, German note, English note)
    ("eiffel", "Eiffelturm", "Eiffel Tower", 48.858, 2.294, 1, "Paris, Frankreich", "Paris, France"),
    ("colosseum", "Kolosseum", "Colosseum", 41.890, 12.492, 1, "Rom, Italien", "Rome, Italy"),
    ("acropolis", "Akropolis", "Acropolis", 37.971, 23.726, 1, "Athen, Griechenland", "Athens, Greece"),
    ("brandenburg", "Brandenburger Tor", "Brandenburg Gate", 52.516, 13.378, 1, "Berlin, Deutschland", "Berlin, Germany"),
    ("stonehenge", "Stonehenge", "Stonehenge", 51.179, -1.826, 2, "S\u00fcdengland", "southern England"),
    ("sagrada", "Sagrada Família", "Sagrada Família", 41.404, 2.174, 2, "Barcelona, Spanien", "Barcelona, Spain"),
    ("pisa", "Schiefer Turm von Pisa", "Leaning Tower of Pisa", 43.723, 10.396, 2, "Pisa, Italien", "Pisa, Italy"),
    ("vesuvius", "Vesuv", "Mount Vesuvius", 40.821, 14.426, 2, "Vulkan bei Neapel", "a volcano near Naples"),
    ("etna", "Ätna", "Mount Etna", 37.751, 14.993, 2, "h\u00f6chster aktiver Vulkan Europas, Sizilien", "Europe's tallest active volcano, Sicily"),
    ("montblanc", "Mont Blanc", "Mont Blanc", 45.833, 6.865, 1, "4808 m, h\u00f6chster Berg der Alpen", "4808 m, the highest peak of the Alps"),
    ("matterhorn", "Matterhorn", "Matterhorn", 45.976, 7.658, 2, "4478 m, Schweiz und Italien", "4478 m, Switzerland and Italy"),
    ("nordkapp", "Nordkap", "North Cape", 71.170, 25.784, 2, "Nordnorwegen, 71\u00b0 N", "northern Norway, 71\u00b0 N"),
    ("gibraltarrock", "Fels von Gibraltar", "Rock of Gibraltar", 36.144, -5.342, 3, "am Tor zum Mittelmeer", "at the gate to the Mediterranean"),
    ("neuschwanstein", "Schloss Neuschwanstein", "Neuschwanstein Castle", 47.558, 10.750, 2, "Bayern, Deutschland", "Bavaria, Germany"),
    ("kremlin", "Kreml", "Kremlin", 55.752, 37.617, 2, "Moskau, Russland", "Moscow, Russia"),
    ("geysir", "Geysir", "Geysir", 64.313, -20.300, 3, "Island, Namensgeber aller Geysire", "Iceland, the geyser all others are named after"),
]


# ------------------------------------------------------------------ builder

def build(indir):
    topo = json.load(open(os.path.join(indir, "countries-50m.json")))
    arcs = decode_arcs(topo)

    wanted = dict(COUNTRIES)
    context = set(CONTEXT_COUNTRIES)
    shapes, quiz_countries = [], []

    for geom in topo["objects"]["countries"]["geometries"]:
        name = geom["properties"]["name"]
        is_quiz = name in wanted
        if not is_quiz and name not in context:
            continue
        rings = []
        for ring in geometry_rings(geom, arcs):
            lons = [c[0] for c in ring]
            if max(lons) - min(lons) > 180.0:
                # The ring crosses the antimeridian, which Russia's does.
                # Unwrapping the longitudes makes it a single interval again,
                # and the clip below then keeps only its European end.
                ring = [((lon + 360.0 if lon < 0 else lon), lat)
                        for lon, lat in ring]
            geo = clip_polygon(ring, GEO_CLIP)
            if len(geo) < 3:
                continue
            projected = [to_svg(lon, lat) for lon, lat in geo]
            clipped = clip_polygon(projected, CLIP)
            if len(clipped) < 3:
                continue
            simple = simplify(clipped, 0.45)
            if len(simple) >= 3 and ring_area(simple) > 1.5:
                rings.append(simple)
        if not rings:
            continue
        rings.sort(key=ring_area, reverse=True)
        cid = wanted[name][0] if is_quiz else "ctx-" + name.lower().replace(" ", "-").replace(".", "")
        shapes.append({"id": cid, "d": path_d(rings), "q": 1 if is_quiz else 0})
        if is_quiz:
            _, de, en, tier = wanted[name]
            lp = label_point(rings[0])
            # A country the size of Luxembourg is a few pixels wide on a
            # phone, so the applet is told how big it is and grants small
            # countries a tolerance around their label point.
            area = sum(ring_area(r) for r in rings)
            quiz_countries.append({
                "id": "c-" + cid, "cat": "country", "de": de, "en": en,
                "tier": tier, "lab": [round(lp[0], 1), round(lp[1], 1)],
                "t": {"k": "poly", "ref": cid, "a": round(area)},
            })

    # ------------------------------------------------------------- rivers
    rivers_ctx, quiz_rivers = [], {}
    river_of = {}
    for rid, _de, _en, _tier, names in RIVERS:
        for n in names:
            river_of[n] = rid
    rj = json.load(open(os.path.join(indir, "ne_50m_rivers_lake_centerlines.geojson")))
    for feat in rj["features"]:
        props = feat["properties"]
        name = (props.get("name") or "").strip()
        if name not in river_of:
            name = (props.get("name_en") or "").strip() or name
        geo = feat["geometry"]
        if not geo:
            continue
        lines = ([geo["coordinates"]] if geo["type"] == "LineString"
                 else geo["coordinates"])
        pieces = []
        for line in lines:
            projected = [to_svg(c[0], c[1]) for c in line
                         if GEO_CLIP[0] <= c[0] <= GEO_CLIP[2]
                         and GEO_CLIP[1] <= c[1] <= GEO_CLIP[3]]
            for piece in clip_line(projected, CLIP):
                simple = simplify(piece, 0.5)
                if len(simple) >= 2:
                    pieces.append(simple)
        if not pieces:
            continue
        if name in river_of:
            quiz_rivers.setdefault(river_of[name], []).extend(pieces)
        else:
            rivers_ctx.extend(pieces)

    river_items = []
    for rid, de, en, tier, _names in RIVERS:
        pieces = quiz_rivers.get(rid)
        if not pieces:
            sys.stderr.write("  note: river not in the 50m data: %s\n" % en)
            continue
        pieces.sort(key=len, reverse=True)
        main = pieces[0]
        # Every branch counts as the same river for the hit test. A [null, null]
        # entry is a pen lift: the applet must not measure across the gap.
        pts = []
        for i, piece in enumerate(pieces):
            if i:
                pts.append([None, None])
            pts.extend([round(x, 1), round(y, 1)] for x, y in simplify(piece, 1.5))
        river_items.append({
            "id": "r-" + rid, "cat": "river", "de": de, "en": en, "tier": tier,
            "hl": line_d(pieces),
            "lab": [round(main[len(main) // 2][0], 1),
                    round(main[len(main) // 2][1], 1)],
            "t": {"k": "line", "r": 13, "pts": pts},
        })

    # -------------------------------------------------------------- lakes
    lakes = []
    lj = json.load(open(os.path.join(indir, "ne_50m_lakes.geojson")))
    for feat in lj["features"]:
        geo = feat["geometry"]
        if not geo:
            continue
        polys = ([geo["coordinates"]] if geo["type"] == "Polygon"
                 else geo["coordinates"])
        for poly in polys:
            geo = clip_polygon([(c[0], c[1]) for c in poly[0]], GEO_CLIP)
            if len(geo) < 3:
                continue
            projected = [to_svg(lon, lat) for lon, lat in geo]
            clipped = clip_polygon(projected, CLIP)
            if len(clipped) < 3:
                continue
            simple = simplify(clipped, 0.5)
            if len(simple) >= 3 and ring_area(simple) > 4.0:
                lakes.append(simple)

    # ------------------------------------------------------- curated items
    items = list(quiz_countries) + river_items
    marks = {"capital": [], "site": [], "ridge": []}

    capital_of = {}
    for cid, de, en, lat, lon, tier, country in CAPITALS:
        x, y = to_svg(lon, lat)
        marks["capital"].append([round(x, 1), round(y, 1)])
        capital_of[country] = (de, en)
        items.append({"id": "p-" + cid, "cat": "capital", "de": de, "en": en,
                      "tier": tier, "lab": [round(x, 1), round(y, 1)],
                      "of": country,
                      "t": {"k": "pt", "x": round(x, 1), "y": round(y, 1), "r": 17}})

    # A country and its capital each carry the other as their note, so a right
    # answer always teaches the pair rather than the single name.
    for item in quiz_countries:
        pair = capital_of.get(item["t"]["ref"])
        if pair:
            item["nde"], item["nen"] = ("Hauptstadt: " + pair[0],
                                        "capital: " + pair[1])
    for item in items:
        if item["cat"] == "capital":
            for country in quiz_countries:
                if country["t"]["ref"] == item["of"]:
                    item["nde"] = "Hauptstadt von " + country["de"]
                    item["nen"] = "capital of " + country["en"]

    # "on" says whether the drop also has to land on the right side of the
    # coastline: a sea is water, an island is not. Without it, dropping "Baltic
    # Sea" onto Gotland would count, which is the opposite of the lesson.
    for wid, de, en, lat, lon, radius, tier in WATERS:
        x, y = to_svg(lon, lat)
        items.append({"id": "w-" + wid, "cat": "water", "de": de, "en": en,
                      "tier": tier, "lab": [round(x, 1), round(y, 1)],
                      "t": {"k": "pt", "x": round(x, 1), "y": round(y, 1),
                            "r": radius, "on": "water"}})

    for iid, de, en, lat, lon, radius, tier, kind in LANDFORMS:
        x, y = to_svg(lon, lat)
        items.append({"id": "i-" + iid, "cat": "landform", "kind": kind,
                      "de": de, "en": en,
                      "tier": tier, "lab": [round(x, 1), round(y, 1)],
                      "t": {"k": "pt", "x": round(x, 1), "y": round(y, 1),
                            "r": radius, "on": "land"}})

    for sid, de, en, lat, lon, tier, nde, nen in SITES:
        x, y = to_svg(lon, lat)
        marks["site"].append([round(x, 1), round(y, 1)])
        items.append({"id": "s-" + sid, "cat": "site", "de": de, "en": en,
                      "tier": tier, "lab": [round(x, 1), round(y, 1)],
                      "nde": nde, "nen": nen,
                      "t": {"k": "pt", "x": round(x, 1), "y": round(y, 1), "r": 19}})

    for mid, de, en, tier, nde, nen, ridge in MOUNTAINS:
        pts = [to_svg(lon, lat) for lat, lon in ridge]
        marks["ridge"].append([[round(x, 1), round(y, 1)] for x, y in pts])
        mid_pt = pts[len(pts) // 2]
        items.append({"id": "m-" + mid, "cat": "mountain", "de": de, "en": en,
                      "tier": tier,
                      "lab": [round(mid_pt[0], 1), round(mid_pt[1], 1)],
                      "nde": nde, "nen": nen,
                      "hl": line_d([pts]),
                      "t": {"k": "line", "r": 20,
                            "pts": [[round(x, 1), round(y, 1)] for x, y in pts]}})

    return {
        "view": [round(OUT_W, 1), OUT_H],
        "shapes": shapes,
        "rivers": line_d(rivers_ctx),
        "lakes": path_d(lakes),
        "marks": marks,
        "items": items,
    }


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        return 2
    indir = sys.argv[1]
    out = (sys.argv[2] if len(sys.argv) > 2
           else os.path.join("static", "media", "europe-blind-map", "map.json"))
    data = build(indir)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    by_cat = {}
    for item in data["items"]:
        by_cat[item["cat"]] = by_cat.get(item["cat"], 0) + 1
    sys.stderr.write("view %s x %s, %d shapes, %d items %s -> %s (%.0f kB)\n" % (
        data["view"][0], data["view"][1], len(data["shapes"]),
        len(data["items"]), by_cat, out, os.path.getsize(out) / 1024.0))
    return 0


if __name__ == "__main__":
    sys.exit(main())
