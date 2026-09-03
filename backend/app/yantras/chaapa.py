"""Chaapa Yantra (bow / graduated arc instrument).

From the classical (Siddhanta) instrument tradition, the "chaapa" (bow) is a
graduated arc shaped like a bow: a vertical semicircular arc whose horizontal
chord (the bowstring) rests level, with the arc drawn in the meridian plane.
A movable sight / plumb reads the sun's altitude (0..90 deg along the arc),
hence the zenith distance.

The size parameter is the arc radius R:

    bowstring (chord) length  = 2R
    semicircular arc length   = pi * R

Because the arc lies in the meridian plane, at local noon it shows the
*meridian altitude*, which for a given site latitude phi and solar declination
delta is

    a_noon = 90 - phi + delta

This mirrors the Dakshinottara Bhitti but as a freestanding, portable frame.

Reference / context: classical instrument descriptions in the Yantra
literature (Siddhanta shiromani tradition); the meridian-altitude relation is
standard spherical astronomy (Roy & Clarke).  Reconstruction for education --
not for precision timekeeping.
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import arc, circle, line, text, unscale, wrap_svg

_O = 23.44


class ChaapaYantra(Yantra):
    """Bow-shaped graduated arc for measuring solar altitude."""

    type_name = "chaapa"
    display_name = "Chaapa Yantra"
    description = (
        "Bow instrument: a graduated vertical semicircular arc on a horizontal "
        "chord that measures solar altitude and zenith distance."
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

        values = [
            GeometryValue(
                key="arc_radius",
                label="Arc radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius of the graduated bow arc.",
            ),
            GeometryValue(
                key="chord_length",
                label="Bowstring (chord) length",
                value=unscale(2 * R, unit),
                unit=unit_label,
                formula="2R",
                reference="Horizontal chord of the semicircular arc.",
            ),
            GeometryValue(
                key="arc_length",
                label="Semicircular arc length",
                value=unscale(math.pi * R, unit),
                unit=unit_label,
                formula="pi * R",
                reference="Length of the graduated semicircle.",
            ),
            GeometryValue(
                key="altitude_span",
                label="Altitude scale span",
                value=90.0,
                unit="deg",
                formula="0..90 deg",
                reference="Reads solar altitude / zenith distance on the arc.",
            ),
            GeometryValue(
                key="noon_altitude_equinox",
                label="Noon altitude at equinox",
                value=round(noon_equiv, 3),
                unit="deg",
                formula="90 - phi",
                reference="Meridian altitude, delta = 0 (Roy & Clarke).",
            ),
            GeometryValue(
                key="noon_altitude_summer",
                label="Noon altitude at summer solstice",
                value=round(noon_sum, 3),
                unit="deg",
                formula="90 - phi + 23.44",
                reference="Meridian altitude, delta = +23.44.",
            ),
            GeometryValue(
                key="noon_altitude_winter",
                label="Noon altitude at winter solstice",
                value=round(noon_win, 3),
                unit="deg",
                formula="90 - phi - 23.44",
                reference="Meridian altitude, delta = -23.44.",
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
                    "Educational reconstruction based on classical instrument "
                    "descriptions; not for precision timekeeping."
                ),
                "references": [
                    "Classical Siddhanta instrument descriptions (Yantra tradition).",
                    "A.E. Roy & D. Clarke, Astronomy: Principles and Practice.",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, noon_equiv: float, noon_sum: float, noon_win: float, unit: str) -> dict:
    """Elevation of the bow: a vertical semicircular arc on a horizontal chord."""
    scale = 20.0
    pad = 40.0
    r = R * scale
    cx = r + pad
    cy = r + pad  # centre; chord lies along the bottom (y = cy)

    lines = []
    # chord (bowstring)
    lines.append(line(pad, cy, cx + r, cy, "#7f8c8d", 4))
    # the bow arc (upper semicircle)
    lines.append(arc(cx, cy, r, 180, 0, "#2980b9", 4))
    # radial altitude ticks every 10 deg (altitude measured up from chord)
    for alt in range(0, 91, 10):
        a = math.radians(alt)
        x0 = cx + r * math.cos(a)
        y0 = cy + r * math.sin(a)
        x1 = cx + (r - 0.06 * r) * math.cos(a)
        y1 = cy + (r - 0.06 * r) * math.sin(a)
        lines.append(line(x0, y0, x1, y1, "#34495e", 2 if alt % 30 == 0 else 1))
        lx = cx + (r + 12) * math.cos(a)
        ly = cy + (r + 12) * math.sin(a)
        anchor = "middle" if abs(math.cos(a)) < 0.3 else ("start" if math.cos(a) > 0 else "end")
        lines.append(text(lx, ly, str(alt), size=9, fill="#2c3e50", anchor=anchor))

    # mark the noon altitudes
    for alt, lab, col in [(noon_equiv, "E", "#27ae60"), (noon_sum, "S+", "#c0392b"), (noon_win, "S-", "#8e44ad")]:
        alt = max(0, min(90, alt))
        a = math.radians(alt)
        lines.append(circle(cx + r * math.cos(a), cy + r * math.sin(a), 4, col, col, 1))
        lines.append(text(cx + (r - 14) * math.cos(a), cy + (r - 14) * math.sin(a) - 4,
                          f"{lab} {alt:.1f}°", size=9, fill=col))

    lines.append(text(cx, cy - r - 12, f"CHAAPA (bow) — φ = {phi:.1f}°", size=12, fill="#1a5276"))
    view_w = 2 * r + 2 * pad
    view_h = r + 2 * pad + 10
    return {"elevation": wrap_svg(view_w, view_h, "".join(lines))}
