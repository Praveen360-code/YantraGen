"""Pydantic request/response models for the API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class DimensionsRequest(BaseModel):
    """Body for ``POST /api/yantra/{type}/dimensions``."""

    lat: float = Field(..., ge=-90, le=90, description="Site latitude, degrees north.")
    long: float = Field(..., ge=-180, le=180, description="Site longitude, degrees east.")
    size_param: float = Field(..., gt=0, description="Instrument scale size, in the given unit.")
    unit: Literal["m", "ft"] = "m"
    reference_meridian: str = Field(
        "ist",
        description="One of 'ist', 'ujjain', 'greenwich' or a raw longitude float.",
    )
    reference_meridian_custom: float | None = Field(
        None, ge=-180, le=180, description="Optional custom reference meridian (east)."
    )

    @field_validator("reference_meridian")
    @classmethod
    def _valid_meridian(cls, v: str) -> str:
        allowed = {"ist", "ujjain", "greenwich"}
        if v not in allowed:
            raise ValueError(
                f"reference_meridian must be one of {sorted(allowed)} or use reference_meridian_custom"
            )
        return v


class ValidateRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    long: float = Field(..., ge=-180, le=180)


class ExportRequest(DimensionsRequest):
    yantra_type: str
    format: Literal["csv", "dxf", "pdf"] = "csv"


def resolve_reference_meridian(req: DimensionsRequest) -> float:
    """Resolve the reference-meridian choice to a longitude."""
    if req.reference_meridian_custom is not None:
        return req.reference_meridian_custom
    return {"ist": 82.5, "ujjain": 75.7, "greenwich": 0.0}[req.reference_meridian]
