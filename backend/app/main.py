"""FastAPI application entrypoint for YantraGen."""

from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import APP_DESCRIPTION, APP_TITLE

load_dotenv()

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Allow the Vite dev server (and production static host) to reach the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "app": APP_TITLE,
        "status": "ok",
        "docs": "/docs",
        "disclaimer": "Educational / research tool. Not for precision timekeeping.",
    }
