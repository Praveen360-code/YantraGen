"""Digamsa Yantra (azimuth circle).

A central pillar standing in the middle of two concentric circular scales on
the ground.  The outer circle is a full 360-degree azimuth scale (with
cardinal markings); the pillar's shadow indicates the sun's azimuth, used to
forecast sunrise / sunset.

For a site at latitude phi, the solar azimuth at the moment of sunrise /
sunset (altitude = 0) is given by the standard spherical-trig relation
(Roy & Clarke, *Astronomy: Principles and Practice*):

    cos A = sin(delta) / cos(phi)         (A measured from North)

and the sunrise hour angle / day length are:

    cos H = -tan(phi) * tan(delta)       (H in degrees; day length = 2H/15 h)

At the equinox (delta = 0) the sun rises due East (A = 90) and day length is
12 h, providing a clean cross-check.

The size parameter is the outer azimuth-circle radius R; the central pillar
height is taken as H = R so that a 45° altitude casts a shadow exactly to the
rim (consistent with the Jaipur/Delhi monumental proportions).

Reference: G.R. Kaye, *A Guide to the Old Observatories*; standard spherical
astronomy (Roy & Clarke).

Educational reconstruction (not for precision timekeeping).
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import circle, line, text, unscale, wrap_svg

_O = 23.44  # obliquity, deg


def _sunrise_azimuth(phi: float, delta: float) -> float:
    """Azimuth of sunrise measured from North (degrees), 0 < A < 90 for east."""
    cosA = math.sin(math.radians(delta)) / math.cos(math.radians(phi))
    return math.degrees(math.acos(max(-1.0, min(1.0, cosA))))


def _sunset_hour_angle(phi: float, delta: float) -> float:
    """Solar hour angle at sunset in degrees (positive, from noon)."""
    x = -math.tan(math.radians(phi)) * math.tan(math.radians(delta))
    return math.degrees(math.acos(max(-1.0, min(1.0, x))))


class DigamsaYantra(Yantra):
    """Azimuth circle instrument for solar azimuth and sunrise/sunset."""

    type_name = "digamsa"
    display_name = "Digamsa Yantra"
    description = (
        "Azimuth circle: a central pillar inside two concentric ground scales "
        "that measure solar azimuth and forecast sunrise/sunset."
    )
    required_params = ["outer_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("outer_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        az_equinox = _sunrise_azimuth(phi, 0.0)
        az_summer = _sunrise_azimuth(phi, _O)
        az_winter = _sunrise_azimuth(phi, -_O)
        h_equinox = _sunset_hour_angle(phi, 0.0)
        h_summer = _sunset_hour_angle(phi, _O)
        h_winter = _sunset_hour_angle(phi, -_O)

        values = [
            GeometryValue(
                key="outer_radius",
                label="Outer azimuth-circle radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Outer scale radius of the Digamsa (Kaye).",
            ),
            GeometryValue(
                key="outer_diameter",
                label="Outer circle diameter",
                value=unscale(2 * R, unit),
                unit=unit_label,
                formula="2R",
                reference="Two concentric ground circles enclose the pillar.",
            ),
            GeometryValue(
                key="pillar_height",
                label="Central pillar height",
                value=unscale(R, unit),
                unit=unit_label,
                formula="H = R (proportion)",
                reference="Shadow reaches the rim at 45 deg altitude (monumental proportion).",
            ),
            GeometryValue(
                key="azimuth_scale_degrees",
                label="Azimuth scale",
                value=360.0,
                unit="deg",
                formula="0..360 around the circle",
                reference="Full azimuth circle on the ground scale.",
            ),
            GeometryValue(
                key="sunrise_azimuth_equinox",
                label="Sunrise azimuth at equinox",
                value=round(az_equinox, 3),
                unit="deg",
                formula="where cos A = sin(0)/cos(phi)  =>  A = 90 (due East)",
                reference="Roy & Clarke; sunrise due East at equinox.",
            ),
            GeometryValue(
                key="sunrise_azimuth_summer",
                label="Sunrise azimuth at summer solstice",
                value=round(az_summer, 3),
                unit="deg",
                formula="cos A = sin(23.44)/cos(phi)",
                reference="Roy & Clarke; north of due East in summer.",
            ),
            GeometryValue(
                key="sunrise_azimuth_winter",
                label="Sunrise azimuth at winter solstice",
                value=round(az_winter, 3),
                unit="deg",
                formula="cos A = sin(-23.44)/cos(phi)",
                reference="Roy & Clarke; south of due East in winter.",
            ),
            GeometryValue(
                key="day_length_equinox",
                label="Day length at equinox",
                value=round(2 * h_equinox / 15.0, 3),
                unit="h",
                formula="2H/15, cos H = -tan(phi)tan(0) => 12 h",
                reference="Standard day-length relation (Roy & Clarke).",
            ),
            GeometryValue(
                key="day_length_summer",
                label="Day length at summer solstice",
                value=round(2 * h_summer / 15.0, 3),
                unit="h",
                formula="2H/15, cos H = -tan(phi)tan(23.44)",
                reference="Standard day-length relation (Roy & Clarke).",
            ),
            GeometryValue(
                key="day_length_winter",
                label="Day length at winter solstice",
                value=round(2 * h_winter / 15.0, 3),
                unit="h",
                formula="2H/15, cos H = -tan(phi)tan(-23.44)",
                reference="Standard day-length relation (Roy & Clarke).",
            ),
        ]

        svg = _build_svg(R=R, phi=phi, az_summer=az_summer, az_winter=az_winter, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "outer_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool. Sunrise/sunset azimuth uses a "
                    "mean obliquity; for precision astronomy use authoritative almanacs."
                ),
                "references": [
                    "G.R. Kaye, A Guide to the Old Observatories at Delhi, Jaipur, Ujjain, Benares.",
                    "A.E. Roy & D. Clarke, Astronomy: Principles and Practice.",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, az_summer: float, az_winter: float, unit: str) -> dict:
    """Plan view: concentric azimuth circles, radial markings, pillar + N arrow."""
    scale = 16.0
    pad = 40.0
    r = R * scale
    cx = r + pad
    cy = r + pad

    lines = []
    lines.append(circle(cx, cy, r, "#eef2f7", "#2c3e50", 3))          # outer
    lines.append(circle(cx, cy, 0.85 * r, "none", "#7f8c8d", 1.5))    # inner
    lines.append(circle(cx, cy, 0.06 * r, "#7f8c8d", "#34495e", 2))   # pillar
    # cardinal + azimuth radials
    for az in range(0, 360):
        a = math.radians(az)
        major = az % 90 == 0
        ln = 0.97 * r if major else 0.93 * r
        lines.append(
            line(cx + 0.07 * r * math.cos(a), cy + 0.07 * r * math.sin(a),
                 cx + ln * math.cos(a), cy + ln * math.sin(a), "#b0bec5", 2 if major else 1)
        )
    # cardinal labels
    for az, lab in [(0, "N"), (90, "E"), (180, "S"), (270, "W")]:
        a = math.radians(az)
        lines.append(text(cx + (r + 12) * math.cos(a), cy + (r + 12) * math.sin(a), lab, size=12, fill="#1a5276"))

    # mark sunrise/sunset solstice directions
    for ang, col, lab in [(az_summer, "#c0392b", "summer"), (az_winter, "#8e44ad", "winter")]:
        a = math.radians(ang)
        lines.append(text(cx + (r * 0.62) * math.cos(a), cy + (r * 0.62) * math.sin(a), lab, size=9, fill=col))

    lines.append(text(cx, cy + r + 26, f"AZIMUTH CIRCLE — sunrise N-of-E in summer", size=10, fill="#1a5276"))
    plan = wrap_svg(2 * r + 2 * pad, 2 * r + 2 * pad + 20, "".join(lines))
    return {"plan": plan}
