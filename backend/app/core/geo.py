"""Geographic constraints.

India-specific bounding constraints live ONLY here so that the trigonometric
core in :mod:`app.core.trig` stays fully general and can be re-used for other
regions later. If the tool ever needs to support another country, add another
:class:`BoundingBox` here without touching the math.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BoundingBox:
    """Axis-aligned bounding box for a country/region.

    Attributes
    ----------
    name
        Human-readable label (e.g. "India").
    min_lat, max_lat
        Southern / northern latitude bounds, degrees.
    min_lon, max_lon
        Western / eastern longitude bounds, degrees.
    """

    name: str
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

    def contains(self, lat: float, lon: float) -> bool:
        """Whether a coordinate lies (inclusively) inside the box."""
        return (
            self.min_lat <= lat <= self.max_lat
            and self.min_lon <= lon <= self.max_lon
        )


# Mainland India extent (spec: 6N-37N, 68E-97E). The spec gives an overall
# bounding box; note that India's actual outline is concave, so a point inside
# this box could still be outside the country (e.g. offshore). We therefore
# expose a *conservative core* box too, to produce a warning rather than a
# hard error for borderline points.
INDIA_BBOX = BoundingBox(name="India", min_lat=6.0, max_lat=37.0, min_lon=68.0, max_lon=97.0)
INDIA_CORE_BBOX = BoundingBox(name="India (land-core)", min_lat=8.0, max_lat=35.5, min_lon=72.0, max_lon=90.0)


def validate_india(lat: float, lon: float) -> dict:
    """Validate lat/long against the India extent.

    Returns a dict describing the outcome; the caller turns this into the API
    response shape.  The trig core never calls this function -- geography is
    intentionally decoupled from mathematics.

    Parameters
    ----------
    lat
        Latitude, degrees.
    lon
        Longitude, degrees.

    Returns
    -------
    dict
        ``{"valid": bool, "errors": [...], "warnings": [...]}``.
    """
    errors: list[str] = []
    warnings: list[str] = []

    if not (-90.0 <= lat <= 90.0):
        errors.append(f"Latitude {lat} outside valid range [-90, 90].")
    if not (-180.0 <= lon <= 180.0):
        errors.append(f"Longitude {lon} outside valid range [-180, 180].")

    if errors:
        return {"valid": False, "errors": errors, "warnings": warnings}

    if not INDIA_BBOX.contains(lat, lon):
        errors.append(
            f"Coordinates ({lat:.4f}, {lon:.4f}) are outside {INDIA_BBOX.name} "
            f"({INDIA_BBOX.min_lat}N-{INDIA_BBOX.max_lat}N, "
            f"{INDIA_BBOX.min_lon}E-{INDIA_BBOX.max_lon}E)."
        )
    elif not INDIA_CORE_BBOX.contains(lat, lon):
        warnings.append(
            "Point lies within the overall India bounding box but outside the "
            "conservative land-core box; it may fall just offshore or at an "
            "extreme edge. Proceeding anyway."
        )

    return {"valid": not errors, "errors": errors, "warnings": warnings}
