"""Preset historical reference observatory sites (Jantar Mantar locations).

Longitudes reflect the observatory coordinates as commonly published.
"""

from __future__ import annotations

REFERENCE_SITES: list[dict] = [
    {
        "id": "jaipur",
        "name": "Jaipur",
        "lat": 26.9239,
        "lon": 75.8267,
        "note": "Largest and best-preserved observatory; UNESCO World Heritage.",
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "lat": 28.6271,
        "lon": 77.2166,
        "note": "One of the original five observatories (1724).",
    },
    {
        "id": "varanasi",
        "name": "Varanasi",
        "lat": 25.3176,
        "lon": 82.9739,
        "note": "Varanasi observatory.",
    },
    {
        "id": "ujjain",
        "name": "Ujjain (Vedh Shala)",
        "lat": 23.1765,
        "lon": 75.7885,
        "note": "Classical centre of Indian astronomy; near the historic meridian.",
    },
    {
        "id": "mathura",
        "name": "Mathura",
        "lat": 27.4924,
        "lon": 77.6737,
        "note": "Observatory largely destroyed before 1857.",
    },
]
