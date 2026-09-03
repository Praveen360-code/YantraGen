"""Palaka Yantra (flat plank instrument).

From the classical (Siddhanta) tradition, the "palaka" (plank) is a flat board
mounted with a vertical gnomon; it is used to determine the sun's altitude and
(downstream) local time and declination by measuring the gnomon's shadow.

Given a plank of length L (the size parameter) with a vertical gnomon of
height H at its edge, the solar altitude follows from the shadow length:

    shadow = H / tan(altitude)        i.e. altitude = atan(H / shadow)

Setting the gnomon height equal to the plank length (H = L) makes the plank
self-consistent: at 45 deg altitude the shadow just spans the full plank, and
shorter shadows toward the gnomon correspond to a higher sun.  At local noon
the meridian altitude is 90 - phi + delta, so the plank also yields the solar
declination.

The size parameter is the plank length L.

Reference / context: classical instrument descriptions (Siddhanta tradition);
the tangent shadow relation is elementary gnomonics.

Educational reconstruction (not for precision timekeeping).
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import line, text, unscale, wrap_svg

_O = 23.44


class PalakaYantra(Yantra):
    """Flat plank with a vertical gnomon for solar altitude."""

    type_name = "palaka"
    display_name = "Palaka Yantra"
    description = (
        "Flat plank instrument: a level board with a vertical gnomon, engraved "
        "so the shadow length gives the sun's altitude and declination."
    )
    required_params = ["plank_length"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("plank_length must be positive")

        L = float(size_param)
        H = L  # gnomon height equals plank length
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        noon_equiv = 90.0 - phi
        noon_sum = 90.0 - phi + _O
        noon_win = 90.0 - phi - _O
        # shadow length at noon for each season
        def sh(alt: float) -> float:
            return H / math.tan(math.radians(max(alt, 1.0)))

        values = [
            GeometryValue(
                key="plank_length",
                label="Plank length",
                value=unscale(L, unit),
                unit=unit_label,
                formula="L (user size parameter)",
                reference="Length of the level plank.",
            ),
            GeometryValue(
                key="gnomon_height",
                label="Gnomon height",
                value=unscale(H, unit),
                unit=unit_label,
                formula="H = L",
                reference="Shadow spans the plank at 45 deg altitude (self-consistent).",
            ),
            GeometryValue(
                key="shadow_45",
                label="Shadow length at 45° altitude",
                value=unscale(H / math.tan(math.radians(45)), unit),
                unit=unit_label,
                formula="H / tan(45°) = L",
                reference="tan(alt) = H / shadow; elementary gnomonics.",
            ),
            GeometryValue(
                key="noon_shadow_equinox",
                label="Noon shadow at equinox",
                value=unscale(sh(noon_equiv), unit),
                unit=unit_label,
                formula="H / tan(90 - phi)",
                reference="Meridian altitude gives noon shadow length.",
            ),
            GeometryValue(
                key="noon_shadow_summer",
                label="Noon shadow at summer solstice",
                value=unscale(sh(noon_sum), unit),
                unit=unit_label,
                formula="H / tan(90 - phi + 23.44)",
                reference="Shortest midday shadow around the summer solstice.",
            ),
            GeometryValue(
                key="noon_shadow_winter",
                label="Noon shadow at winter solstice",
                value=unscale(sh(noon_win), unit),
                unit=unit_label,
                formula="H / tan(90 - phi - 23.44)",
                reference="Longest midday shadow around the winter solstice.",
            ),
        ]

        svg = _build_svg(L=L, H=H, phi=phi, noon_equiv=noon_equiv, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "plank_length", "value": size_param, "unit": unit_label},
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
                    "Elementary gnomonics (shadow-tangent relation).",
                ],
            },
        )
        return spec


def _build_svg(*, L: float, H: float, phi: float, noon_equiv: float, unit: str) -> dict:
    """Side elevation: plank with vertical gnomon casting a shadow."""
    scale = 20.0
    pad = 45.0
    Lpx = L * scale
    Hpx = H * scale
    ground_x = pad
    ground_y = pad + Hpx          # plank surface line y
    top_x = ground_x + 0.35 * Lpx  # gnomon at ~1/3 along the plank

    lines = [
        line(ground_x, ground_y, ground_x + Lpx, ground_y, "#7f8c8d", 4),   # plank
        line(top_x, ground_y, top_x, ground_y - Hpx, "#2c3e50", 5),         # gnomon
        text(top_x + 6, ground_y - Hpx + 14, "gnomon H=L", size=9, fill="#2c3e50", anchor="start"),
        text(ground_x + 6, ground_y - 10, "plank L", size=9, fill="#7f8c8d", anchor="start"),
    ]
    # scale ticks along the plank for shadow length → altitude
    for alt in [30, 45, 60, 75]:
        slen = H / math.tan(math.radians(alt))
        if slen <= L:
            tx = top_x + slen * scale
            lines.append(line(tx, ground_y - 6, tx, ground_y + 6, "#2980b9", 2))
            lines.append(text(tx, ground_y + 16, f"{alt}°", size=9, fill="#2980b9"))
    # noon-equinox shadow as a red ray
    noon_sh = H / math.tan(math.radians(noon_equiv))
    if noon_sh <= L:
        nx = top_x + noon_sh * scale
        lines.append(line(top_x, ground_y - Hpx, nx, ground_y, "#e74c3c", 1.5))
        lines.append(text(nx, ground_y - 8, f"noon {noon_equiv:.1f}°", size=9, fill="#e74c3c", anchor="start"))

    lines.append(text(ground_x + Lpx / 2, pad - 6, f"PALAKA — φ = {phi:.1f}°", size=12, fill="#1a5276"))
    view_w = Lpx + 2 * pad
    view_h = Hpx + 2 * pad
    return {"elevation": wrap_svg(view_w, view_h, "".join(lines))}
