"""Rasivalaya Yantra (twelve zodiac dials) computation module.

The *Rasivalaya* (rashi = zodiac sign, valaya = circle) consists of twelve
small equatorial gnomon dials, one for each zodiac sign (rashi).  As the Sun
moves through the ecliptic it enters a fresh sign every ~30 degrees; the dial
named for that sign then carries the shadow, letting the observer read the
ecliptic longitude directly, along with the Sun's declination for that sign.

The link between the ecliptic and the equator is the **obliquity** 23.44 deg:

    delta = asin( sin(23.44) * sin(lambda) )

where lambda is the Sun's ecliptic longitude and delta its declination.  The
twelve sign-boundaries sit at lambda = 0, 30, 60, ... 330 deg, giving:

    declination 0        at Mesh (Aries, 0)   and Tula (Libra, 180)
    declination +23.44   at Karka (Cancer, 90)
    declination -23.44   at Makara (Capricorn, 270)

Each dial is an equatorial ring of the size parameter R, so the layout scales
with a single radius.

Reference / context: classical Indian zodiac-dial instruments (Rasivalaya);
Roy & Clarke, Astronomy: Principles and Practice (ecliptic-obliquity relation).
Educational tool -- not for precision measurement.
"""

from __future__ import annotations

import math

from .base import GeometryValue, Yantra, YantraSpec
from .drawing import circle, line, text, unscale, wrap_svg

_O = 23.44

# (machine suffix, display name, sign English name, ecliptic longitude of start, glyph)
_ZODIAC = [
    ("mesh", "Mesh Rashi", "Aries", 0.0, "♈"),
    ("vrishabha", "Vrishabha Rashi", "Taurus", 30.0, "♉"),
    ("mithuna", "Mithuna Rashi", "Gemini", 60.0, "♊"),
    ("karka", "Karka Rashi", "Cancer", 90.0, "♋"),
    ("simha", "Simha Rashi", "Leo", 120.0, "♌"),
    ("kanya", "Kanya Rashi", "Virgo", 150.0, "♍"),
    ("tula", "Tula Rashi", "Libra", 180.0, "♎"),
    ("vrishchika", "Vrishchika Rashi", "Scorpio", 210.0, "♏"),
    ("dhanu", "Dhanu Rashi", "Sagittarius", 240.0, "♐"),
    ("makara", "Makara Rashi", "Capricorn", 270.0, "♑"),
    ("kumbha", "Kumbha Rashi", "Aquarius", 300.0, "♒"),
    ("meena", "Meena Rashi", "Pisces", 330.0, "♓"),
]


def _declination_of_longitude(lon: float) -> float:
    """delta = asin(sin(obliquity) * sin(ecliptic longitude))."""
    return math.degrees(
        math.asin(math.sin(math.radians(_O)) * math.sin(math.radians(lon)))
    )


class RasivalayaYantra(Yantra):
    """Twelve zodiac gnomon dials measuring ecliptic longitude and declination."""

    type_name = "rasivalaya"
    display_name = "Rasivalaya Yantra (Zodiac Dials)"
    description = (
        "Twelve equatorial dials, one per zodiac sign, that map the Sun's "
        "ecliptic longitude onto declination through the obliquity 23.44."
    )
    required_params = ["dial_radius"]

    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        if size_param <= 0:
            raise ValueError("dial_radius must be positive")

        R = float(size_param)
        phi = float(lat)
        unit_label = "m" if unit == "m" else "ft"

        values = [
            GeometryValue(
                key="dial_radius",
                label="Dial radius",
                value=unscale(R, unit),
                unit=unit_label,
                formula="R (user size parameter)",
                reference="Radius shared by all twelve dials.",
            ),
            GeometryValue(
                key="dial_count",
                label="Number of dials",
                value=12.0,
                unit="",
                formula="12 zodiac signs",
                reference="One equatorial dial per sign (Rashi).",
            ),
            GeometryValue(
                key="ecliptic_obliquity",
                label="Obliquity of the ecliptic",
                value=_O,
                unit="deg",
                formula="23.44",
                reference="Ecliptic inclined to the equator (Roy & Clarke).",
            ),
            GeometryValue(
                key="equator_crossings",
                label="Equinox crossings (declination 0)",
                value=2.0,
                unit="",
                formula="λ = 0 and 180 deg",
                reference="Mesh (Aries) and Tula (Libra) dials.",
            ),
        ]
        # one row per zodiac sign: ecliptic longitude at start + declination
        for key, name, ename, lon, _g in _ZODIAC:
            dec = _declination_of_longitude(lon)
            values.append(
                GeometryValue(
                    key=f"rashi_{key}",
                    label=name,
                    value=round(dec, 3),
                    unit="deg",
                    formula=f"asin(sin 23.44 * sin {lon:.0f}°)",
                    reference=f"{ename}; declination at the sign's start (λ = {lon:.0f}°).",
                )
            )

        svg = _build_svg(R=R, phi=phi, unit=unit)
        spec = YantraSpec(
            yantra_type=self.type_name,
            lat=lat,
            lon=lon,
            size_param={"key": "dial_radius", "value": size_param, "unit": unit_label},
            values=values,
            svg=svg,
            meta={
                "display_name": self.display_name,
                "description": self.description,
                "disclaimer": (
                    "Educational / research tool; declinations from the classical "
                    "obliquity relation. Not for precision measurement."
                ),
                "references": [
                    "Classical Indian zodiac-dial (Rasivalaya) instruments.",
                    "Roy & Clarke, Astronomy: Principles and Practice (ecliptic-obliquity).",
                ],
            },
        )
        return spec


def _build_svg(*, R: float, phi: float, unit: str) -> dict:
    """Zodiac wheel: twelve dials around the ecliptic, plus a dial face."""
    scale = 26.0
    pad = 44.0
    r = R * scale
    cx = r + pad + 20
    cy = r + pad + 20
    view = 2 * r + 2 * pad + 20

    parts = [circle(cx, cy, r, "#f4f7fb", "#2c3e50", 2.5)]
    # equatorial circle reference (declination 0)
    parts += [circle(cx, cy, r * math.cos(math.radians(_O)), "none", "#2980b9", 1.2)]
    # place each of the 12 signs on the wheel
    for i, (key, name, ename, lon, glyph) in enumerate(_ZODIAC):
        # place sign at its ecliptic longitude (measured from Vernal equinox ~360deg = top)
        ang = math.radians(lon + 90.0)
        px = cx + (r - 8) * math.cos(ang)
        py = cy - (r - 8) * math.sin(ang)
        tcol = "#c0392b" if i % 2 == 0 else "#1a5276"
        parts.append(text(px, py, glyph, size=16, fill=tcol))
        parts.append(text(px, py + 14, f"{ename}", size=8, fill="#7f8c8d"))
        # radial spoke to the sign
        parts.append(line(cx, cy, px, py, "#d7e2f2", 1))

    parts.append(text(cx, view - 12, f"RASIVALAYA (zodiac dials) — φ = {phi:.1f}°",
                      size=12, fill="#1a5276"))
    wheel_svg = wrap_svg(view, view, "".join(parts))

    # representative dial face: equatorial hour ring, 15 deg/hour
    dr = 70.0
    dcx, dcy = dr + 40, dr + 40
    dial = [circle(dcx, dcy, dr, "#eef2f7", "#2c3e50", 2.5)]
    for hr in range(0, 24):
        a = math.radians(90.0 - 15.0 * hr)
        x0 = dcx + (dr - 6) * math.cos(a)
        y0 = dcy - (dr - 6) * math.sin(a)
        x1 = dcx + dr * math.cos(a)
        y1 = dcy - dr * math.sin(a)
        dial.append(line(x0, y0, x1, y1, "#7f8c8d" if hr % 3 else "#34495e", 1.5 if hr % 3 else 2))
        if hr % 3 == 0:
            dial.append(text(dcx + (dr - 18) * math.cos(a), dcy - (dr - 18) * math.sin(a),
                             str(hr) if hr != 0 else "0", size=9, fill="#2c3e50"))
    dial.append(text(dcx, dcy + dr + 22, "Sample dial: equatorial, 15°/h (Rashi dials are similar)",
                     size=9, fill="#1a5276"))
    dial_svg = wrap_svg(2 * dr + 80, 2 * dr + 76, "".join(dial))

    return {"zodiac_wheel": wheel_svg, "dial_face": dial_svg}
