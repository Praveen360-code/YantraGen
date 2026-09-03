"""Nadi Valaya Yantra (equatorial dial).

A two-faced circular disc mounted so that its plane is **parallel to the plane
of the Earth's equator** -- i.e. its central gnomon rod points toward the
celestial pole, which is elevated above the horizon by the latitude phi.  The
disc is therefore *tilted from vertical by the latitude phi*:

    disc_tilt_from_vertical = phi

The north-facing face is used when the sun is north of the celestial equator
(summer, delta > 0); the south-facing face in winter (delta < 0).  At the
equinox the rays fall parallel to the disc, illuminating both faces -- a built
-in season indicator.

Because the face is an *equatorial* dial, the hour lines are uniformly spaced
at 15 degrees (the shadow of the polar-parallel gnomon sweeps uniformly with
hour angle):

    hour_angle = 15 deg * hours_from_noon

The size parameter is the disc radius R; the gnomon rod length (toward the
pole) is taken as R.

Reference: V.N. Sharma, *Sawai Jai Singh and His Astronomy*;
jantarmantar.org Nadi Valaya notes; the uniform hour-line property of
equatorial dials is classical.

Educational reconstruction (not for precision timekeeping).
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import circle, line, text, unscale, wrap_svg


class NadiValayaYantra(Yantra):
    """Two-faced equatorial disc dial for solar time and equinox detection."""

    type_name = "nadi_valaya"
    display_name = "Nadi Valaya Yantra"
    description = (
        "Equatorial dial: two circular faces parallel to the equatorial plane, "
        "tilted by the latitude, with a pole-pointing gnomon and uniform hour lines."
    )
    required_params = ["disc_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("disc_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        lon_offset = (float(reference_meridian) - float(lon)) / 15.0

        values = [
            GeometryValue(
                key="disc_radius",
                label="Disc radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius of each circular face.",
            ),
            GeometryValue(
                key="disc_tilt",
                label="Disc tilt from vertical (equatorial)",
                value=round(phi, 4),
                unit="deg",
                formula="phi (latitude)",
                reference="Disc plane is parallel to the Earth's equatorial plane.",
            ),
            GeometryValue(
                key="gnomon_length",
                label="Gnomon rod length (toward pole)",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (proportion)",
                reference="Rod points to the celestial pole (Sharma).",
            ),
            GeometryValue(
                key="hour_spacing",
                label="Hour-line spacing",
                value=15.0,
                unit="deg",
                formula="15 deg per hour (equatorial dial)",
                reference="Uniform hour spacing on an equatorial dial.",
            ),
            GeometryValue(
                key="longitude_offset",
                label="Longitude time offset vs reference meridian",
                value=round(lon_offset, 4),
                unit="h",
                formula="(ref_meridian - lon) / 15",
                reference="Standard time conversion for the dial reading.",
            ),
        ]

        svg = _build_svg(R=R, phi=phi, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "disc_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool. Hour lines are uniform only on "
                    "the equatorial face; not for precision timekeeping."
                ),
                "references": [
                    "Virendra N. Sharma, Sawai Jai Singh and His Astronomy.",
                    "jantarmantar.org — Nadi Valaya.",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, unit: str) -> dict:
    """Front (dial face) and side (tilt) views of the Nadi Valaya."""
    scale = 20.0
    pad = 38.0
    r = R * scale
    cx = r + pad
    cy = r + pad

    face = []
    face.append(circle(cx, cy, r, "#eef2f7", "#2c3e50", 3))
    # hour lines: uniform 15 deg; 6am .. 6pm map to -90..90 deg from noon (up)
    for hour in range(-6, 7):
        alpha = 90.0 - 15.0 * hour  # noon=90 (up), 6am=180(left), 6pm=0(right)
        a = math.radians(alpha)
        lx = cx + (r - 12) * math.cos(a)
        ly = cy - (r - 12) * math.sin(a)
        face.append(line(cx, cy, lx, ly, "#7f8c8d" if hour % 3 == 0 else "#b0bec5", 2 if hour % 3 == 0 else 1))
        # label
        ltx = cx + (r - 24) * math.cos(a)
        lty = cy - (r - 24) * math.sin(a)
        face.append(text(ltx, lty, f"{hour}" if hour % 3 == 0 else "", size=9, fill="#2c3e50"))
    face.append(circle(cx, cy, 4, "#e67e22", "#c0392b", 2))  # gnomon hub
    face.append(text(cx, cy + r + 24, f"EQUATORIAL FACE (N:sunlit in summer) — φ tilt {phi:.1f}°",
                     size=10, fill="#1a5276"))
    front = wrap_svg(2 * r + 2 * pad, 2 * r + 2 * pad + 18, "".join(face))

    # side view: the disc seen edge-on tilted from vertical by phi,
    # with the gnomon rod pointing toward the celestial pole.
    # The viewBox is sized to contain the tilted disc + rod + labels.
    sc = 20.0
    pr = R * sc
    angle = math.radians(phi)
    s, c = math.sin(angle), math.cos(angle)
    ex = pr * s          # horizontal half-extension of the tilted disc
    ey = pr * c          # vertical half-extension of the tilted disc
    rod_len = 0.8 * pr
    rod_w = rod_len * c  # rod reach to the right
    rod_h = rod_len * s  # rod reach upward
    half_w = max(ex, rod_w)
    half_h = max(ey, rod_h)
    pad2 = 22.0
    midx = half_w + pad2
    midy = half_h + pad2
    view_w = 2.0 * (half_w + pad2)
    view_h = 2.0 * (half_h + pad2)
    rod_x = midx + rod_w
    rod_y = midy - rod_h
    side = [
        # vertical reference line (upward from the disc centre)
        line(midx, midy, midx, midy - half_h - 8, "#b0bec5", 1),
        # disc diameter (edge-on), tilted from vertical by phi
        line(midx - ex, midy + ey, midx + ex, midy - ey, "#2c3e50", 4),
        # gnomon rod toward the pole (perpendicular to the disc)
        line(midx, midy, rod_x, rod_y, "#171717", 3),
        text(midx, midy - half_h - 16, "vertical", size=9, fill="#7f8c8d"),
        text(midx, midy - half_h - 6, f"tilt {phi:.1f}°", size=10, fill="#171717"),
    ]
    side_svg = wrap_svg(view_w, view_h, "".join(side))

    return {"face": front, "tilt": side_svg}
