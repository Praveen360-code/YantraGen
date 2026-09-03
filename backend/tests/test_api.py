"""API-level integration tests using FastAPI TestClient."""

from __future__ import annotations

from fastapi.testclient import TestClient

import pytest

from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["app"] == "YantraGen"


def test_yantra_types():
    r = client.get("/api/yantra/types")
    assert r.status_code == 200
    types = {i["type"] for i in r.json()["instruments"]}
    assert "samrat" in types
    assert "rama" in types
    expected = {
        "samrat",
        "dakshinottara_bhitti",
        "rama",
        "digamsa",
        "nadi_valaya",
        "chaapa",
        "palaka",
        "dhruva_protha_chakra",
        "yantra_samrat",
        "gola_chakra",
        "bhitti",
        "rasivalaya",
    }
    assert expected <= types
    assert all(i["status"] == "ready" for i in r.json()["instruments"])


def test_reference_sites():
    r = client.get("/api/reference-sites")
    assert r.status_code == 200
    names = {s["name"] for s in r.json()["sites"]}
    assert {"Jaipur", "Delhi", "Ujjain (Vedh Shala)"} <= names


def test_dimensions_samrat_jaipur():
    r = client.post(
        "/api/yantra/samrat/dimensions",
        json={"lat": 26.9, "long": 75.8267, "size_param": 22.6, "unit": "m"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["yantra_type"] == "samrat"
    assert body["validation"]["valid"] is True
    vals = {v["key"]: v["value"] for v in body["values"]}
    assert vals["quadrant_radius"] == 22.6
    assert "elevation" in body["svg"]


def test_dimensions_outside_india_rejected():
    r = client.post(
        "/api/yantra/samrat/dimensions",
        json={"lat": 45.0, "long": 10.0, "size_param": 10.0},
    )
    assert r.status_code == 422


def test_unknown_yantra_404():
    r = client.post(
        "/api/yantra/bogus/dimensions",
        json={"lat": 26.9, "long": 75.8, "size_param": 10.0},
    )
    assert r.status_code == 404


def test_each_instrument_dimensions_ready():
    for t in [
        "dakshinottara_bhitti",
        "rama",
        "digamsa",
        "nadi_valaya",
        "chaapa",
        "palaka",
        "dhruva_protha_chakra",
        "yantra_samrat",
        "gola_chakra",
        "bhitti",
        "rasivalaya",
    ]:
        r = client.post(
            f"/api/yantra/{t}/dimensions",
            json={"lat": 26.9, "long": 75.8, "size_param": 4.0, "unit": "m"},
        )
        assert r.status_code == 200, f"{t} -> {r.status_code}: {r.text}"
        body = r.json()
        assert body["yantra_type"] == t
        assert body["validation"]["valid"] is True
        assert len(body["values"]) > 0


def test_validate_endpoint():
    r = client.post("/api/yantra/samrat/validate", json={"lat": 26.9, "long": 75.8})
    assert r.status_code == 200
    assert r.json()["valid"] is True


def test_export_csv():
    r = client.post(
        "/api/yantra/samrat/export",
        json={"yantra_type": "samrat", "lat": 26.9, "long": 75.8, "size_param": 20.0, "format": "csv"},
    )
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert "gnomon_height" in r.text


def test_export_dxf():
    r = client.post(
        "/api/yantra/samrat/export",
        json={"yantra_type": "samrat", "lat": 26.9, "long": 75.8, "size_param": 20.0, "format": "dxf"},
    )
    assert r.status_code == 200
    assert r.text.startswith("0\nSECTION")
    assert "EOF" in r.text


def test_export_pdf():
    r = client.post(
        "/api/yantra/samrat/export",
        json={"yantra_type": "samrat", "lat": 26.9, "long": 75.8, "size_param": 20.0, "format": "pdf"},
    )
    assert r.status_code == 200
    assert r.content[:5] == b"%PDF-"
    assert b"%%EOF" in r.content


@pytest.mark.parametrize(
    "t",
    [
        "dakshinottara_bhitti",
        "rama",
        "digamsa",
        "nadi_valaya",
        "chaapa",
        "palaka",
        "dhruva_protha_chakra",
        "yantra_samrat",
        "gola_chakra",
        "bhitti",
        "rasivalaya",
    ],
)
def test_export_csv_for_each_yantra(t):
    r = client.post(
        f"/api/yantra/{t}/export",
        json={"yantra_type": t, "lat": 26.9, "long": 75.8, "size_param": 4.0, "format": "csv"},
    )
    assert r.status_code == 200, f"{t} csv -> {r.status_code}: {r.text}"
    assert "text/csv" in r.headers["content-type"]


@pytest.mark.parametrize(
    "t",
    [
        "dakshinottara_bhitti",
        "rama",
        "digamsa",
        "nadi_valaya",
        "chaapa",
        "palaka",
        "dhruva_protha_chakra",
        "yantra_samrat",
        "gola_chakra",
        "bhitti",
        "rasivalaya",
    ],
)
def test_export_dxf_for_each_yantra(t):
    r = client.post(
        f"/api/yantra/{t}/export",
        json={"yantra_type": t, "lat": 26.9, "long": 75.8, "size_param": 4.0, "format": "dxf"},
    )
    assert r.status_code == 200, f"{t} dxf -> {r.status_code}: {r.text}"
    assert r.text.startswith("0\nSECTION")
