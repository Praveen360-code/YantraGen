"""Tests for the geo validation module."""

from __future__ import annotations

from app.core import geo


def test_inside_india():
    assert geo.validate_india(26.9, 75.8)["valid"] is True


def test_outside_north():
    r = geo.validate_india(40.0, 75.0)
    assert r["valid"] is False
    assert any("outside India" in e for e in r["errors"])


def test_outside_west():
    r = geo.validate_india(26.0, 40.0)
    assert r["valid"] is False


def test_extreme_out_of_range():
    r = geo.validate_india(100.0, 200.0)
    assert r["valid"] is False
    assert len(r["errors"]) >= 2  # both lat and long flagged


def test_core_box_warning():
    # In overall box but outside land-core -> warning, still valid.
    r = geo.validate_india(7.0, 69.0)
    assert r["valid"] is True
    assert len(r["warnings"]) >= 1
