"""Dhruva-Protha-Chakra Yantra computation module.

The *Dhruva-Protha-Chakra*-yantra is a graduated ring ("chakra") mounted so
that it can rotate about a *polar axis* ("dhruva" = the celestial pole / Pole
Star) with a movable sighting needle ("protha", a pin/needle) that pivots
along the ring.  It is the classical instrument for locating a celestial body
by directly measuring its **equatorial coordinates**:

* **Declination** (delta): the angular distance of the sighting needle from
  the celestial equator along the ring.  The needle is perpendicular to the
  polar axis; the pole itself sits at 90 degrees from the equator mark.
* **Right ascension / hour angle**: read from the rotation of the whole ring
  around the polar axis, marked on a graduated disk at the foot of the axis.

Because the ring's axis points at the celestial pole, whose altitude above
the horizon equals the observer's latitude phi, the *axis must be inclined
from the horizontal by exactly phi* -- the same alignment discipline as the
Samrat's gnomon.  The ring is therefore a portable, equatorial-coordinate
instrument (cf. the later Chakra Yantra of the Observatory).

The size parameter is the ring radius R.

Reference / context: Bhaskaracharya, *Siddhanta Shiromani* (Yantra-literature);
classical descriptions of the chakra-yantra and the equatorial ring.  The
declination of the Sun over the year is bounded by the tropics (+/- 23.44
deg), which are marked on the ring.  Educational reconstruction (not for
precision measurement).
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import arc, circle, line, text, unscale, wrap_svg

_O = 23.44  # obliquity of the ecliptic (deg), tropical bound


class DhruvaProthaChakraYantra(Yantra):
    """Polar-axis ring that measures declination and right ascension."""

    type_name = "dhruva_protha_chakra"
    display_name = "Dhruva-Protha-Chakra Yantra"
    description = (
        "A graduated ring on a polar axis (pointing to Dhruva / the Pole Star) "
        "with a sighting needle -- directly measures a body's declination and "
        "right ascension in the equatorial system."
    )
    required_params = ["ring_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("ring_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        # polar axis inclined by latitude; the Pole Star altitude == phi
        values = [
            GeometryValue(
                key="ring_radius",
                label="Ring (chakra) radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius of the graduated ring.",
            ),
            GeometryValue(
                key="polar_axis_inclination",
                label="Polar-axis inclination",
                value=round(phi, 4),
                unit="deg",
                formula="phi (site latitude)",
                reference="Axis points to the celestial pole at altitude phi.",
            ),
            GeometryValue(
                key="pole_star_altitude",
                label="Pole Star (Dhruva) altitude",
                value=round(phi, 4),
                unit="deg",
                formula="phi",
                reference="Polaris sits essentially at the north celestial pole.",
            ),
            GeometryValue(
                key="declination_tropic",
                label="Tropic-Cancer declination (north bound)",
                value=_O,
                unit="deg",
                formula="+23.44 (obliquity)",
                reference="Sun's declination at the summer solstice (Kranti bound).",
            ),
            GeometryValue(
                key="declination_tropic_south",
                label="Tropic-Capricorn declination (south bound)",
                value=-_O,
                unit="deg",
                formula="-23.44 (obliquity)",
                reference="Sun's declination at the winter solstice.",
            ),
            GeometryValue(
                key="declination_span",
                label="Total declination span on the ring",
                value=2.0 * _O,
                unit="deg",
                formula="2 * 23.44",
                reference="Full yearly range the sighting needle sweeps.",
            ),
            GeometryValue(
                key="hour_angle_marks",
                label="Right-ascension / hour-angle mark spacing",
                value=15.0,
                unit="deg",
                formula="360 / 24 hours",
                reference="Base disk marks every 15 deg = 1 sidereal hour.",
            ),
            GeometryValue(
                key="sighting_needle_length",
                label="Sighting needle (protha) length",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (proportion)",
                reference="Needle spans the ring to the viewing axis.",
            ),
        ]

        svg = _build_svg(R=R, phi=phi, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "ring_radius", "value": size_param, "unit": unit_label},
            values=values,
            hour_lines=[
                {"hour": h, "angle_deg": round(15.0 * h, 4), "formula": "15 deg * hour (sidereal / hour angle)"}
                for h in range(-12, 13)
            ],
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational reconstruction based on classical "
                    "(Bhaskaracharya, Siddhanta Shiromani) instrument descriptions; "
                    "not for precision measurement."
                ),
                "references": [
                    "Bhaskaracharya, Siddhanta Shiromani (Yantra literature).",
                    "Classical equatorial-ring instruments (ibid.; cf. the Chakra Yantra).",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, unit: str) -> dict:
    """Schematic views: the ring on its polar axis, and the hour-angle disk."""
    scale = 22.0
    pad = 40.0
    r = R * scale
    cx = r + pad
    cy = r + pad

    ele = []
    ele.append(circle(cx, cy, r, "#eef2f7", "#2c3e50", 3))          # ring
    # polar axis (pointing up toward the pole)
    ele.append(line(cx, cy, cx, cy - r - 14, "#c0392b", 4))
    ele.append(text(cx, cy - r - 22, "to pole (Dhruva)", size=9, fill="#c0392b", anchor="middle"))
    # equator line through the ring (perpendicular to axis)
    ele.append(line(cx - r, cy, cx + r, cy, "#7f8c8d", 1.5))
    ele.append(text(cx + r + 8, cy + 4, "equator", size=9, fill="#7f8c8d", anchor="start"))
    # mark the two tropics on the ring (declination +/- 23.44 from equator)
    for dec, col, lab in [(_O, "#e67e22", "Tropic of Cancer"), (-_O, "#8e44ad", "Tropic of Capricorn")]:
        a = math.radians(90.0 - dec)
        tx = cx + r * math.cos(a)
        ty = cy - r * math.sin(a)
        ele.append(circle(tx, ty, 4, col, col, 1))
        ele.append(text(cx + (r + 12) * math.cos(a), cy - (r + 12) * math.sin(a),
                        lab, size=8, fill=col))
    # sighting needle (protha) e.g. at declination dec_demo = 15 north
    dec_demo = 15.0
    a = math.radians(90.0 - dec_demo)
    nx = cx + (r - 8) * math.cos(a)
    ny = cy - (r - 8) * math.sin(a)
    ele.append(line(cx, cy, nx, ny, "#2980b9", 3))
    ele.append(text(nx + 6, ny - 6, f"needle δ = {dec_demo:.0f}°", size=9, fill="#2980b9", anchor="start"))
    # axis inclination arc
    ele.append(text(cx + 10, cy + r + 26, f"axis ⊥ horizon by φ = {phi:.1f}°",
                    size=10, fill="#1a5276", anchor="middle"))

    view = 2 * r + 2 * pad + 20
    ele_svg = wrap_svg(view, view, "".join(ele))

    # hour-angle base disk (right ascension of the ring's rotation)
    bpad = 40.0
    br = 70.0
    bcx, bcy = br + bpad, br + bpad
    base = [circle(bcx, bcy, br, "#eef2f7", "#2c3e50", 2.5)]
    for hr in range(0, 24):
        a = math.radians(90.0 - 15.0 * hr)
        x0 = bcx + (br - 6) * math.cos(a)
        y0 = bcy - (br - 6) * math.sin(a)
        x1 = bcx + br * math.cos(a)
        y1 = bcy - br * math.sin(a)
        base.append(line(x0, y0, x1, y1, "#7f8c8d" if hr % 3 else "#34495e", 1.5 if hr % 3 else 2))
        if hr % 3 == 0:
            base.append(text(bcx + (br - 18) * math.cos(a), bcy - (br - 18) * math.sin(a),
                             str(hr) if hr != 0 else "0", size=9, fill="#2c3e50"))
    base.append(text(bcx, bcy + br + 24, "Right-ascension disk (hour angle, 15°/h)",
                     size=10, fill="#1a5276", anchor="middle"))
    base_svg = wrap_svg(2 * br + 2 * bpad, 2 * br + 2 * bpad + 12, "".join(base))

    return {"elevation": ele_svg, "hour_disk": base_svg}
