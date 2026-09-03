"""Export utilities: CSV, DXF and PDF serialisation of a YantraSpec.

All outputs are generated from the already-computed ``YantraSpec`` -- no
re-computation happens here.
"""

from __future__ import annotations

import csv
import io
from typing import Any


def spec_to_csv(spec: dict) -> str:
    """Return a CSV string of the numeric spec table."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Instrument", spec["yantra_type"]])
    writer.writerow(["Latitude", spec["lat"]])
    writer.writerow(["Longitude", spec["lon"]])
    writer.writerow(["Size parameter", str(spec["size_param"])])
    writer.writerow(["Key", "Label", "Value", "Unit", "Formula"])
    for v in spec["values"]:
        writer.writerow([v["key"], v["label"], v["value"], v["unit"], v["formula"]])
    if spec.get("hour_lines"):
        writer.writerow([])
        writer.writerow(["Hour (from noon)", "Angle (deg)"])
        for h in spec["hour_lines"]:
            writer.writerow([h["hour"], h["angle_deg"]])
    return buf.getvalue()


def spec_to_dxf(spec: dict) -> str:
    """Return an ASCII DXF (R12) drawing of the SVG line geometry.

    Extracts coordinate pairs from the ``elevation`` SVG fragment, which
    contains <line x1 y1 x2 y2 .../> entities with coordinates in metres.
    """
    lines: list[tuple[float, float, float, float]] = []
    svg = spec.get("svg", {}).get("elevation", "")
    import re

    for m in re.finditer(
        r"<line x1=\"([-\d.]+)\" y1=\"([-\d.]+)\" x2=\"([-\d.]+)\" y2=\"([-\d.]+)\"",
        svg,
    ):
        lines.append(tuple(float(g) for g in m.groups()))  # type: ignore[arg-type]

    s = ["0", "SECTION", "2", "ENTITIES"]
    for x1, y1, x2, y2 in lines:
        s += [
            "0", "LINE",
            "8", "YANTRA",
            "10", f"{x1:.3f}",
            "20", f"{y1:.3f}",
            "30", "0",
            "11", f"{x2:.3f}",
            "21", f"{y2:.3f}",
            "31", "0",
        ]
    s += ["0", "ENDSEC", "0", "EOF"]
    return "\n".join(s) + "\n"


def _escape_pdf(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def spec_to_pdf(spec: dict) -> bytes:
    """Return a minimal, dependency-free PDF with the spec as text.

    A hand-rolled single-page PDF writer (Helvetica text layout).  Keeps the
    backend light while still offering a genuine PDF artifact for the export
    endpoint.  For nicer charts, export SVG instead and convert in CAD.
    """
    objects: dict[int, str] = {}
    content_parts: list[str] = []
    y = 780
    content_parts.append(f"BT /F1 18 Tf 40 {y} Td ({_escape_pdf('YantraGen - ' + str(spec['yantra_type']))}) Tj ET")
    y -= 28

    def textblock(txt: str):
        nonlocal y
        if y < 60:
            return
        content_parts.append(f"BT /F1 11 Tf 40 {y} Td ({_escape_pdf(txt[:180])}) Tj ET")
        y -= 16

    textblock(f"Latitude:  {spec['lat']}   Longitude:  {spec['lon']}")
    textblock(f"Size parameter:  {spec['size_param']}")
    textblock("-" * 90)
    for v in spec["values"]:
        textblock(f"{v['label']:<40} {v['value']:<12} {v['unit']:<6} {v['formula']}")
    textblock("-" * 90)
    textblock("Educational / research tool -- not for precision timekeeping.")

    content = "\n".join(content_parts)

    # PDF object assembly
    objs: list[str] = []
    n = 1
    # catalog
    objs.append(f"<< /Type /Catalog /Pages 2 0 R >>")
    # pages
    objs.append(f"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    # page
    objs.append(
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        f"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
    )
    # font
    objs.append(f"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    # content stream
    objs.append(f"<< /Length {len(content.encode('latin-1', 'replace'))} >>\nstream\n{content}\nendstream")

    # build the body with its byte-offset table
    body = bytearray()
    offset_map: list[int] = []
    for i, o in enumerate(objs, start=1):
        offset_map.append(len(body))
        obj_str = f"{i} 0 obj\n{o}\nendobj\n"
        body.extend(obj_str.encode("latin-1", "replace"))

    head = "%PDF-1.4\n".encode("latin-1")
    trailer_start = len(head) + len(body)
    xref = f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n"
    for off in offset_map:
        xref += f"{off:010d} 00000 n \n"
    xref += f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{trailer_start}\n%%EOF"

    return head + bytes(body) + xref.encode("latin-1")


def export_spec(spec: dict, fmt: str) -> tuple[Any, str, str]:
    """Return ``(payload, mimetype, filename)`` for a requested format.

    fmt one of ``csv``, ``dxf``, ``pdf``.
    """
    base = f"yantragen_{spec['yantra_type']}"
    fmt = fmt.lower()
    if fmt == "csv":
        return spec_to_csv(spec), "text/csv", f"{base}.csv"
    if fmt == "dxf":
        return spec_to_dxf(spec), "application/dxf", f"{base}.dxf"
    if fmt == "pdf":
        return spec_to_pdf(spec), "application/pdf", f"{base}.pdf"
    raise ValueError(f"Unsupported export format: {fmt}")
