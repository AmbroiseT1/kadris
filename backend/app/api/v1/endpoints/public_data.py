"""
Données publiques pour le rapport immobilier (Géorisques, DVF).

Routes (préfixe /api/v1/public-data) :
- GET /risks?lat=&lon=&code_insee=
- GET /dvf/transactions?lat=&lon=&radius=&code_insee=&limit=
- GET /dvf/stats?lat=&lon=&radius=&code_insee=
"""
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Query

from app.services import public_data_service as svc

router = APIRouter()

Lat = Annotated[float, Query(ge=-25.0, le=52.0, description="Latitude WGS84 (France métropolitaine et DROM)")]
Lon = Annotated[float, Query(ge=-65.0, le=60.0, description="Longitude WGS84")]


def _check_insee(code_insee: Optional[str]) -> Optional[str]:
    if code_insee is None or code_insee == "":
        return None
    code = code_insee.upper()
    if not svc.is_valid_code_insee(code):
        raise HTTPException(status_code=422, detail="code_insee invalide")
    return code


@router.get("/risks")
async def get_risks(lat: Lat, lon: Lon, code_insee: Optional[str] = Query(None, max_length=5)):
    """Synthèse Géorisques. Chaque section a un `status` ok | empty | error ; une erreur n'est jamais « aucun risque »."""
    return await svc.fetch_risks(lat, lon, _check_insee(code_insee))


async def _load(lat: float, lon: float, code_insee: Optional[str]) -> dict:
    try:
        return await svc.load_dvf(lat, lon, _check_insee(code_insee))
    except svc.UpstreamError as e:
        raise HTTPException(status_code=502, detail=f"DVF indisponible : {e}")


@router.get("/dvf/transactions")
async def get_dvf_transactions(
    lat: Lat,
    lon: Lon,
    radius: int = Query(500, ge=10, le=2000),
    code_insee: Optional[str] = Query(None, max_length=5),
    limit: int = Query(500, ge=1, le=2000),
):
    loaded = await _load(lat, lon, code_insee)
    near = svc.nearby(loaded["mutations"], lat, lon, radius)
    return {**svc.dvf_meta(loaded), "rayon_m": radius, "total": len(near), "transactions": near[:limit]}


@router.get("/dvf/stats")
async def get_dvf_stats(
    lat: Lat,
    lon: Lon,
    radius: int = Query(500, ge=10, le=2000),
    code_insee: Optional[str] = Query(None, max_length=5),
):
    loaded = await _load(lat, lon, code_insee)
    return {**svc.dvf_meta(loaded), **svc.market_stats(loaded["mutations"], lat, lon, radius)}
