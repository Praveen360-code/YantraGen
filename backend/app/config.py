"""Application configuration and constants."""

from __future__ import annotations

# Reference meridians (degrees east) and their labels.
REFERENCE_MERIDIANS: dict[str, float] = {
    "ist": 82.5,    # Indian Standard Time meridian
    "ujjain": 75.7,  # historic Ujjain meridian (~Dongla)
    "greenwich": 0.0,
}

# Supported length units and their conversion metadata.
UNITS: dict[str, str] = {
    "m": "metre",
    "ft": "foot",
}

APP_TITLE = "YantraGen"
APP_DESCRIPTION = (
    "Compute and visualize the dimensions of ancient Indian astronomical "
    "instruments (yantras) for any latitude/longitude in India."
)
