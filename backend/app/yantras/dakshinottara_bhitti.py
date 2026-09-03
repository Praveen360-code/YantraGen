"""Dakshinottara Bhitti Yantra (meridian wall instrument).

A vertical wall lying in the meridian (north-south) plane, with the scaled
face on its south side.  A vertical semicircular arc of radius R (equal to the
wall height) is drawn on the wall, centred on a central pin/gnomon; the arc is
graduated in degrees of altitude / zenith distance.  At local noon the sun
culminates on the meridian, so the instrument directly measures the *meridian
(noon) altitude*, from which the solar declination follows:

    a_noon = 90 - phi + delta        (meridian altitude)
      => delta = a_noon - (90 - phi)

where phi is the observer latitude and delta the solar declination.

Key solstice / equinox markers are at:
    equinox       delta = 0        ->  a = 90 - phi
    summer solstice delta = +e     ->  a = 90 - phi + e
    winter solstice delta = -e     ->  a = 90 - phi - e
with e = 23.44 deg (obliquity).

Reference: G.R. Kaye, *A Guide to the Old Observatories*; V.N. Sharma,
*Sawai Jai Singh and His Astronomy* (meridian-wall instrument); the meridian
altitude - declination relation is standard spherical astronomy (Roy & Clarke).

Educational reconstruction (not for precision timekeeping).
"""

from __future__ import annotations

import math

from ..core import trig
from .base import GeometryValue, Yantra, YantraSpec
from .drawing import arc, circle, line, text, unscale, wrap_svg

_OBLIQUITY = 23.44


class DakshinottaraBhittiYantra(Yantra):
    """Meridian wall instrument for noon altitude / solar declination."""

    type_name = "dakshinottara_bhitti"
    display_name = "Dakshinottara Bhitti Yantra"
    description = (
        "Meridian wall instrument: a vertical north-south wall with a graduated "
        "semicircular arc that measures the noon altitude and thus the sun's declination."
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

        R = float(size_param)  # arc radius == wall height, metres
        phi = float(lat)

        noon_equiv = 90.0 - phi
        noon_summer = 90.0 - phi + _OBLIQUITY
        noon_winter = 90.0 - phi - _OBLIQUITY
        unit_label = "m" if unit == "m" else "ft"

        values = [
            GeometryValue(
                key="arc_radius",
                label="Arc radius (and wall height)",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Meridian wall radius; Sharma / Kaye.",
            ),
            GeometryValue(
                key="zenith_span",
                label="Zenith-distance scale span",
                value=90.0,
                unit="deg",
                formula="0..90 deg from zenith to horizon",
                reference="Vertical semicircular scale measures altitude/zenith distance.",
            ),
            GeometryValue(
                key="noon_altitude_equinox",
                label="Noon altitude at equinox",
                value=round(noon_equiv, 3),
                unit="deg",
                formula="90 - phi",
                reference="Sun's meridian altitude when delta = 0 (Roy & Clarke).",
            ),
            GeometryValue(
                key="noon_altitude_summer",
                label="Noon altitude at summer solstice",
                value=round(noon_summer, 3),
                unit="deg",
                formula="90 - phi + 23.44",
                reference="delta = +23.44 deg (obliquity) at summer solstice.",
            ),
            GeometryValue(
                key="noon_altitude_winter",
                label="Noon altitude at winter solstice",
                value=round(noon_winter, 3),
                unit="deg",
                formula="90 - phi - 23.44",
                reference="delta = -23.44 deg at winter solstice.",
            ),
            GeometryValue(
                key="declination_factor",
                label="Declination-to-altitude shift factor",
                value=round(90.0 - phi, 3),
                unit="deg",
                formula="delta = a_noon - (90 - phi)",
                reference="Standard meridian-altitude relation (Roy & Clarke).",
            ),
        ]

        svg = _build_svg(
            phi=phi, R=R, noon_equiv=noon_equiv, noon_sum=noon_summer, noon_win=noon_winter, unit=unit
        )

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
                    "Educational / research tool. The declination values assume a "
                    "mean obliquity of 23.44 deg; not for precision timekeeping."
                ),
                "references": [
                    "G.R. Kaye, A Guide to the Old Observatories at Delhi, Jaipur, Ujjain, Benares.",
                    "Virendra N. Sharma, Sawai Jai Singh and His Astronomy.",
                ],
            },
        )
        return spec


def _build_svg(*, phi: float, R: float, noon_equiv: float, noon_sum: float, noon_win: float, unit: str) -> dict:
    """Assemble the meridian-wall SVG: a vertical semicircular graduated arc."""
    scale = 20.0  # px per metre
    pad = 34.0
    r = R * scale
    cx = r + pad
    cy = r + pad  # arc centre near top-left of the drawing (wall is tall)

    lines = []
    # draw the meridian wall background rectangle
    lines.append(
        f'<rect x="{pad:.1f}" y="{pad:.1f}" width="{2*r:.1f}" height="{2*r:.1f}" '
        f'fill="#dfe8f5" stroke="#7f8c8d" stroke-width="2"/>'
    )
    # the semicircular arc (upper semicircle of the scale) - altitude from horizon(0) at bottom
    lines.append(arc(cx, cy, r, 180, 0, "#2980b9", 4))
    # horizontal horizon line across the bottom
    lines.append(line(pad, cy, cx + r, cy, "#7f8c8d", 2))

    # radial altitude ticks every 10 degrees, measured from the horizon (bottom) upward
    for alt in range(0, 91, 10):
        a = math.radians(alt)
        x0 = cx + r * math.cos(a)
        y0 = cy + r * math.sin(a)
        x1 = cx + (r - 0.06 * R * scale) * math.cos(a)
        y1 = cy + (r - 0.06 * R * scale) * math.sin(a)
        lines.append(line(x0, y0, x1, y1, "#34495e", 2 if alt % 30 == 0 else 1))
        # label the altitude at the tick, offset outward
        lx = cx + (r + 14) * math.cos(a)
        ly = cy + (r + 14) * math.sin(a)
        anchor = "middle" if abs(math.cos(a)) < 0.3 else ("start" if math.cos(a) > 0 else "end")
        lines.append(text(lx, ly, str(alt), size=9, fill="#2c3e50", anchor=anchor))

    # mark the equinox and solstice noon altitudes on the scale (they sit on the arc)
    marks = [
        (noon_equiv, "E", "#27ae60"),
        (noon_sum, "S+", "#c0392b"),
        (noon_win, "S-", "#8e44ad"),
    ]
    for alt, label, col in marks:
        alt = max(0, min(90, alt))
        a = math.radians(alt)
        mx = cx + r * math.cos(a)
        my = cy + r * math.sin(a)
        lines.append(circle(mx, my, 4, col, col, 1))
        lines.append(text(mx - 12, my - 12, f"{label} {alt:.1f}°", size=9, fill=col, anchor="end"))

    # title
    lines.append(text(cx, pad + 12, f"Meridian wall — φ = {phi:.1f}°", size=12, fill="#1a5276", anchor="middle"))

    view_h = 2 * r + pad
    view_w = 2 * r + 2 * pad + 30
    return {"elevation": wrap_svg(view_w, view_h, "".join(lines))}
