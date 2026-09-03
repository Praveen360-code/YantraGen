"""Rama Yantra (cylindrical altitude-azimuth instrument).

A pair of tall, open cylinders, each with a central pillar, whose floor is a
graduated horizontal scale.  Published construction rule (G.R. Kaye; the
Jaipur/Delhi literature) is that the *central pillar, the surrounding walls and
the inner radius are all equal*:

    H_wall = H_pillar = R          (R = cylinder inner radius, the size param)

The sun casts the central pillar's shadow onto the floor.  The shadow *tip*
falls at a distance l from the centre given by the gnomon relation:

    l = R * tan(z)                 (z = solar zenith distance)

so the floor is inscribed with concentric circles at radii
``R * tan(z)`` marking zenith distance z, and radial lines marking azimuth.
Because the floor only extends to the rim (l <= R), it directly measures
zenith distances up to 45 deg; beyond this the shadow of the sun rises up the
graduated cylindrical wall (as the classical descriptions note).

Observe that for z = 45 deg the shadow exactly reaches the rim
(tan 45 = 1), an elegant consequence of choosing pillar height = radius.

Reference: G.R. Kaye, *A Guide to the Old Observatories*; V.N. Sharma,
*Sawai Jai Singh and His Astronomy*; jantarmantar.org Rama Yantra notes.

Educational reconstruction (not for precision timekeeping).
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import circle, line, text, unscale, wrap_svg

_YANTRA_REF = (
    "Pillar height = wall height = radius R (Kaye; Sharma). "
    "Shadow length = R * tan(zenith distance)."
)


class RamaYantra(Yantra):
    """Cylindrical instrument measuring solar altitude and azimuth."""

    type_name = "rama"
    display_name = "Rama Yantra"
    description = (
        "Cylindrical altitude-azimuth instrument: open vertical cylinders around "
        "a central pillar of equal height, with a graduated floor scale."
    )
    required_params = ["inner_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("inner_radius must be positive")

        R = float(size_param)  # cylinder inner radius == wall/pillar height, metres
        unit_label = "m" if unit == "m" else "ft"

        values = [
            GeometryValue(
                key="inner_radius",
                label="Cylinder inner radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference=_YANTRA_REF,
            ),
            GeometryValue(
                key="wall_height",
                label="Cylinder wall height",
                value=unscale(R, unit),
                unit=unit_label,
                formula="H = R",
                reference="Wall and pillar are both equal to the radius (Kaye).",
            ),
            GeometryValue(
                key="pillar_height",
                label="Central pillar height",
                value=unscale(R, unit),
                unit=unit_label,
                formula="H = R",
                reference="Pillar height equals the radius (Kaye).",
            ),
            GeometryValue(
                key="zenith_15_circle",
                label="Zenith-distance 15° floor circle radius",
                value=unscale(R * math.tan(math.radians(15)), unit),
                unit=unit_label,
                formula="R * tan(15°)",
                reference=_YANTRA_REF,
            ),
            GeometryValue(
                key="zenith_30_circle",
                label="Zenith-distance 30° floor circle radius",
                value=unscale(R * math.tan(math.radians(30)), unit),
                unit=unit_label,
                formula="R * tan(30°)",
                reference=_YANTRA_REF,
            ),
            GeometryValue(
                key="zenith_45_circle",
                label="Zenith-distance 45° floor circle radius",
                value=unscale(R * math.tan(math.radians(45)), unit),
                unit=unit_label,
                formula="R * tan(45°) = R",
                reference="Shadow reaches the rim at 45 deg zenith distance.",
            ),
            GeometryValue(
                key="max_floor_zenith",
                label="Maximum floor-measurable zenith distance",
                value=45.0,
                unit="deg",
                formula="atan(R / H) = atan(1) = 45°",
                reference="Beyond 45 deg the readout moves up the wall (Kaye).",
            ),
            GeometryValue(
                key="azimuth_lines",
                label="Azimuth scale divisions",
                value=30.0,
                unit="count",
                formula="30 radial divisions around the circle",
                reference="30 vertical lines on pillar = 30 circumferential marks (Delhi).",
            ),
        ]

        svg = _build_svg(R=R, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "inner_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool. Floor scale reads zenith distance "
                    "up to 45 deg; for precision use modern calculation."
                ),
                "references": [
                    "G.R. Kaye, A Guide to the Old Observatories at Delhi, Jaipur, Ujjain, Benares.",
                    "jantarmantar.org — Rama Yantra.",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, unit: str) -> dict:
    """Assemble plan (top) and section (elevation) views of the Rama Yantra."""
    scale = 20.0  # px per metre
    pad = 36.0

    # ---- plan (top view of the graduated floor) ----
    r = R * scale
    cx = r + pad
    cy = r + pad
    lines = []
    # floor / rim
    lines.append(circle(cx, cy, r, "#eef2f7", "#2c3e50", 3))
    # central pillar (viewed from above)
    lines.append(circle(cx, cy, 0.1 * r, "#7f8c8d", "#34495e", 2))
    # zenith-distance circles z=15,30,45
    cols = {15: "#27ae60", 30: "#c0392b", 45: "#8e44ad"}
    for z, col in cols.items():
        zr = r * math.tan(math.radians(z))
        lines.append(circle(cx, cy, zr, "none", col, 1.5))
        lines.append(text(cx + zr + 8, cy - 6, f"z={z}°", size=9, fill=col))
    # azimuth radial lines every 15 deg
    for az in range(0, 360, 15):
        a = math.radians(az)
        lines.append(
            line(cx + 0.13 * r * math.cos(a), cy + 0.13 * r * math.sin(a),
                 cx + r * math.cos(a), cy + r * math.sin(a), "#b0bec5", 1)
        )
    lines.append(text(cx, cy + r + 16, "FLOOR: zenith circles + azimuth radials", size=10, fill="#1a5276"))
    plan = wrap_svg(2 * r + 2 * pad, 2 * r + 2 * pad + 10, "".join(lines))

    # ---- section (elevation): cylinder wall + pillar of height R ----
    sc = 20.0
    pr = R * sc
    pcy = pr + 2 * pad  # pillar base y
    px = pad + pr       # pillar centre x
    sec = [
        line(pad, pcy, pad + 2 * pr, pcy, "#7f8c8d", 2),  # floor
        # wall (right) and pillar (left/centre)
        line(px, pcy, px, pcy - pr, "#2c3e50", 4),       # pillar
        line(pad + 2 * pr - 0.06 * pr, pcy, pad + 2 * pr - 0.06 * pr, pcy - pr, "#7f8c8d", 4),  # outer wall
        # shadow ray example at 45 deg from pillar top
        line(px, pcy - pr, pad + 2 * pr, pcy, "#e74c3c", 1.5),
        text(px + 8, pcy - pr + 12, f"H = R", size=10, fill="#2c3e50", anchor="start"),
        text(pad + 2 * pr - 20, pcy - pr + 12, "wall = R", size=10, fill="#7f8c8d", anchor="end"),
        text(px + 12, pcy - 8, "shadow = R·tan(z)", size=9, fill="#e74c3c", anchor="start"),
    ]
    elevation = wrap_svg(2 * pr + 2 * pad, pr + 2 * pad + 10, "".join(sec))

    return {"plan": plan, "elevation": elevation}
