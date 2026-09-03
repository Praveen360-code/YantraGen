"""Pure, side-effect-free trigonometric helpers for yantra geometry and solar position.

All functions here are pure (no I/O, no globals) so they can be unit-tested in
isolation. Angles are converted explicitly at the boundaries: the trig core
works in *radians* internally and the yantra modules return human-readable
degrees. Nothing in this module assumes a specific country or reference
meridian -- geographic constraints live in :mod:`app.core.geo`.

References
----------
The spherical-trigonometry relationships used here (the astronomical triangle,
equation of time, solar declination) are standard and appear in:

    * A.E. Roy & D. Clarke, *Astronomy: Principles and Practice*
    * Explanatory Supplement to the Astronomical Almanac (USNO/SOFA)

The declination model (analemma) is the commonly used low-precision formula
implemented by the PyEphem/astral community; it is sufficient for an
educational instrument-design tool (target accuracy ~1 arcmin) and is *not*
intended for precise timekeeping.
"""

from __future__ import annotations

import math


def deg2rad(deg: float) -> float:
    """Convert degrees to radians."""
    return math.radians(deg)


def rad2deg(rad: float) -> float:
    """Convert radians to degrees."""
    return math.degrees(rad)


def sind(deg: float) -> float:
    """Sine of an angle expressed in degrees."""
    return math.sin(math.radians(deg))


def cosd(deg: float) -> float:
    """Cosine of an angle expressed in degrees."""
    return math.cos(math.radians(deg))


def tand(deg: float) -> float:
    """Tangent of an angle expressed in degrees."""
    return math.tan(math.radians(deg))


def atan2d(y: float, x: float) -> float:
    """atan2 returning degrees in (-180, 180]."""
    return math.degrees(math.atan2(y, x))


def asind(x: float) -> float:
    """asin returning degrees, clamped to valid input range."""
    return math.degrees(math.asin(max(-1.0, min(1.0, x))))


def acosd(x: float) -> float:
    """acos returning degrees, clamped to valid input range."""
    return math.degrees(math.acos(max(-1.0, min(1.0, x))))


def wrap360(deg: float) -> float:
    """Wrap an angle in degrees to [0, 360)."""
    return deg % 360.0


def solar_declination(day_of_year: int) -> float:
    """Approximate solar declination (degrees) for a given day of year.

    Uses the standard analemma approximation:

        delta ~= -23.45 * cos( 360/365 * (doy + 10) )            [degrees]

    accurate to roughly +/- 1 deg across the year -- plenty for an
    educational layout tool. Citation: Roy & Clarke, *Astronomy:
    Principles and Practice*, declination of the Sun.

    Parameters
    ----------
    day_of_year
        Integer day of the year (1..366).

    Returns
    -------
    float
        Declination in degrees, positive north of the celestial equator.
    """
    return -23.45 * math.cos(math.radians(360.0 / 365.0 * (day_of_year + 10)))


def equation_of_time_minutes(day_of_year: int) -> float:
    """Approximate equation of time (minutes) for a given day of year.

    Low-precision formula (the classic two-term approximation):

        EoT ~= 9.87 sin(2B) - 7.53 cos(B) - 1.5 sin(B)

    where B = 360/365 * (doy - 81) degrees.  This is the standard
    approximation taught in introductory astronomy (cf. Roy & Clarke;
    also used by the NOAA solar calculator).  Accurate to ~0.5 minutes.

    Returns
    -------
    float
        Equation of time in minutes (positive = sundial ahead of mean time).
    """
    b = math.radians(360.0 / 365.0 * (day_of_year - 81))
    return 9.87 * math.sin(2.0 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)


def hour_angle_deg(hours_from_noon: float) -> float:
    """Convert hours from apparent noon to solar hour angle in degrees.

    Hour angle advances 15 degrees per hour: at apparent solar noon H=0,
    morning positive, afternoon negative (or vice versa depending on sign
    convention).  Here positive = before noon (morning), matching the
    astronomical convention H = 15*(12 - LAT).

    Parameters
    ----------
    hours_from_noon
        Signed hours after apparent noon (e.g. 2.5 = 14:30 local apparent).

    Returns
    -------
    float
        Solar hour angle in degrees (0 = noon).
    """
    # Linear-only? No: hour angle IS linear in time (15 deg/hr). The many
    # nonlinear *sundial* dials arise from projecting this onto a fixed plane.
    return 15.0 * hours_from_noon


def sun_position(
    latitude_deg: float,
    declination_deg: float,
    hour_angle_deg_: float,
) -> dict:
    """Compute solar elevation and azimuth from the astronomical triangle.

    Given the site latitude phi, the solar declination delta and the solar
    hour angle H, solves the conventional spherical triangle (zenith--pole--
    sun):

        sin(elevation) = sin(phi) sin(delta) + cos(phi) cos(delta) cos(H)
        sin(azimuth)   = -cos(delta) sin(H) / cos(elevation)

    with azimuth measured from North through East (0..360).  Reference:
    Roy & Clarke, *Astronomy: Principles and Practice*, the conversion
    between equatorial and horizontal coordinates.

    Parameters
    ----------
    latitude_deg
        Site latitude, degrees (positive north).
    declination_deg
        Solar declination, degrees.
    hour_angle_deg_
        Solar hour angle, degrees (0 at apparent noon).

    Returns
    -------
    dict
        ``{"elevation", "azimuth"}`` each in degrees.
    """
    phi = deg2rad(latitude_deg)
    dec = deg2rad(declination_deg)
    h = deg2rad(hour_angle_deg_)

    sin_alt = math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(h)
    alt = asind(sin_alt)

    # Azimuth via the two-argument form for robustness near zenith/zero.
    # Convention: azimuth 0 = North, 90 = East.
    cos_alt = math.cos(deg2rad(alt))
    # sin(A) = -cos(dec) sin(H) / cos(alt); sign encodes E/W.
    if abs(cos_alt) < 1e-12:
        azi = 180.0 if hour_angle_deg_ >= 0 else 0.0
    else:
        # cos(az) = ( sin(dec) - sin(alt) sin(phi) ) / ( cos(alt) cos(phi) )
        cos_azi = (math.sin(dec) - sin_alt * math.sin(phi)) / (cos_alt * math.cos(phi))
        sin_azi = -math.cos(dec) * math.sin(h) / cos_alt
        azi = atan2d(sin_azi, cos_azi)
        if azi < 0:
            azi += 360.0

    return {"elevation": alt, "azimuth": azi}


def shadow_length(gnomon_vertical_height: float, elevation_deg: float) -> float:
    """Horizontal shadow length cast by a vertical gnomon at a solar elevation.

    ``length = height / tan(elevation)``.  Only meaningful while the sun is
    above the horizon; used for illustrative shadow animations.

    Parameters
    ----------
    gnomon_vertical_height
        Vertical height of the gnomon above the ground (any length unit).
    elevation_deg
        Solar elevation above the horizon, degrees.

    Returns
    -------
    float
        Horizontal shadow length in the same units as ``gnomon_vertical_height``.
    """
    if elevation_deg <= 0.0:
        return float("inf")
    return gnomon_vertical_height / tand(elevation_deg)
