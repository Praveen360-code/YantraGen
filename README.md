# YantraGen

A full-stack web application that **computes and visualizes the dimensions of
ancient Indian astronomical instruments (yantras)** for any latitude/longitude
in India. It derives all the key angles, lengths, radii and scale markings from
the local latitude (φ), applies the longitude-based time correction, and
renders 2D SVG technical drawings — with an interactive comparison mode to show
how the geometry changes as you move north or south.

> **Educational / research tool — not for precision timekeeping.**

---

## Background

Sawai Jai Singh II’s Jantar Mantar observatories (Delhi, Jaipur, Varanasi,
Ujjain, Mathura) house fixed stone instruments whose geometry is derived from
the local latitude. The **Samrat Yantra** — a giant right-triangular gnomon
inclined at latitude **φ** and thus parallel to Earth’s axis — reads **local
apparent solar time** as its shadow sweeps two curved quadrants at a constant
rate. Every other yantra follows the same core idea: **latitude sets the tilt,
longitude sets the time offset** from the reference meridian (historically
Ujjain, now IST at 82.5°E).

Because every length scales linearly with the gnomon slant **H** while every
angle is fixed by **φ**, dimensions are correctly scaled for any user-selected
size — from a tabletop replica to a monumental instrument. These relationships
and their citable sources (G.R. Kaye’s *Guide to the Old Observatories*;
Virendra Sharma’s *Sawai Jai Singh and His Astronomy*) are documented in
`backend/app/yantras/samrat.py` and validated against the published Jaipur /
Delhi dimensions in the test suite.

---

## Repository layout

```
.
├── backend/                  # Python + FastAPI
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint + CORS
│   │   ├── config.py         # reference meridians, units
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── reference_sites.py# preset historical observatory sites
│   │   ├── export.py         # CSV / DXF / PDF serialisation
│   │   ├── core/
│   │   │   ├── trig.py       # pure spherical-trig & solar helpers
│   │   │   └── geo.py        # India bounding-box validation (isolated)
│   │   ├── yantras/
│   │   │   ├── base.py       # Yantra ABC + YantraSpec data model
│   │   │   ├── samrat.py     # Samrat implementation + SVG generation
│   │   │   └── __init__.py   # registry (incl. "coming soon" instruments)
│   │   └── api/routes.py     # API routes
│   ├── tests/                # pytest (validates vs published dims)
│   ├── pyproject.toml        # deps + pytest config
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                 # React + TypeScript (Vite)
│   ├── src/
│   │   ├── api/              # typed API client
│   │   ├── components/       # selector, map, params, results, learn
│   │   ├── lib/schema.ts     # zod form validation
│   │   ├── App.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts        # dev proxy /api -> :8000
│   ├── nginx.conf            # prod proxy /api -> backend
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/yantra/types` | Supported instruments, descriptions, required params, status |
| `POST` | `/api/yantra/{type}/validate` | Sanity-check lat/long against India (6°N–37°N, 68°E–97°E) |
| `POST` | `/api/yantra/{type}/dimensions` | Compute full geometric spec (angles, lengths, radii, hour lines, SVG) |
| `GET` | `/api/reference-sites` | Preset historical observatories (Jaipur, Delhi, Ujjain, Varanasi, Mathura) |
| `POST` | `/api/yantra/{type}/export` | Export a spec sheet as **CSV / DXF / PDF** |

Interactive docs at `/docs` (Swagger UI).

`dimensions` request body:

```json
{
  "lat": 26.9239,
  "long": 75.8267,
  "size_param": 22.6,
  "unit": "m",
  "reference_meridian": "ist"
}
```

`reference_meridian` may be `ist` (82.5°E), `ujjain` (75.7°E), `greenwich`
(0°), or you can pass a custom value via `reference_meridian_custom`.

---

## Local development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows   (Linux/macOS: source .venv/bin/activate)
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Run the tests (validates against published Jaipur/Delhi dimensions):

```bash
python -m pytest -q
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173   (proxies /api -> :8000)
```

Other scripts: `npm run build`, `npm run typecheck`, `npm test`.

---

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080 (nginx, proxies `/api` → backend)
- Backend API: http://localhost:8000, docs at http://localhost:8000/docs

---

## Instrument roadmap (v1)

| Instrument | Status |
|---|---|
| **Samrat Yantra** (equinoctial sundial) | ✅ implemented |
| **Dakshinottara Bhitti Yantra** (meridian wall) | ✅ implemented |
| **Rama Yantra** (cylindrical altitude–azimuth) | ✅ implemented |
| **Digamsa Yantra** (azimuth circle) | ✅ implemented |
| **Nadi Valaya Yantra** (equatorial disc) | ✅ implemented |
| **Chaapa Yantra** (graduated bow) | ✅ implemented (reconstruction) |
| **Palaka Yantra** (plank with gnomon) | ✅ implemented (reconstruction) |
| **Dhruva-Protha-Chakra Yantra** (polar-axis ring) | ✅ implemented (reconstruction) |
| **Yantra-Samrat** (Samrat + Dhruva-Protha-Chakra combo) | ✅ implemented (reconstruction) |
| **Gola / Chakra Yantra** (armillary sphere) | ✅ implemented (reconstruction) |
| **Bhitti Yantra** (mural quadrant) | ✅ implemented (reconstruction) |
| **Rasivalaya Yantra** (twelve zodiac dials) | ✅ implemented (reconstruction) |

All instruments are computed with the pure `math` core, return a structured
`YantraSpec` (values + named SVG views + meta), and are unit-tested
(`backend/tests/test_yantras.py` and `test_api.py`, 86 tests total across the
backend).

New instruments implement the `Yantra` abstract base class
(`backend/app/yantras/base.py`), return a structured `YantraSpec`, and are
registered in `backend/app/yantras/__init__.py`. The reconstruction instruments
(Chaapa, Palaka, Dhruva-Protha-Chakra, Yantra-Samrat, Gola/Chakra, Bhitti,
Rasivalaya) are educational models based on classical instrument descriptions
rather than a single surviving monumental exemplar.

---

## Design notes

- **Pure math core.** `app/core/trig.py` and each yantra module are pure,
  side-effect-free functions with docstrings citing the classical sources, so
  they can be unit-tested in isolation and audited.
- **Geography is isolated.** India’s bounding box lives only in
  `app/core/geo.py`; the trigonometric core never assumes a country, so the
  tool can be extended to other regions later.
- **Export.** The `export_spec` helper produces CSV (spec table), DXF (R12
  line drawing for CAD) and a dependency-free PDF spec sheet.

## Disclaimer

YantraGen is provided for **educational and research** purposes. It illustrates
the classical geometry of the instruments. For actual construction or
precision timekeeping, validate against modern astronomical software and
qualified surveyors.
