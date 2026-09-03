"""Gola-Yantra / Chakra-Yantra (armillary sphere) computation module.

The *Gola-yantra* (armillary sphere) is a framework of rings representing the
principal circles of the celestial sphere.  It is used both to *model* the sky
and to *solve the spherical triangle* connecting the horizon, equator,
ecliptic and meridian systems.  The classical Indian description is due to
Bhaskaracharya (Siddhanta Shiromani, Yantra-adhyaya); Aryabhata (Aryabhatiya)
already described a gola for teaching spherics.

The main rings and their alignment at latitude phi:

* **Meridian ring** -- a vertical ring lying in the north-south plane.
* **Horizon ring**   -- a horizontal ring at the observer's eye level.
* **Equatorial ring**-- the plane of the celestial equator; it is inclined to
  the horizontal by the *co-latitude* (90 - phi), so its axis (the polar axis)
  stands at altitude phi.
* **Ecliptic ring**  -- the Sun's apparent path, inclined to the equator by the
  obliquity 23.44 deg.
* **Tropics** (Cancer, Capricorn) -- small circles parallel to the equator at
  declination +/- 23.44 deg.

The equatorial relation used throughout (sin altitude = sin phi sin delta +
cos phi cos delta cos H) is exactly the astronomical triangle.
Educational tool -- not for precision observation.

The size parameter is the sphere radius R.
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import circle, line, text, unscale, wrap_svg

_O = 23.44


class GolaChakraYantra(Yantra):
    """Armillary sphere: rings modelling the celestial equator, meridian, etc."""

    type_name = "gola_chakra"
    display_name = "Gola-Yantra / Chakra-Yantra (Armillary Sphere)"
    description = (
        "A framework of rings modelling the celestial sphere -- meridian, "
        "horizon, equator, ecliptic and tropics -- used to solve the spherical "
        "triangle and teach spherics."
    )
    required_params = ["sphere_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("sphere_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        colat = 90.0 - phi
        values = [
            GeometryValue(
                key="sphere_radius",
                label="Sphere radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius of the armillary rings.",
            ),
            GeometryValue(
                key="equator_inclination",
                label="Equatorial-ring inclination from horizontal",
                value=round(colat, 4),
                unit="deg",
                formula="90 - phi (co-latitude)",
                reference="Plane of the celestial equator; axis altitude = phi.",
            ),
            GeometryValue(
                key="polar_axis_altitude",
                label="Polar-axis altitude",
                value=round(phi, 4),
                unit="deg",
                formula="phi",
                reference="Normal to the equatorial ring points to the celestial pole.",
            ),
            GeometryValue(
                key="ecliptic_obliquity",
                label="Ecliptic-ring obliquity",
                value=_O,
                unit="deg",
                formula="23.44 (obliquity)",
                reference="The ecliptic is inclined to the equator by the obliquity.",
            ),
            GeometryValue(
                key="tropic_cancer",
                label="Tropic-Cancer declination",
                value=_O,
                unit="deg",
                formula="+23.44",
                reference="Small circle parallel to the equator at +23.44 deg.",
            ),
            GeometryValue(
                key="tropic_capricorn",
                label="Tropic-Capricorn declination",
                value=-_O,
                unit="deg",
                formula="-23.44",
                reference="Small circle parallel to the equator at -23.44 deg.",
            ),
            GeometryValue(
                key="equator_noon_altitude",
                label="Meridian altitude of the equator (equinox noon)",
                value=round(colat, 4),
                unit="deg",
                formula="90 - phi",
                reference="At the equinox the Sun crosses the meridian at the equator altitude.",
            ),
        ]

        svg = _build_svg(R=R, phi=phi, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "sphere_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational model of the celestial sphere; used to illustrate "
                    "spherical geometry. Not for precision observation."
                ),
                "references": [
                    "Bhaskaracharya, Siddhanta Shiromani (Yantra-adhyaya).",
                    "Aryabhata, Aryabhatiya (gola); Roy & Clarke, Astronomy: Principles and Practice.",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, unit: str) -> dict:
    """Front-projected armillary sphere: concentric / intersecting rings."""
    scale = 24.0
    pad = 40.0
    R0 = R * scale
    cx = R0 + pad + 20
    cy = R0 + pad + 20
    view = 2 * R0 + 2 * pad + 20

    # ellipse helpers (rx, ry, rotation about centre)
    def ell(name, rx, ry, rot, stroke, w=2, fill="none"):
        if rot:
            return (f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" '
                    f'transform="rotate({rot} {cx:.1f} {cy:.1f})" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>')
        return f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'

    parts = []
    # meridian ring (vertical circle, N-S plane) -> front view is a circle
    parts.append(circle(cx, cy, R0, "#eef2f7", "#2c3e50", 3))
    # polar axis (vertical diameter)
    parts.append(line(cx, cy - R0, cx, cy + R0, "#c0392b", 2))
    parts.append(text(cx + 6, cy - R0 - 8, "NCP (alt φ)", size=9, fill="#c0392b", anchor="start"))
    # horizon ring (horizontal plane) -> a wide ellipse (foreshortened)
    parts.append(ell("h", R0, R0 * 0.42, 0, "#7f8c8d", 2.5))
    parts.append(text(cx + R0 + 8, cy + 4, "horizon", size=9, fill="#7f8c8d", anchor="start"))
    # equatorial ring -> inclined from horizontal by co-latitude (90-phi),
    # so in projection its axis (normal) is tilted.  Here we simply show the
    # ring plane tilted by phi from the horizontal diameter.
    eq_rot = -phi  # tilt from the horizontal plane
    parts.append(ell("e", R0, R0 * 0.5, eq_rot, "#2980b9", 2.5))
    parts.append(text(cx + 8, cy - R0 * 0.55 - 6, f"equator (tilt 90-φ)", size=9, fill="#2980b9", anchor="start"))
    # ecliptic ring -> oblique to the equator by +-23.44
    parts.append(ell("ec", R0 * 0.94, R0 * 0.5, eq_rot + _O, "#e67e22", 2))
    parts.append(text(cx - R0 * 0.98, cy + R0 * 0.30, "ecliptic ε=23.44°", size=9, fill="#e67e22", anchor="end"))
    # tropics as small circles parallel to equator (drawn as ellipses)
    ty = cy - R0 * math.sin(math.radians(_O))  # small-circle offset along the axis
    parts.append(ell("t1", R0 * math.cos(math.radians(_O)), R0 * 0.22, eq_rot, "#8e44ad", 1.5))
    parts.append(text(cx + R0 - 8, ty + R0 * 0.26 + 10, "Tropic of Cancer",
                      size=8, fill="#8e44ad", anchor="end"))

    parts.append(text(cx, view - 14, f"GOLA / CHAKRA — φ = {phi:.1f}°", size=12, fill="#1a5276"))
    ele_svg = wrap_svg(view, view, "".join(parts))
    return {"elevation": ele_svg}
