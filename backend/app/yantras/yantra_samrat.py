"""Yantra-Samrat computation module.

The *Yantra-Samrat* ("king of instruments") is a **combination instrument**
that unites two classical devices on a single, precisely-set *polar axis*:

* **Samrat Yantra** (timekeeping part): a right-triangular gnomon whose slant
  edge lies along the polar axis and casts a shadow on two equatorial
  quadrants, reading local apparent time.  The quadrant radius equals the
  gnomon slant; because the quadrant is curved about the polar edge the hour
  marks are uniformly spaced at 15 deg per hour.
* **Dhruva-Protha-Chakra Yantra** (polar-sighting part): a graduated ring,
  coaxial with the same polar axis, carrying a sighting needle that reads a
  body's **declination** (and the ring's rotation gives its right ascension /
  hour angle).

Because both subsystems share one axis, the whole alignment discipline
reduces to setting that single axis at the local latitude phi -- the axis
(and the pole) then stand at altitude phi.  This is exactly the confluence of
timekeeping and polar/declination measurement described in the Siddhanta
instrument tradition (cf. Bhaskara's description of the union of the samrat
and the chakra-yantra; see also modern surveys of the yantra family).

The size parameter is the gnomon slant H; the coaxial declination ring is
taken at a design proportion R_r = 0.6 * H.

Educational reconstruction (not for precision timekeeping or measurement).
"""

from __future__ import annotations

import math

from ..core import trig
from .base import GeometryValue, Yantra, YantraSpec
from .drawing import arc, circle, line, text, unscale, wrap_svg

_O = 23.44


class YantraSamratYantra(Yantra):
    """Combination of the Samrat (sundial) and Dhruva-Protha-Chakra (ring)."""

    type_name = "yantra_samrat"
    display_name = "Yantra-Samrat"
    description = (
        "Combination instrument: an equinoctial Samrat gnomon (time) fused with "
        "a coaxial Dhruva polar ring (declination / right ascension) on one "
        "precisely-set polar axis."
    )
    required_params = ["gnomon_slant"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("gnomon_slant must be positive")

        H = float(size_param)
        R_r = 0.6 * H  # coaxial declination-ring radius (design proportion)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        H_v = H * trig.sind(phi)
        B = H * trig.cosd(phi)
        lon_offset = (float(reference_meridian) - float(lon)) / 15.0

        values = [
            GeometryValue(
                key="gnomon_slant",
                label="Gnomon slant (hypotenuse)",
                value=unscale(H, unit),
                unit=unit_label,
                formula="H (user size parameter)",
                reference="Shared polar edge; alignment = latitude.",
            ),
            GeometryValue(
                key="vertical_gnomon_height",
                label="Vertical gnomon height (Samrat part)",
                value=unscale(H_v, unit),
                unit=unit_label,
                formula="H * sin(phi)",
                reference="Samrat model; Kaye, Guide to the Old Observatories; Sharma.",
            ),
            GeometryValue(
                key="base_length",
                label="Horizontal base length",
                value=unscale(B, unit),
                unit=unit_label,
                formula="H * cos(phi)",
                reference="Horizontal projection of the slant.",
            ),
            GeometryValue(
                key="polar_axis_inclination",
                label="Common polar-axis inclination",
                value=round(phi, 4),
                unit="deg",
                formula="phi (site latitude)",
                reference="Single axis shared by gnomon or ring; pole altitude = phi.",
            ),
            GeometryValue(
                key="quadrant_radius",
                label="Samrat quadrant radius",
                value=unscale(H, unit),
                unit=unit_label,
                formula="R = H (equals gnomon slant)",
                reference="Quadrant curved about the polar edge passes through the gnomon foot.",
            ),
            GeometryValue(
                key="hour_spacing",
                label="Hour-line spacing",
                value=15.0,
                unit="deg",
                formula="360 / 24 hours",
                reference="Equinoctial dial sweeps uniformly with hour angle.",
            ),
            GeometryValue(
                key="declination_ring_radius",
                label="Dhruva declination-ring radius",
                value=unscale(R_r, unit),
                unit=unit_label,
                formula="0.6 * H (design proportion)",
                reference="Coaxial ring on the same polar axis.",
            ),
            GeometryValue(
                key="declination_span",
                label="Declination span on the ring",
                value=2.0 * _O,
                unit="deg",
                formula="2 * +/- 23.44 (tropics)",
                reference="Sun's yearly declination range on the ring.",
            ),
            GeometryValue(
                key="longitude_offset",
                label="Longitude time offset vs reference meridian",
                value=round(lon_offset, 4),
                unit="h",
                formula="(ref_meridian - lon) / 15",
                reference="Standard time conversion for the sundial reading.",
            ),
        ]

        svg = _build_svg(phi=phi, H=H, H_v=H_v, B=B, R_r=R_r, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "gnomon_slant", "value": size_param, "unit": unit_label},
            values=values,
            hour_lines=[
                {"hour": h, "angle_deg": round(15.0 * h, 4), "formula": "15 deg * hour (quadrant)"}
                for h in range(-6, 7)
            ],
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool; combined instrument whose shared "
                    "polar axis is aligned to the latitude. Not for precision "
                    "timekeeping or measurement."
                ),
                "references": [
                    "Bhaskaracharya, Siddhanta Shiromani (union of yantras).",
                    "G.R. Kaye, Guide to the Old Observatories; V.N. Sharma, Sawai Jai Singh and His Astronomy.",
                ],
            },
        )
        return spec


def _build_svg(*, phi: float, H: float, H_v: float, B: float, R_r: float, unit: str) -> dict:
    """Combined elevation (gnomon + ring on one axis) and a quadrant view."""
    scale = 20.0
    pad = 34.0
    ground_y = H_v * scale + pad
    base_len = B * scale
    foot = (pad, ground_y)
    baseN = (pad + base_len, ground_y)
    apex = (pad + base_len, ground_y - H_v * scale)
    W = base_len + 2 * pad
    Hh = H_v * scale + 2 * pad

    rr = R_r * scale
    # place the coaxial ring concentrically with the apex, slightly above ground
    rcx, rcy = apex[0], apex[1] + rr
    # size the viewBox to contain the gnomon triangle AND the coaxial ring
    x_max = max(base_len + 2 * pad, rcx + rr) + pad
    y_max = max(ground_y, rcy + rr) + pad

    ele = [
        line(*foot, *apex, "#c0392b", 6),
        line(*apex, *baseN, "#2c3e50", 6),
        line(*baseN, *foot, "#7f8c8d", 3),
        line(base_len + 2 * pad - 4, ground_y, 4, ground_y, "#95a5a6", 2),
        # declination ring, coaxial with the polar edge
        circle(rcx, rcy, rr, "#eef2f7", "#2980b9", 3),
        line(rcx - rr, rcy, rcx + rr, rcy, "#7f8c8d", 1.5),
        text(rcx, rcy + rr + 16, "Dhruva ring (declination)", size=9, fill="#2980b9"),
        # latitude arc at the foot
        text(foot[0] + 36, ground_y - 18, f"axis φ = {phi:.1f}°", size=10, fill="#f59e0b"),
    ]
    ele_svg = wrap_svg(x_max, y_max, "".join(ele))

    # quadrant time scale (Samrat part), radius R = H
    qr = H * scale
    q_cx = qr + pad
    q_cy = qr + pad
    quad = [
        f'<path d="M {q_cx-qr:.1f} {q_cy:.1f} A {qr:.1f} {qr:.1f} 0 0 1 {q_cx+qr:.1f} {q_cy:.1f}" fill="none" stroke="#2980b9" stroke-width="3"/>',
    ]
    for hour in range(-6, 7):
        alpha = 90.0 - 15.0 * hour
        ar = math.radians(alpha)
        tx = q_cx + qr * math.cos(ar)
        ty = q_cy - qr * math.sin(ar)
        quad.append(line(q_cx, q_cy, tx, ty, "#34495e", 1.5))
        quad.append(text(tx, ty + (16 if hour == 0 else -8), f"{hour if hour!=0 else 'N'}h", size=9, fill="#2c3e50"))
    quad_svg = wrap_svg(2 * qr + 2 * pad, qr + 2 * pad, "".join(quad))

    return {"elevation": ele_svg, "quadrant": quad_svg}
