"""API route handlers."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .. import chat as chat_mod
from .. import export as export_mod
from .. import reference_sites
from ..core import geo
from ..schemas import (
    DimensionsRequest,
    ExportRequest,
    ValidateRequest,
    resolve_reference_meridian,
)
from ..yantras import get_yantra, list_yantras

router = APIRouter(prefix="/api")


class ChatRequest(BaseModel):
    messages: list[dict] = Field(..., min_length=1)
    model: str = "gemini-flash-lite-latest"


@router.get("/yantra/types")
def yantra_types():
    """List supported instruments with descriptions and required parameters."""
    return {"instruments": list_yantras()}


@router.get("/reference-sites")
def reference_sites_endpoint():
    """Preset historical observatory sites for quick comparison."""
    return {"sites": reference_sites.REFERENCE_SITES}


@router.post("/yantra/{yantra_type}/validate")
def validate(yantra_type: str, req: ValidateRequest):
    """Sanity-check coordinates against India's bounding box."""
    result = geo.validate_india(req.lat, req.long)
    y = get_yantra(yantra_type)
    result["yantra_type"] = yantra_type
    result["yantra_known"] = y is not None
    return result


@router.post("/yantra/{yantra_type}/dimensions")
def dimensions(yantra_type: str, req: DimensionsRequest):
    """Compute full geometric spec for a yantra at a site."""
    site = geo.validate_india(req.lat, req.long)
    if not site["valid"]:
        raise HTTPException(status_code=422, detail=site)

    y = get_yantra(yantra_type)
    if y is None:
        raise HTTPException(status_code=404, detail=f"Unknown yantra type: {yantra_type}")
    if getattr(y, "coming_soon", False):
        raise HTTPException(
            status_code=501,
            detail=f"{y.display_name} is not yet implemented (coming soon).",
        )

    meridian = resolve_reference_meridian(req)
    spec = y.compute(
        lat=req.lat,
        lon=req.long,
        size_param=req.size_param,
        unit=req.unit,
        reference_meridian=meridian,
    )
    payload = spec.to_dict()
    payload["validation"] = site
    return payload


@router.post("/yantra/{yantra_type}/export")
def export(yantra_type: str, req: ExportRequest, response: Response):
    """Export dimensions as CSV / DXF / PDF for fabrication or CAD use."""
    site = geo.validate_india(req.lat, req.long)
    if not site["valid"]:
        raise HTTPException(status_code=422, detail=site)

    if req.yantra_type != yantra_type:
        raise HTTPException(status_code=400, detail="Path/body yantra_type mismatch.")

    y = get_yantra(yantra_type)
    if y is None:
        raise HTTPException(status_code=404, detail=f"Unknown yantra type: {yantra_type}")
    if getattr(y, "coming_soon", False):
        raise HTTPException(status_code=501, detail="Not yet implemented (coming soon).")

    meridian = resolve_reference_meridian(req)
    spec = y.compute(
        lat=req.lat,
        lon=req.long,
        size_param=req.size_param,
        unit=req.unit,
        reference_meridian=meridian,
    ).to_dict()

    payload, mimetype, filename = export_mod.export_spec(spec, req.format)
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    if isinstance(payload, bytes):
        response.headers["Content-Type"] = mimetype
        return Response(content=payload, media_type=mimetype)
    return Response(content=payload, media_type=mimetype)


@router.post("/chat")
def chat(req: ChatRequest):
    """Stream an AI answer grounded in the website's content.

    Sends the conversation to a Gemini model with the YantraGen knowledge
    base injected as the system prompt, so the bot can answer a wide range of
    questions contextually. Requires ``GEMINI_API_KEY`` in the environment.
    """
    try:
        def gen():
            for delta in chat_mod.stream_chat(req.messages, model=req.model):
                yield json.dumps({"delta": delta}) + "\n"

        return StreamingResponse(
            gen(),
            media_type="application/x-ndjson",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # noqa: BLE001 - surface LLM errors to the client
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")
