"""Base classes / shared data model for yantra computation modules.

Each concrete yantra implements :class:`Yantra` and returns a
:class:`YantraSpec` -- a structured description of every angle, length,
radius and the geometry needed to render it in SVG.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class GeometryValue:
    """A single computed geometric quantity with its derivation note.

    Attributes
    ----------
    key
        Stable machine name (e.g. ``gnomon_height``).
    label
        Human readable label shown in the spec table.
    value
        Numeric value.
    unit
        Unit suffix (e.g. ``m``, ``ft``, ``deg``).
    formula
        Short LaTeX-ish formula string, shown on hover/expand.
    reference
        Citation of the classical / literature source.
    """

    key: str
    label: str
    value: float
    unit: str
    formula: str
    reference: str = ""


@dataclass
class YantraSpec:
    """Model for a full yantra computation result.

    Attributes
    ----------
    yantra_type
        Machine name of the instrument.
    lat, lon
        Requested site coordinates, degrees.
    size_param
        The user-supplied scale parameter (and its meaning, e.g. gnomon slant).
    values
        Ordered list of :class:`GeometryValue` (the numeric spec table).
    hour_lines
        List of ``{hour, angle_deg, x, y}`` dicts for drawing/table.
    svg
        List of SVG markup fragments (grouped path/shape strings).
    meta
        Free-form metadata (description, disclaimer, etc.).
    """

    yantra_type: str
    lat: float
    lon: float
    size_param: dict[str, Any]
    values: list[GeometryValue] = field(default_factory=list)
    hour_lines: list[dict[str, Any]] = field(default_factory=list)
    svg: dict[str, Any] = field(default_factory=dict)
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Serialize to a plain dict suitable for JSON responses."""
        return {
            "yantra_type": self.yantra_type,
            "lat": self.lat,
            "lon": self.lon,
            "size_param": self.size_param,
            "values": [
                {
                    "key": v.key,
                    "label": v.label,
                    "value": v.value,
                    "unit": v.unit,
                    "formula": v.formula,
                    "reference": v.reference,
                }
                for v in self.values
            ],
            "hour_lines": self.hour_lines,
            "svg": self.svg,
            "meta": self.meta,
        }


class Yantra(ABC):
    """Abstract base for a single instrument's pure computation module.

    Implementations must be side-effect free: they take plain numeric inputs
    and return a :class:`YantraSpec`.  They are intended to be unit-tested
    against published dimensions of the real Jaipur/Delhi instruments.
    """

    type_name: str
    display_name: str
    description: str
    required_params: list[str]

    @abstractmethod
    def compute(
        self,
        lat: float,
        lon: float,
        size_param: float,
        unit: str = "m",
        reference_meridian: float = 82.5,
    ) -> YantraSpec:
        """Compute the full geometric specification for this instrument.

        Parameters
        ----------
        lat
            Site latitude, degrees north.
        lon
            Site longitude, degrees east.
        size_param
            User-supplied scale value (see ``required_params`` for meaning).
        unit
            Output length unit: ``"m"`` or ``"ft"``.
        reference_meridian
            Longitude of the reference meridian (east, degrees) used for the
            time-correction display; 82.5 = IST, 75.7 = Ujjain.
        """
        raise NotImplementedError
