"""Unit tests for the Dakshinottara Bhitti, Rama, Digamsa, Nadi Valaya,
Chaapa, Palaka, Dhruva-Protha-Chakra, Yantra-Samrat, Gola-Chakra, Bhitti and
Rasivalaya yantras.

Fixtures use clean astronomical cross-checks (e.g. equinox: sun rises due East,
day length 12 h) and the published proportional rules (Rama: pillar = wall =
radius; Nadi Valaya: tilt by the latitude; Palaka: shadow = H/tan(alt)).
"""

from __future__ import annotations

import math

import pytest

from app.yantras.rama import RamaYantra
from app.yantras.digamsa import DigamsaYantra
from app.yantras.nadi_valaya import NadiValayaYantra
from app.yantras.chaapa import ChaapaYantra
from app.yantras.palaka import PalakaYantra
from app.yantras.dakshinottara_bhitti import DakshinottaraBhittiYantra
from app.yantras.dhruva_protha_chakra import DhruvaProthaChakraYantra
from app.yantras.yantra_samrat import YantraSamratYantra
from app.yantras.gola_chakra import GolaChakraYantra
from app.yantras.bhitti import BhittiYantra
from app.yantras.rasivalaya import RasivalayaYantra


def _vals(spec):
    return {v.key: v.value for v in spec.values}


# ---------------- Dakshinottara Bhitti (meridian wall) ---------------------

def test_dakshinottara_jaipur_noon_altitudes():
    spec = DakshinottaraBhittiYantra().compute(lat=26.9, lon=75.8, size_param=10.0, unit="m")
    v = _vals(spec)
    assert v["noon_altitude_equinox"] == pytest.approx(90 - 26.9, abs=0.01)
    assert v["noon_altitude_summer"] == pytest.approx(90 - 26.9 + 23.44, abs=0.01)
    assert v["noon_altitude_winter"] == pytest.approx(90 - 26.9 - 23.44, abs=0.01)
    assert v["arc_radius"] == pytest.approx(10.0)


def test_dakshinottara_scale_independent_of_size():
    # noon altitudes depend only on latitude, not on R
    a = _vals(DakshinottaraBhittiYantra().compute(lat=28.6, lon=77.2, size_param=5.0, unit="m"))
    b = _vals(DakshinottaraBhittiYantra().compute(lat=28.6, lon=77.2, size_param=50.0, unit="m"))
    assert a["noon_altitude_equinox"] == b["noon_altitude_equinox"]


# ------------------------ Rama Yantra --------------------------------------

def test_rama_pillar_wall_radius_equal():
    spec = RamaYantra().compute(lat=28.6, lon=77.2, size_param=1.85, unit="m")
    v = _vals(spec)
    assert v["inner_radius"] == pytest.approx(1.85)
    assert v["wall_height"] == pytest.approx(1.85)
    assert v["pillar_height"] == pytest.approx(1.85)


def test_rama_zenith_circles_tangent_relation():
    R = 4.0
    spec = RamaYantra().compute(lat=26.9, lon=75.8, size_param=R, unit="m")
    v = _vals(spec)
    assert v["zenith_15_circle"] == pytest.approx(R * math.tan(math.radians(15)), rel=1e-9)
    assert v["zenith_30_circle"] == pytest.approx(R * math.tan(math.radians(30)), rel=1e-9)
    assert v["zenith_45_circle"] == pytest.approx(R, rel=1e-9)  # tan(45)=1
    assert v["max_floor_zenith"] == 45.0


# ------------------------ Digamsa Yantra -----------------------------------

def test_digamsa_equinox_due_east():
    spec = DigamsaYantra().compute(lat=26.9, lon=75.8, size_param=10.0, unit="m")
    v = _vals(spec)
    assert v["sunrise_azimuth_equinox"] == pytest.approx(90.0, abs=1e-6)   # due East
    assert v["day_length_equinox"] == pytest.approx(12.0, abs=1e-6)         # 12 h


def test_digamsa_solstice_day_lengths():
    n = _vals(DigamsaYantra().compute(lat=26.9, lon=75.8, size_param=10.0, unit="m"))
    assert n["day_length_summer"] > n["day_length_equinox"] > n["day_length_winter"]
    # northern-summer sunrise azimuth < 90 (north of east)
    assert n["sunrise_azimuth_summer"] < n["sunrise_azimuth_equinox"]
    assert n["sunrise_azimuth_winter"] > n["sunrise_azimuth_equinox"]


def test_digamsa_formula_matches_spherical_trig():
    # independent recomputation of cos A = sin(delta)/cos(phi)
    phi, delta = 26.9, 23.44
    expected = math.degrees(math.acos(math.sin(math.radians(delta)) / math.cos(math.radians(phi))))
    v = _vals(DigamsaYantra().compute(lat=phi, lon=75.8, size_param=10.0, unit="m"))
    assert v["sunrise_azimuth_summer"] == pytest.approx(expected, abs=0.002)  # impl rounds to 3 dp


# ------------------------ Nadi Valaya --------------------------------------

def test_nadi_valaya_tilt_equals_latitude():
    spec = NadiValayaYantra().compute(lat=26.9, lon=75.8, size_param=5.0, unit="m")
    v = _vals(spec)
    assert v["disc_tilt"] == pytest.approx(26.9)
    assert v["hour_spacing"] == 15.0


# ------------------------ Chaapa Yantra ------------------------------------

def test_chaapa_chord_and_noon():
    spec = ChaapaYantra().compute(lat=26.9, lon=75.8, size_param=3.0, unit="m")
    v = _vals(spec)
    assert v["chord_length"] == pytest.approx(6.0)
    assert v["arc_length"] == pytest.approx(math.pi * 3.0, rel=1e-9)
    assert v["noon_altitude_equinox"] == pytest.approx(90 - 26.9, abs=0.01)


# ------------------------ Palaka Yantra ------------------------------------

def test_palaka_shadow_45_spans_plank():
    spec = PalakaYantra().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m")
    v = _vals(spec)
    assert v["gnomon_height"] == pytest.approx(4.0)
    assert v["shadow_45"] == pytest.approx(4.0)  # tan(45)=1


def test_palaka_noon_shadow_seasonal():
    v = _vals(PalakaYantra().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m"))
    # northern hemisphere: sun higher at summer noon => shorter shadow
    assert v["noon_shadow_summer"] < v["noon_shadow_equinox"] < v["noon_shadow_winter"]


# ---------------- Dhruva-Protha-Chakra Yantra (polar ring) ---------------

def test_dhruva_protha_chakra_axis_and_tropics():
    spec = DhruvaProthaChakraYantra().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m")
    v = _vals(spec)
    assert v["polar_axis_inclination"] == pytest.approx(26.9)
    assert v["pole_star_altitude"] == pytest.approx(26.9)
    assert v["declination_tropic"] == pytest.approx(23.44)
    assert v["declination_tropic_south"] == pytest.approx(-23.44)
    assert v["declination_span"] == pytest.approx(46.88)
    assert v["hour_angle_marks"] == 15.0


# ------------------------ Yantra-Samrat (combination) ---------------------

def test_yantra_samrat_combines_both_subsystems():
    H = 6.0
    phi = 26.9
    spec = YantraSamratYantra().compute(lat=phi, lon=75.8, size_param=H, unit="m")
    v = _vals(spec)
    # Samrat part
    assert v["quadrant_radius"] == pytest.approx(H)
    assert v["vertical_gnomon_height"] == pytest.approx(H * math.sin(math.radians(phi)), rel=1e-9)
    assert v["base_length"] == pytest.approx(H * math.cos(math.radians(phi)), rel=1e-9)
    # Dhruva part (shared axis)
    assert v["polar_axis_inclination"] == pytest.approx(phi)
    assert v["declination_span"] == pytest.approx(46.88)
    assert v["declination_ring_radius"] == pytest.approx(0.6 * H)


# ------------------------ Gola-Yantra / Chakra (armillary) ---------------

def test_gola_chakra_equator_and_ecliptic():
    phi = 26.9
    spec = GolaChakraYantra().compute(lat=phi, lon=75.8, size_param=5.0, unit="m")
    v = _vals(spec)
    assert v["sphere_radius"] == pytest.approx(5.0)
    assert v["equator_inclination"] == pytest.approx(90 - phi)   # co-latitude
    assert v["polar_axis_altitude"] == pytest.approx(phi)
    assert v["ecliptic_obliquity"] == pytest.approx(23.44)
    assert v["tropic_cancer"] == pytest.approx(23.44)
    assert v["tropic_capricorn"] == pytest.approx(-23.44)


# ------------------------ Bhitti Yantra (mural quadrant) -----------------

def test_bhitti_noon_and_quadrant_dimensions():
    R = 3.0
    spec = BhittiYantra().compute(lat=26.9, lon=75.8, size_param=R, unit="m")
    v = _vals(spec)
    assert v["arc_radius"] == pytest.approx(R)
    assert v["arc_length"] == pytest.approx(math.pi * R / 2.0, rel=1e-9)
    assert v["chord_length"] == pytest.approx(R * math.sqrt(2.0), rel=1e-9)
    assert v["noon_altitude_equinox"] == pytest.approx(90 - 26.9, abs=0.01)
    assert v["noon_declination_summer"] == pytest.approx(23.44)
    assert v["noon_declination_winter"] == pytest.approx(-23.44)


# ------------------------ Rasivalaya Yantra (zodiac dials) ---------------

def test_rasivalaya_ecliptic_declinations():
    spec = RasivalayaYantra().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m")
    v = _vals(spec)
    assert v["dial_count"] == 12.0
    assert v["dial_radius"] == pytest.approx(4.0)
    # cardinal signs: equinoxes delta=0, solstices delta=+/-obliquity
    assert v["rashi_mesh"] == pytest.approx(0.0, abs=1e-9)       # Aries, lambda=0
    assert v["rashi_karka"] == pytest.approx(23.44, abs=1e-9)    # Cancer, lambda=90
    assert v["rashi_tula"] == pytest.approx(0.0, abs=1e-9)       # Libra, lambda=180
    assert v["rashi_makara"] == pytest.approx(-23.44, abs=1e-9)  # Capricorn, lambda=270


def test_rasivalaya_independent_formula_check():
    # delta = asin(sin 23.44 * sin lambda) at a non-cardinal sign (Gemini, 60)
    lon = 60.0
    expected = math.degrees(math.asin(math.sin(math.radians(23.44)) * math.sin(math.radians(lon))))
    v = _vals(RasivalayaYantra().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m"))
    assert v["rashi_mithuna"] == pytest.approx(expected, abs=0.002)  # impl rounds to 3 dp


# --------------------- common validation -----------------------------------

@pytest.mark.parametrize(
    "cls,size",
    [
        (DakshinottaraBhittiYantra, 5.0),
        (RamaYantra, 5.0),
        (DigamsaYantra, 5.0),
        (NadiValayaYantra, 5.0),
        (ChaapaYantra, 5.0),
        (PalakaYantra, 5.0),
        (DhruvaProthaChakraYantra, 5.0),
        (YantraSamratYantra, 5.0),
        (GolaChakraYantra, 5.0),
        (BhittiYantra, 5.0),
        (RasivalayaYantra, 5.0),
    ],
)
def test_nonpositive_size_rejected(cls, size):
    with pytest.raises(ValueError):
        cls().compute(lat=26.9, lon=75.8, size_param=-size, unit="m")


@pytest.mark.parametrize(
    "cls,name",
    [
        (DakshinottaraBhittiYantra, "dakshinottara_bhitti"),
        (RamaYantra, "rama"),
        (DigamsaYantra, "digamsa"),
        (NadiValayaYantra, "nadi_valaya"),
        (ChaapaYantra, "chaapa"),
        (PalakaYantra, "palaka"),
        (DhruvaProthaChakraYantra, "dhruva_protha_chakra"),
        (YantraSamratYantra, "yantra_samrat"),
        (GolaChakraYantra, "gola_chakra"),
        (BhittiYantra, "bhitti"),
        (RasivalayaYantra, "rasivalaya"),
    ],
)
def test_each_yantra_returns_svg_and_values(cls, name):
    spec = cls().compute(lat=26.9, lon=75.8, size_param=4.0, unit="m")
    assert spec.yantra_type == name
    assert len(spec.values) > 0
    assert isinstance(spec.svg, dict) and len(spec.svg) > 0
    for key, svg_str in spec.svg.items():
        if key == "geometry":
            continue
        assert svg_str.count("<svg") == 1 and svg_str.count("</svg>") == 1
