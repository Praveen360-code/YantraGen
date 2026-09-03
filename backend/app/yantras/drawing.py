"""Small shared helpers for assembling SVG fragments across yantra modules."""

from __future__ import annotations

import math
import re

_HEX = re.compile(r"(#[0-9a-fA-F]{6})")


def mono(hex_color: str) -> str:
    """Convert a hex colour to an equivalent grayscale via relative luminance.

    Used to render the entire yantra SVG output in a consistent monochrome
    tone (lighter fills become light greys, darker strokes dark greys).
    """
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return hex_color
    try:
        r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return hex_color
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    gv = int(round(lum))
    return f"#{gv:02x}{gv:02x}{gv:02x}"


def monochromeize(markup: str) -> str:
    """Replace every ``#rrggbb`` colour in an SVG fragment with its greyscale."""
    return _HEX.sub(lambda m: mono(m.group(1)), markup)


def unscale(value_m: float, unit: str) -> float:
    """Convert a metre value into the requested output unit (``m`` or ``ft``)."""
    if unit == "ft":
        return value_m / 0.3048
    return value_m  # default metres


def wrap_svg(view_w: float, view_h: float, inner: str, bg: str = "#fafafa") -> str:
    """Wrap inner SVG markup in a complete, self-contained <svg> document."""
    inner = monochromeize(inner)
    bg = mono(bg)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:.0f} {view_h:.0f}" '
        f'width="100%" height="100%">'
        f'<rect width="100%" height="100%" fill="{bg}"/>'
        f'<g>{inner}</g>'
        f'</svg>'
    )


def line(x1: float, y1: float, x2: float, y2: float, stroke: str, width: float = 1.5) -> str:
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'stroke="{stroke}" stroke-width="{width}"/>'
    )


def circle(cx: float, cy: float, r: float, fill: str, stroke: str, width: float = 1.5) -> str:
    return (
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}" '
        f'stroke="{stroke}" stroke-width="{width}"/>'
    )


def text(x: float, y: float, content: str, size: int = 11, fill: str = "#2c3e50", anchor: str = "middle") -> str:
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" '
        f'text-anchor="{anchor}">{content}</text>'
    )


def arc(cx: float, cy: float, r: float, start_deg: float, end_deg: float, stroke: str, width: float = 3.0) -> str:
    """An SVG arc from start_deg to end_deg (degrees, CCW from +x axis, y-down)."""
    a0 = math.radians(start_deg)
    a1 = math.radians(end_deg)
    x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
    x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    # large-arc flag 0 for spanning <=180, sweep 1 since angles increase downward in SVG
    span = abs(end_deg - start_deg)
    large = 1 if span > 180 else 0
    return (
        f'<path d="M {x0:.1f} {y0:.1f} A {r:.1f} {r:.1f} 0 {large} 1 {x1:.1f} {y1:.1f}" '
        f'fill="none" stroke="{stroke}" stroke-width="{width}"/>'
    )
