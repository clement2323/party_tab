import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.songs import router as songs_router

app = FastAPI(title="musique-partoche")

_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in _raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(songs_router, prefix="/songs")
