"""Unit tests for the Samrat Yantra against published Jaipur/Delhi dimensions.

Regression fixtures
-------------------
* Jaipur (phi = 26.9 deg): published gnomon slant ~ 22.6 m
  (jantarmantar.org 3D reconstruction built on Virendra Sharma's measurements;
  frequently cited as "the gnomon rises 22.6 m / 74 ft").  Expected vertical
  height ~ 22.6 * sin(26.9) ~ 10.2 m and base ~ 20.1 m.
* Delhi (phi = 28.6 deg): published gnomon slant ~ 20.7 m (ibid.), giving a
  vertical height ~ 9.9 m.

Only ratios that are independent of the site's absolute scale are tested with
the published values; where published lengths are used they are the slant
(H) values quoted in the literature, then the derived ratios are asserted.
"""

from __future__ import annotations

import math

import pytest

from app.yantras.samrat import SamratYantra
from app.core import trig


@pytest.fixture
def samrat() -> SamratYantra:
    return SamratYantra()


def test_jaipur_gnomon_heights_match_published(samrat):
    """Jaipur: published slant ~22.6 m -> height ~10.2 m, base ~20.2 m."""
    spec = samrat.compute(lat=26.9, lon=75.8267, size_param=22.6, unit="m")
    values = {v.key: v.value for v in spec.values}

    # Hypotenuse inclined at latitude => H_v = H sin(phi)
    assert values["gnomon_height"] == pytest.approx(22.6 * math.sin(math.radians(26.9)), abs=0.05)
    assert values["base_length"] == pytest.approx(22.6 * math.cos(math.radians(26.9)), abs=0.05)
    # Sanity: vertical height around 10.2 m from published data
    assert values["gnomon_height"] == pytest.approx(10.2, abs=0.2)
    # Quadrant radius equals slant
    assert values["quadrant_radius"] == pytest.approx(22.6)


def test_delhi_gnomon_heights_match_published(samrat):
    """Delhi: published slant ~20.7 m -> height ~9.9 m."""
    spec = samrat.compute(lat=28.6, lon=77.2166, size_param=20.7, unit="m")
    values = {v.key: v.value for v in spec.values}
    assert values["gnomon_height"] == pytest.approx(20.7 * math.sin(math.radians(28.6)), abs=0.05)
    assert values["gnomon_height"] == pytest.approx(9.9, abs=0.2)


def test_latitude_dependence_changes_geometry(samrat):
    """Higher latitude -> taller, shorter gnomon; same slant scale."""
    north = samrat.compute(lat=32.0, lon=77.0, size_param=10.0, unit="m")
    south = samrat.compute(lat=8.0, lon=77.0, size_param=10.0, unit="m")
    n = {v.key: v.value for v in north.values}
    s = {v.key: v.value for v in south.values}
    assert n["gnomon_height"] > s["gnomon_height"]
    assert n["base_length"] < s["base_length"]


def test_unit_conversion(samrat):
    m_spec = samrat.compute(lat=26.9, lon=75.8267, size_param=20.0, unit="m")
    ft_spec = samrat.compute(lat=26.9, lon=75.8267, size_param=20.0, unit="ft")
    mv = {v.key: v.value for v in m_spec.values}
    fv = {v.key: v.value for v in ft_spec.values}
    assert fv["gnomon_height"] == pytest.approx(mv["gnomon_height"] / 0.3048, rel=1e-6)


def test_hour_lines_spacing(samrat):
    spec = samrat.compute(lat=26.9, lon=75.8267, size_param=10.0, unit="m")
    assert len(spec.hour_lines) == 13  # -6 .. +6
    # uniform 15-degree spacing
    assert spec.hour_lines[6]["angle_deg"] == 0.0  # noon
    assert spec.hour_lines[0]["angle_deg"] == -90.0  # 6am


def test_longitude_offset(samrat):
    # East of IST meridian (82.5E) means local apparent noon occurs earlier
    # than IST noon => negative offset when lon > 82.5.
    spec = samrat.compute(lat=26.9, lon=90.0, size_param=10.0, unit="m", reference_meridian=82.5)
    off = {v.key: v.value for v in spec.values}["longitude_offset"]
    assert off == pytest.approx((82.5 - 90.0) / 15.0)


def test_negative_size_rejected(samrat):
    with pytest.raises(ValueError):
        samrat.compute(lat=26.9, lon=75.8, size_param=-5.0, unit="m")


def test_solar_position_equinox_noon():
    """At local noon on an equinox at 26.9N, elevation ~ 90-26.9 = 63.1 deg."""
    pos = trig.sun_position(latitude_deg=26.9, declination_deg=0.0, hour_angle_deg_=0.0)
    assert pos["elevation"] == pytest.approx(90.0 - 26.9, abs=0.5)
    # At local noon the azimuth points due south (180) in the northern hemisphere.
    assert pos["azimuth"] == pytest.approx(180.0, abs=1.0)


def test_solar_declination_solstice_range():
    # Declination wraps within +-23.45 over the year.
    midsummer = trig.solar_declination(172)
    midwinter = trig.solar_declination(355)
    assert midsummer > 20
    assert midwinter < -20
