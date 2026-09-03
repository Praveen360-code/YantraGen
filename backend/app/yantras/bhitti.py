"""Bhitti Yantra (mural quadrant) computation module.

The *Bhitti-yantra* ("wall instrument") described in the Siddhanta tradition is
a **mural quadrant**: a fixed vertical quarter-arc graduated in degrees, set
into a wall, used to measure the **altitude** and **zenith distance** of a
celestial body as it crosses the local meridian.  It is the classical, more
portable cousin of the built meridian wall (Dakshinottara Bhitti).

Because the arc lies in (or is aligned to) the meridian plane, the noon /
meridian passage of the Sun directly yields

    meridian altitude   a = 90 - phi + delta
    zenith distance     z = 90 - a   =  phi - delta

so a single noon reading fixes that day's solar **declination**:

    delta = a - (90 - phi)

Geometry of the quadrant: a quarter-circle of radius R on right-angled sides
(hypotenuse-like chord between the two straight edges):

    arc length   = pi * R / 2
    side length  = R  (each straight arm)
    chord        = R * sqrt(2)

The size parameter is the arc radius R.

Reference / context: Bhaskaracharya, Siddhanta Shiromani (mural quadrant);
standard meridian-observation relations (Roy & Clarke).  Educational tool --
not for precision measurement.
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import arc, line, text, unscale, wrap_svg

_O = 23.44


class BhittiYantra(Yantra):
    """Mural quadrant: a vertical quarter-arc measuring altitude / zenith distance."""

    type_name = "bhitti"
    display_name = "Bhitti Yantra (Mural Quadrant)"
    description = (
        "A graduated vertical quarter-arc set in a wall, measuring the altitude "
        "and zenith distance of bodies at meridian passage -- yielding the "
        "day's solar declination."
    )
    required_params = ["arc_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("arc_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        noon_equiv = 90.0 - phi
        noon_sum = 90.0 - phi + _O
        noon_win = 90.0 - phi - _O
        decl_equiv = 0.0
        decl_sum = _O
        decl_win = -_O

        values = [
            GeometryValue(
                key="arc_radius",
                label="Quadrant arc radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius of the mural quadrant arc.",
            ),
            GeometryValue(
                key="arc_length",
                label="Quadrant arc length",
                value=unscale(math.pi * R / 2.0, unit),
                unit=unit_label,
                formula="pi * R / 2",
                reference="A quarter of the circumference.",
            ),
            GeometryValue(
                key="chord_length",
                label="Side chord between arc ends",
                value=unscale(R * math.sqrt(2.0), unit),
                unit=unit_label,
                formula="R * sqrt(2)",
                reference="Right-angled arms of the quadrant.",
            ),
            GeometryValue(
                key="altitude_span",
                label="Altitude scale span",
                value=90.0,
                unit="deg",
                formula="0..90 deg",
                reference="Reads altitude directly; zenith distance = 90 - a.",
            ),
            GeometryValue(
                key="noon_altitude_equinox",
                label="Meridian altitude at equinox",
                value=round(noon_equiv, 3),
                unit="deg",
                formula="90 - phi (delta = 0)",
                reference="Roy & Clarke; meridian altitude relation.",
            ),
            GeometryValue(
                key="noon_altitude_summer",
                label="Meridian altitude at summer solstice",
                value=round(noon_sum, 3),
                unit="deg",
                formula="90 - phi + 23.44",
                reference="Meridian altitude at delta = +23.44.",
            ),
            GeometryValue(
                key="noon_altitude_winter",
                label="Meridian altitude at winter solstice",
                value=round(noon_win, 3),
                unit="deg",
                formula="90 - phi - 23.44",
                reference="Meridian altitude at delta = -23.44.",
            ),
            GeometryValue(
                key="noon_declination_equinox",
                label="Noon declination at equinox",
                value=decl_equiv,
                unit="deg",
                formula="a - (90 - phi)",
                reference="A noon reading determines the day's declination.",
            ),
            GeometryValue(
                key="noon_declination_summer",
                label="Noon declination at summer solstice",
                value=decl_sum,
                unit="deg",
                formula="+23.44",
                reference="From the observed meridian altitude.",
            ),
            GeometryValue(
                key="noon_declination_winter",
                label="Noon declination at winter solstice",
                value=decl_win,
                unit="deg",
                formula="-23.44",
                reference="From the observed meridian altitude.",
            ),
        ]

        svg = _build_svg(R=R, phi=phi, noon_equiv=noon_equiv, noon_sum=noon_sum, noon_win=noon_win, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "arc_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational reconstruction based on the classical mural "
                    "quadrant description (Bhaskaracharya); not for precision measurement."
                ),
                "references": [
                    "Bhaskaracharya, Siddhanta Shiromani (mural quadrant).",
                    "Roy & Clarke, Astronomy: Principles and Practice (meridian altitude).",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, noon_equiv: float, noon_sum: float, noon_win: float, unit: str) -> dict:
    """Front view of the mural quadrant (a vertical quarter-arc)."""
    scale = 22.0
    pad = 42.0
    r = R * scale
    cx = r + pad          # the right-angle corner of the quadrant
    cy = r + pad

    parts = [
        # the two right-angled arms
        line(cx, cy, cx + r, cy, "#7f8c8d", 4),   # horizontal arm
        line(cx, cy, cx, cy - r, "#7f8c8d", 4),   # vertical arm
        # the quarter arc (from horizontal to vertical)
        arc(cx, cy, r, 0, 90, "#2980b9", 4),
    ]
    # altitude ticks every 10 deg: altitude increases left->up from horizontal arm
    for alt in range(0, 91, 10):
        a = math.radians(alt)
        x0 = cx + r * math.cos(a)
        y0 = cy - r * math.sin(a)
        x1 = cx + (r - 0.06 * r) * math.cos(a)
        y1 = cy - (r - 0.06 * r) * math.sin(a)
        parts.append(line(x0, y0, x1, y1, "#34495e", 2 if alt % 30 == 0 else 1))
        lx = cx + (r + 12) * math.cos(a)
        ly = cy - (r + 12) * math.sin(a)
        parts.append(text(lx, ly, str(alt), size=9, fill="#2c3e50"))

    # mark the noon altitudes
    for alt, lab, col in [(noon_equiv, "E", "#27ae60"), (noon_sum, "S+", "#c0392b"), (noon_win, "S-", "#8e44ad")]:
        alt = max(0, min(90, alt))
        a = math.radians(alt)
        parts.append(text(cx + (r - 14) * math.cos(a), cy - (r - 14) * math.sin(a) - 4,
                          f"{lab} {alt:.1f}°", size=9, fill=col))
        # small tick on the arc
        bx = cx + r * math.cos(a)
        by = cy - r * math.sin(a)
        parts.append(line(bx, by, cx + (r - 4) * math.cos(a), cy - (r - 4) * math.sin(a), col, 2))

    parts.append(text(cx + r / 2, cy + r + 26, f"BHITTI (mural quadrant) — φ = {phi:.1f}°",
                      size=12, fill="#1a5276"))
    view_w = 2 * r + 2 * pad
    view_h = r + 2 * pad + 14
    return {"elevation": wrap_svg(view_w, view_h, "".join(parts))}
