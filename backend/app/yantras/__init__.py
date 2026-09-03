"""Yantra registry.

Maps machine names to their computation classes and holds metadata for the
GET /api/yantra/types endpoint.  New instruments are registered here.
"""

from __future__ import annotations

from .base import Yantra
from .samrat import SamratYantra
from .dakshinottara_bhitti import DakshinottaraBhittiYantra
from .rama import RamaYantra
from .digamsa import DigamsaYantra
from .nadi_valaya import NadiValayaYantra
from .chaapa import ChaapaYantra
from .palaka import PalakaYantra
from .dhruva_protha_chakra import DhruvaProthaChakraYantra
from .yantra_samrat import YantraSamratYantra
from .gola_chakra import GolaChakraYantra
from .bhitti import BhittiYantra
from .rasivalaya import RasivalayaYantra

# Registry of implemented instruments.
_IMPLEMENTED: dict[str, Yantra] = {
    SamratYantra.type_name: SamratYantra(),
    DakshinottaraBhittiYantra.type_name: DakshinottaraBhittiYantra(),
    RamaYantra.type_name: RamaYantra(),
    DigamsaYantra.type_name: DigamsaYantra(),
    NadiValayaYantra.type_name: NadiValayaYantra(),
    ChaapaYantra.type_name: ChaapaYantra(),
    PalakaYantra.type_name: PalakaYantra(),
    DhruvaProthaChakraYantra.type_name: DhruvaProthaChakraYantra(),
    YantraSamratYantra.type_name: YantraSamratYantra(),
    GolaChakraYantra.type_name: GolaChakraYantra(),
    BhittiYantra.type_name: BhittiYantra(),
    RasivalayaYantra.type_name: RasivalayaYantra(),
}

# Stretch-goal / not-yet-built instruments (marked "coming soon" in the UI).
_COMING_SOON: dict[str, object] = {}


def get_yantra(type_name: str) -> Yantra | None:
    """Return the computation module for a type name (None if unknown)."""
    return _IMPLEMENTED.get(type_name)


def list_yantras() -> list[dict]:
    """Return metadata for all instruments."""
    out: list[dict] = []
    for y in _IMPLEMENTED.values():
        out.append(
            {
                "type": y.type_name,
                "name": y.display_name,
                "description": y.description,
                "required_params": y.required_params,
                "status": "ready",
            }
        )
    return out
