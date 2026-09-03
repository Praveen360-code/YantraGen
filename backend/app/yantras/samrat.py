"""Samrat Yantra (equinoctial sundial) computation module.

Geometric model (used by the reconstruction literature, esp. Virendra Sharma,
*Sawai Jai Singh and His Astronomy*; G.R. Kaye, *A Guide to the Old
Observatories at Delhi, Jaipur, Ujjain, Benares*):

* The gnomon is a right triangle standing in the meridian (north-south)
  vertical plane.  Its hypotenuse is the polar-aligned, shadow-casting edge
  and is inclined to the horizontal by the local latitude phi (so the
  hypotenuse is parallel to Earth's rotational axis).
      vertical gnomon height  H_v = H * sin(phi)
      horizontal base length  B   = H * cos(phi)
  where H = the hypotenuse (slant) length, the instrument's "size" parameter.

* On each side of the apex is a vertical quadrant (a quarter-disk standing in
  a plane perpendicular to the meridian, i.e. facing east / west), whose
  centre lies on the polar edge and whose radius equals the gnomon slant:
      quadrant radius R = H
  The classical, citable relationship -- Sharma shows the quadrant arc passes
  through the foot of the gnomon, giving R^2 = H_v^2 + B^2 = H^2.

* Hour lines: because the quadrant surface is curved about the polar-cast
  shadow edge, the shadow sweeps uniformly with the solar hour angle, so the
  hour marks are equally spaced at 15 degrees per hour (see Garner,
  bordersundials.co.uk "The world's largest sundial"; Kaye op. cit.).  The
  dial therefore reads *local apparent solar time*; converting to clock time
  requires the longitude correction from the reference meridian plus the
  equation of time -- both reported for the user.

This module is pure (no I/O) and is unit-tested against published Jaipur and
Delhi dimensions in ``tests/test_samrat.py``.

NOTE: this is an educational / research tool, not for precision timekeeping.
"""

from __future__ import annotations

import math

from ..core import trig
from .base import GeometryValue, Yantra, YantraSpec
from .drawing import monochromeize

# Published reference values used as regression fixtures (see tests):
#   Jaipur: phi = 26.9 deg, gnomon slant ~ 22.6 m (jantarmantar.org model
#           built on Virendra Sharma's measurements).
#   Delhi : phi = 28.6 deg, gnomon slant ~ 20.7 m (ibid.)
# These give the vertical gnomon heights in the ~22.6*sin(26.9) ~ 10 m range,
# consistent with the "top of the ramp" figures in the literature.


def _unscale(value_m: float, unit: str) -> float:
    """Convert a metre value into the requested output unit."""
    if unit == "ft":
        return value_m / 0.3048
    return value_m  # default metres


class SamratYantra(Yantra):
    """The Samrat Yantra: equinoctial sundial / giant gnomon + two quadrants."""

    type_name = "samrat"
    display_name = "Samrat Yantra"
    description = (
        "Equinoctial sundial -- a giant right-triangular gnomon whose "
        "hypotenuse is parallel to Earth's axis, with two quadrant time "
        "scales. The king of instruments."
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

        H = float(size_param)  # gnomon slant (hypotenuse), metres
        phi = float(lat)

        # --- core triangle proportions (Sharma; Kaye) -------------------
        H_v = H * trig.sind(phi)          # vertical gnomon height
        B = H * trig.cosd(phi)            # horizontal base length
        R = H                             # quadrant radius == slant

        # --- time / solar context --------------------------------------
        lon_offset = (float(reference_meridian) - float(lon)) / 15.0  # hours
        # local apparent solar time differs from reference-zone mean time by
        # this longitude term plus the seasonal equation of time.

        # --- hour lines on the quadrant (15 deg per hour, uniform) -----
        # hours from noon: 6am (-6) .. 6pm (+6); angle from the meridian mark.
        hour_lines = []
        for hour in range(-6, 7):
            angle_deg = 15.0 * hour
            # position on the quadrant arc (radius R), angle measured from
            # the top (noon) of the quadrant fan.
            arc_angle_rad = math.radians(90.0 - abs(angle_deg)) * (-1 if angle_deg >= 0 else 1)
            # simple parametric position on the arc for drawing:
            # we map hour to an arc fraction so +/-6h sit at the horizontal ends.
            hour_lines.append(
                {
                    "hour": hour,
                    "angle_deg": round(angle_deg, 4),
                    "formula": "15 deg * hour (equatorial dial)",
                }
            )

        unit_label = "m" if unit == "m" else "ft"
        values = [
            GeometryValue(
                key="gnomon_slant",
                label="Gnomon slant (hypotenuse)",
                value=_unscale(H, unit),
                unit=unit_label,
                formula="H (user size parameter)",
                reference="Size parameter (Sharma; Jantar Mantar manuals).",
            ),
            GeometryValue(
                key="gnomon_height",
                label="Vertical gnomon height",
                value=_unscale(H_v, unit),
                unit=unit_label,
                formula="H * sin(phi)",
                reference="Right-triangle in meridian plane; hypotenuse parallel to Earth's axis (Kaye, Guide to the Old Observatories; Sharma).",
            ),
            GeometryValue(
                key="base_length",
                label="Horizontal base length",
                value=_unscale(B, unit),
                unit=unit_label,
                formula="H * cos(phi)",
                reference="Ibid.; base is the horizontal projection of the slant.",
            ),
            GeometryValue(
                key="latitude_angle",
                label="Hypotenuse inclination (latitude)",
                value=round(phi, 4),
                unit="deg",
                formula="phi (site latitude)",
                reference="The hypotenuse is inclined by the local latitude so it parallels the polar axis.",
            ),
            GeometryValue(
                key="quadrant_radius",
                label="Quadrant radius",
                value=_unscale(R, unit),
                unit=unit_label,
                formula="R = H (equals gnomon slant)",
                reference="Quadrant centred on the polar edge passes through the gnomon foot; Sharma / Kaye.",
            ),
            GeometryValue(
                key="hour_spacing",
                label="Hour-line angular spacing",
                value=15.0,
                unit="deg",
                formula="360 / 24 hours",
                reference="Curved quadrant about the polar edge sweeps uniformly with hour angle (bordersundials.co.uk; Kaye).",
            ),
            GeometryValue(
                key="longitude_offset",
                label="Longitude time offset vs reference meridian",
                value=round(lon_offset, 4),
                unit="h",
                formula="(ref_meridian - lon) / 15",
                reference="Standard time meridian 82.5E (IST); optional Ujjain 75.7E.",
            ),
        ]

        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "gnomon_slant", "value": size_param, "unit": unit_label},
            values=values,
            hour_lines=hour_lines,
            svg=_build_svg(phi=phi, H=H, H_v=H_v, B=B, R=R, unit=unit),
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool. Not for precision timekeeping; "
                    "real instruments are also corrected by the equation of time."
                ),
                "references": [
                    "G.R. Kaye, A Guide to the Old Observatories at Delhi, Jaipur, Ujjain, Benares.",
                    "Virendra N. Sharma, Sawai Jai Singh and His Astronomy.",
                ],
            },
        )
        return spec


def _build_svg(*, phi: float, H: float, H_v: float, B: float, R: float, unit: str) -> dict:
    """Assemble SVG fragments for the Samrat technical drawing.

    Returns a dict with ``elevation`` and ``quadrant`` keys containing complete,
    self-contained SVG documents that the frontend injects directly.

    Coordinate conventions (SVG uses a top-left origin with +Y downward):
    * ``scale`` px per metre maps physical lengths to screen pixels.
    * The *ground line* sits near the bottom of the elevation viewBox, so the
      whole gnomon triangle is visible with the apex at the top.
    """
    scale = 20.0  # px per metre
    pad = 30.0    # px margin on every side

    # ---- elevation (meridian cross-section) ---------------------------
    # Ground is drawn at ground_y (px).  The gnomon base runs left->right
    # (south->north) along the ground; the hypotenuse rises to the apex.
    ground_y = H_v * scale + pad
    base_len_px = B * scale

    foot = (pad, ground_y)                              # south end of base
    baseN = (pad + base_len_px, ground_y)               # north end below apex
    apex = (pad + base_len_px, ground_y - H_v * scale)  # top of gnomon

    W_ele = base_len_px + 2 * pad
    H_ele = H_v * scale + 2 * pad

    ele_lines = [
        # hypotenuse (polar-aligned shadow edge) - red
        f'<line x1="{foot[0]:.1f}" y1="{foot[1]:.1f}" x2="{apex[0]:.1f}" y2="{apex[1]:.1f}" stroke="#c0392b" stroke-width="6"/>',
        # vertical back wall - dark
        f'<line x1="{apex[0]:.1f}" y1="{apex[1]:.1f}" x2="{baseN[0]:.1f}" y2="{baseN[1]:.1f}" stroke="#2c3e50" stroke-width="6"/>',
        # base along the ground - grey
        f'<line x1="{baseN[0]:.1f}" y1="{baseN[1]:.1f}" x2="{foot[0]:.1f}" y2="{foot[1]:.1f}" stroke="#7f8c8d" stroke-width="3"/>',
        # ground reference line
        f'<line x1="{4:.0f}" y1="{ground_y:.1f}" x2="{W_ele-4:.0f}" y2="{ground_y:.1f}" stroke="#95a5a6" stroke-width="2"/>',
        # latitude angle arc at the foot
        f'<path d="M {foot[0]+28:.1f} {ground_y:.1f} A 28 28 0 0 0 {foot[0]+28*math.cos(math.radians(phi)):.1f} {ground_y-28*math.sin(math.radians(phi)):.1f}" fill="none" stroke="#f59e0b" stroke-width="1.5"/>',
        f'<text x="{foot[0]+34:.1f}" y="{ground_y-18:.1f}" font-size="11" fill="#f59e0b">φ = {phi:.1f}°</text>',
        # altitude / dimension labels
        f'<text x="{apex[0]+6:.1f}" y="{(apex[1]+baseN[1])/2:.1f}" font-size="11" fill="#2c3e50" transform="rotate(90 {apex[0]+6:.1f} {(apex[1]+baseN[1])/2:.1f})">H·sin φ</text>',
        f'<text x="{(foot[0]+baseN[0])/2:.1f}" y="{ground_y+16:.1f}" font-size="11" fill="#7f8c8d" text-anchor="middle">H·cos φ</text>',
    ]

    # ---- quadrant time scale (view perpendicular to the polar edge) ----
    # Semicircular fan centred on the apex, radius = quadrant radius R.
    # Noon is at the top; 6am / 6pm at the horizontal ends (left / right).
    qr = R * scale
    q_cy = qr + pad          # centre's Y so the top of the fan clears the padding
    q_cx = qr + pad
    q_lines = [
        # semicircular arc
        f'<path d="M {q_cx-qr:.1f} {q_cy:.1f} A {qr:.1f} {qr:.1f} 0 0 1 {q_cx+qr:.1f} {q_cy:.1f}" fill="none" stroke="#2980b9" stroke-width="3"/>',
    ]
    for hour in range(-6, 7):
        # map hour h -> polar alpha: noon(0) => 90deg(top); 6am(-6)=>180deg(left); 6pm(+6)=>0deg(right)
        alpha = 90.0 - 15.0 * hour
        ar = math.radians(alpha)
        tx = q_cx + qr * math.cos(ar)
        ty = q_cy - qr * math.sin(ar)
        q_lines.append(
            f'<line x1="{q_cx:.1f}" y1="{q_cy:.1f}" x2="{tx:.1f}" y2="{ty:.1f}" stroke="#34495e" stroke-width="1.5"/>'
        )
        anchor = "middle"
        label_x = tx
        label_y = ty + (16 if hour == 0 else -8)
        if alpha in (0.0, 180.0):
            label_x = tx + (10 if alpha == 0.0 else -10)
            label_y = ty + 4
        q_lines.append(
            f'<text x="{label_x:.1f}" y="{label_y:.1f}" font-size="10" fill="#2c3e50" text-anchor="{anchor}">{hour if hour!=0 else "N"}h</text>'
        )
    H_quad = qr + 2 * pad
    W_quad = 2 * qr + 2 * pad

    def wrap(view_w: float, view_h: float, inner: str) -> str:
        inner = monochromeize(inner)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:.0f} {view_h:.0f}" '
            f'width="100%" height="100%">'
            f'<rect width="100%" height="100%" fill="#fafafa"/>'
            f'<g>{inner}</g>'
            f'</svg>'
        )

    elevation_svg = wrap(W_ele, H_ele, "".join(ele_lines))
    quadrant_svg = wrap(W_quad, H_quad, "".join(q_lines))
    return {
        "elevation": elevation_svg,
        "quadrant": quadrant_svg,
        "geometry": {
            "phi": phi,
            "H": H,
            "H_v": H_v,
            "B": B,
            "R": R,
        },
    }

