"""
Accès aux données publiques utilisées par le rapport immobilier.

- Géorisques API v1 (https://georisques.gouv.fr/api/v1) : argiles, inondation,
  CatNat, cavités, ICPE, sismicité, radon.
- DVF géolocalisées (Etalab, https://files.data.gouv.fr/geo-dvf/latest/csv/) :
  un CSV par commune et par année.
- geo.api.gouv.fr : résolution lat/lon -> code commune / arrondissement (Paris, Lyon, Marseille).

Chaque appel externe est mis en cache en mémoire (TTL ~24 h). Une erreur d'une
source n'est JAMAIS convertie en « aucun risque » : la section correspondante
porte ``status: "error"`` et le front affiche « Données indisponibles ».
"""
from __future__ import annotations

import asyncio
import csv
import io
import logging
import math
import re
import statistics
import time
from datetime import date, datetime, timezone
from typing import Any, Awaitable, Callable, Optional

import httpx

logger = logging.getLogger(__name__)

GEORISQUES_BASE = "https://georisques.gouv.fr/api/v1"
GEO_DVF_BASE = "https://files.data.gouv.fr/geo-dvf/latest/csv"
GEO_API_BASE = "https://geo.api.gouv.fr"

DAY = 24 * 3600
HTTP_TIMEOUT = httpx.Timeout(20.0, connect=10.0)
USER_AGENT = "Bricq/1.0 (rapport immobilier; donnees publiques)"

CODE_INSEE_RE = re.compile(r"^(?:\d{5}|2[AB]\d{3})$")

# Communes à arrondissements : DVF publie par arrondissement, GASPAR par commune.
PLM_COMMUNES = {"75056", "69123", "13055"}


def is_valid_code_insee(code: str) -> bool:
    return bool(CODE_INSEE_RE.match(code or ""))


def plm_parent(code: str) -> Optional[str]:
    """Code de la commune « mère » pour un arrondissement municipal (75101 -> 75056)."""
    if code.startswith("751") and 75101 <= int(code) <= 75120:
        return "75056"
    if code.startswith("6938") and 69381 <= int(code) <= 69389:
        return "69123"
    if code.startswith("132") and 13201 <= int(code) <= 13216:
        return "13055"
    return None


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


# ---------------------------------------------------------------------------
# Cache TTL en mémoire (par process)
# ---------------------------------------------------------------------------
class TTLCache:
    def __init__(self, max_items: int = 512):
        self._data: dict[str, tuple[float, Any]] = {}
        self._max = max_items
        self._locks: dict[str, asyncio.Lock] = {}

    def get(self, key: str) -> Any:
        item = self._data.get(key)
        if item is None:
            return None
        expires, value = item
        if expires < time.monotonic():
            self._data.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        if len(self._data) >= self._max:
            # Purge des entrées expirées puis des plus anciennes
            now = time.monotonic()
            for k in [k for k, (exp, _) in self._data.items() if exp < now]:
                self._data.pop(k, None)
            while len(self._data) >= self._max:
                self._data.pop(next(iter(self._data)))
        self._data[key] = (time.monotonic() + ttl, value)

    def lock(self, key: str) -> asyncio.Lock:
        lock = self._locks.get(key)
        if lock is None:
            if len(self._locks) > 4 * self._max:
                self._locks.clear()
            lock = self._locks[key] = asyncio.Lock()
        return lock

    def clear(self) -> None:
        self._data.clear()
        self._locks.clear()


cache = TTLCache()


async def cached(key: str, ttl: float, producer: Callable[[], Awaitable[Any]]) -> Any:
    hit = cache.get(key)
    if hit is not None:
        return hit
    async with cache.lock(key):
        hit = cache.get(key)
        if hit is not None:
            return hit
        value = await producer()
        if value is not None:
            cache.set(key, value, ttl)
        return value


def make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=HTTP_TIMEOUT,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        follow_redirects=True,
    )


class UpstreamError(Exception):
    pass


async def _get_json(client: httpx.AsyncClient, url: str, params: dict) -> Any:
    try:
        r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise UpstreamError(f"{url}: {type(e).__name__}") from e
    if r.status_code == 404:
        return None
    if r.status_code >= 400:
        raise UpstreamError(f"{url}: HTTP {r.status_code}")
    try:
        return r.json()
    except ValueError as e:
        raise UpstreamError(f"{url}: réponse non JSON") from e


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371e3
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Résolution du code commune
# ---------------------------------------------------------------------------
async def resolve_code_insee(client: httpx.AsyncClient, lat: float, lon: float, code_insee: Optional[str]) -> Optional[str]:
    """Retourne le code commune (ou d'arrondissement pour Paris/Lyon/Marseille)."""
    if code_insee and code_insee not in PLM_COMMUNES:
        return code_insee

    async def _lookup() -> Optional[str]:
        params = {"lat": lat, "lon": lon, "fields": "code", "format": "json"}
        if code_insee in PLM_COMMUNES or code_insee is None:
            arr = await _get_json(client, f"{GEO_API_BASE}/communes", {**params, "type": "arrondissement-municipal"})
            if arr:
                return arr[0].get("code")
        com = await _get_json(client, f"{GEO_API_BASE}/communes", params)
        if com:
            return com[0].get("code")
        return None

    try:
        return await cached(f"insee:{round(lat, 4)}:{round(lon, 4)}:{code_insee}", 30 * DAY, _lookup) or code_insee
    except UpstreamError as e:
        logger.warning("geo.api.gouv.fr indisponible: %s", e)
        return code_insee


# ---------------------------------------------------------------------------
# Géorisques
# ---------------------------------------------------------------------------
def _data_list(payload: Any) -> list:
    if isinstance(payload, dict):
        data = payload.get("data")
        return data if isinstance(data, list) else []
    return payload if isinstance(payload, list) else []


def _total(payload: Any) -> int:
    if isinstance(payload, dict) and isinstance(payload.get("results"), int):
        return payload["results"]
    return len(_data_list(payload))


def _niveau_argiles(payload: Any) -> dict:
    if not isinstance(payload, dict) or not (payload.get("exposition") or payload.get("codeExposition") is not None):
        return {"status": "empty"}
    libelle = str(payload.get("exposition") or "")
    code = str(payload.get("codeExposition") or "")
    low = libelle.lower()
    if code == "3" or "fort" in low:
        niveau = "Fort"
    elif code == "2" or "moyen" in low:
        niveau = "Moyen"
    elif code == "1" or "faible" in low:
        niveau = "Faible"
    elif code == "0" or "pas d" in low or "nul" in low:
        niveau = "Nul"
    else:
        return {"status": "empty", "libelle": libelle}
    return {"status": "ok", "niveau": niveau, "libelle": libelle or niveau, "code": code}


async def _section(coro: Awaitable[dict], name: str) -> dict:
    try:
        return await coro
    except UpstreamError as e:
        logger.warning("Géorisques %s indisponible: %s", name, e)
        return {"status": "error"}
    except Exception:  # noqa: BLE001 - une section ne doit pas casser les autres
        logger.exception("Géorisques %s : erreur inattendue", name)
        return {"status": "error"}


async def _gaspar_with_fallback(client: httpx.AsyncClient, path: str, code: str, extra: Optional[dict] = None) -> Any:
    """Les jeux GASPAR sont indexés par commune : on retente avec la commune mère pour un arrondissement."""
    params = {"code_insee": code, **(extra or {})}
    payload = await _get_json(client, f"{GEORISQUES_BASE}{path}", params)
    parent = plm_parent(code)
    if parent and not _data_list(payload):
        payload = await _get_json(client, f"{GEORISQUES_BASE}{path}", {**params, "code_insee": parent})
    return payload


async def fetch_risks(lat: float, lon: float, code_insee: Optional[str]) -> dict:
    latlon = f"{lon:.5f},{lat:.5f}"  # Géorisques attend longitude,latitude
    key = f"risks:{round(lat, 4)}:{round(lon, 4)}:{code_insee}"
    hit = cache.get(key)
    if hit is not None:
        return hit

    async with make_client() as client:
        code = await resolve_code_insee(client, lat, lon, code_insee)

        async def argiles() -> dict:
            return _niveau_argiles(await _get_json(client, f"{GEORISQUES_BASE}/rga", {"latlon": latlon}))

        async def inondation() -> dict:
            if not code:
                return {"status": "error"}
            azi, risques = await asyncio.gather(
                _gaspar_with_fallback(client, "/gaspar/azi", code, {"page_size": 50}),
                _gaspar_with_fallback(client, "/gaspar/risques", code),
            )
            zones = sorted({str(z.get("libelle_azi") or z.get("code_national_azi") or "AZI") for z in _data_list(azi)})
            risques_commune: list[str] = []
            for entry in _data_list(risques):
                for r in entry.get("risques_detail") or []:
                    lib = r.get("libelle_risque_long") or r.get("libelle_risque")
                    if lib:
                        risques_commune.append(str(lib))
            risques_commune = sorted(set(risques_commune))
            inond_commune = any("inond" in r.lower() for r in risques_commune)
            return {
                "status": "ok",
                "en_zone": bool(zones) or inond_commune,
                "zones": zones,
                "risques_commune": risques_commune,
                "echelle": "commune",
            }

        async def catnat() -> dict:
            if not code:
                return {"status": "error"}
            payload = await _gaspar_with_fallback(client, "/gaspar/catnat", code, {"page_size": 100})
            items = _data_list(payload)
            items.sort(key=lambda e: str(e.get("date_debut_evt") or ""), reverse=True)
            return {
                "status": "ok",
                "count": _total(payload),
                "evenements": [
                    {
                        "libelle": e.get("libelle_risque_jo"),
                        "date_debut": e.get("date_debut_evt"),
                        "date_fin": e.get("date_fin_evt"),
                        "date_arrete": e.get("date_publication_arrete") or e.get("date_publication_jo"),
                    }
                    for e in items[:10]
                ],
            }

        async def cavites() -> dict:
            payload = await _get_json(client, f"{GEORISQUES_BASE}/cavites", {"latlon": latlon, "rayon": 500, "page_size": 50})
            items = _data_list(payload)
            return {
                "status": "ok",
                "rayon_m": 500,
                "count": _total(payload),
                "items": [{"type": c.get("type"), "nom": c.get("nom")} for c in items[:20]],
            }

        async def installations() -> dict:
            payload = await _get_json(
                client, f"{GEORISQUES_BASE}/installations_classees", {"latlon": latlon, "rayon": 1000, "page_size": 50}
            )
            items = _data_list(payload)
            return {
                "status": "ok",
                "rayon_m": 1000,
                "count": _total(payload),
                "items": [
                    {
                        "nom": i.get("raisonSociale") or i.get("nom_ets") or i.get("nom"),
                        "regime": i.get("regime") or i.get("regime_vigueur"),
                        "seveso": i.get("statutSeveso") or i.get("statut_seveso"),
                    }
                    for i in items[:20]
                ],
            }

        async def sismicite() -> dict:
            if not code:
                return {"status": "error"}
            items = _data_list(await _gaspar_with_fallback(client, "/zonage_sismique", code))
            if not items:
                return {"status": "empty"}
            z = items[0]
            return {"status": "ok", "zone": str(z.get("code_zone") or ""), "libelle": z.get("zone_sismicite")}

        async def radon() -> dict:
            if not code:
                return {"status": "error"}
            items = _data_list(await _gaspar_with_fallback(client, "/radon", code))
            if not items:
                return {"status": "empty"}
            return {"status": "ok", "classe": str(items[0].get("classe_potentiel") or "")}

        names = ["argiles", "inondation", "catnat", "cavites", "installations", "sismicite", "radon"]
        results = await asyncio.gather(
            *[_section(f(), n) for f, n in zip([argiles, inondation, catnat, cavites, installations, sismicite, radon], names)]
        )

    sections = dict(zip(names, results))
    errors = [n for n, s in sections.items() if s.get("status") == "error"]
    status = "ok" if not errors else ("unavailable" if len(errors) == len(names) else "partial")
    out = {
        "source": "Géorisques (Ministère de la Transition écologique / BRGM)",
        "source_url": "https://www.georisques.gouv.fr",
        "fetched_at": utcnow_iso(),
        "status": status,
        "errors": errors,
        "code_insee": code,
        "pdf_url": f"{GEORISQUES_BASE}/rapport_pdf?latlon={latlon}",
        **sections,
    }
    if status == "ok":
        cache.set(key, out, DAY)
    elif status == "partial":
        cache.set(key, out, 3600)
    return out


# ---------------------------------------------------------------------------
# DVF (fichiers geo-dvf Etalab)
# ---------------------------------------------------------------------------
TYPE_MAISON = "Maison"
TYPE_APPART = "Appartement"
TYPE_DEP = "Dépendance"
TYPE_LOCAL = "Local industriel. commercial ou assimilé"
NATURES_VENTE = {"Vente", "Vente en l'état futur d'achèvement", "Adjudication"}


def _f(v: Optional[str]) -> float:
    try:
        return float(v) if v not in (None, "") else 0.0
    except ValueError:
        return 0.0


def parse_geo_dvf_csv(text: str) -> list[dict]:
    """Agrège les lignes du CSV geo-dvf (une ligne par local/parcelle) en mutations."""
    muts: dict[str, dict] = {}
    for row in csv.DictReader(io.StringIO(text)):
        if row.get("nature_mutation") not in NATURES_VENTE:
            continue
        mid = row.get("id_mutation")
        if not mid:
            continue
        m = muts.get(mid)
        if m is None:
            num = " ".join(p for p in [row.get("adresse_numero"), row.get("adresse_suffixe")] if p)
            voie = row.get("adresse_nom_voie") or ""
            ville = " ".join(p for p in [row.get("code_postal"), row.get("nom_commune")] if p)
            m = muts[mid] = {
                "id_mutation": mid,
                "date_mutation": row.get("date_mutation"),
                "nature_mutation": row.get("nature_mutation"),
                "valeur_fonciere": _f(row.get("valeur_fonciere")),
                "adresse": ", ".join(p for p in [f"{num} {voie}".strip(), ville] if p) or None,
                "code_commune": row.get("code_commune"),
                "latitude": None,
                "longitude": None,
                "nombre_maisons": 0,
                "nombre_appartements": 0,
                "nombre_dependances": 0,
                "nombre_locaux_activite": 0,
                "surface_bati": 0.0,
                "surface_terrain": 0.0,
                "id_parcelles": [],
                "_terrains": set(),
            }
        if m["latitude"] is None and row.get("latitude") and row.get("longitude"):
            m["latitude"], m["longitude"] = _f(row["latitude"]), _f(row["longitude"])
        parcelle = row.get("id_parcelle")
        if parcelle and parcelle not in m["id_parcelles"]:
            m["id_parcelles"].append(parcelle)
        t = row.get("type_local")
        surf = _f(row.get("surface_reelle_bati"))
        if t == TYPE_MAISON:
            m["nombre_maisons"] += 1
            m["surface_bati"] += surf
        elif t == TYPE_APPART:
            m["nombre_appartements"] += 1
            m["surface_bati"] += surf
        elif t == TYPE_DEP:
            m["nombre_dependances"] += 1
        elif t == TYPE_LOCAL:
            m["nombre_locaux_activite"] += 1
            m["_surface_local"] = m.get("_surface_local", 0.0) + surf
        # Le terrain est répété sur chaque ligne local d'une même parcelle : dédoublonnage
        terrain_key = (parcelle, row.get("code_nature_culture"), row.get("surface_terrain"))
        if row.get("surface_terrain") and terrain_key not in m["_terrains"]:
            m["_terrains"].add(terrain_key)
            m["surface_terrain"] += _f(row.get("surface_terrain"))

    out = []
    for m in muts.values():
        m.pop("_terrains", None)
        surface_local = m.pop("_surface_local", 0.0)
        if m["nombre_maisons"] and m["nombre_appartements"]:
            type_principal = "Mixte"
        elif m["nombre_maisons"]:
            type_principal = TYPE_MAISON
        elif m["nombre_appartements"]:
            type_principal = TYPE_APPART
        elif m["nombre_locaux_activite"]:
            type_principal = "Local"
            m["surface_bati"] = surface_local
        elif m["nombre_dependances"]:
            type_principal = TYPE_DEP
        elif m["surface_terrain"] > 0:
            type_principal = "Terrain"
        else:
            type_principal = "Autre"
        m["type_principal"] = type_principal
        # Prix/m² seulement pour une vente « simple » (un seul type de bien bâti, hors locaux mixtes)
        simple = type_principal in (TYPE_MAISON, TYPE_APPART) and m["nombre_locaux_activite"] == 0
        m["prix_m2"] = round(m["valeur_fonciere"] / m["surface_bati"]) if simple and m["surface_bati"] > 0 and m["valeur_fonciere"] > 0 else None
        m["surface_bati"] = round(m["surface_bati"], 1)
        m["surface_terrain"] = round(m["surface_terrain"], 1)
        out.append(m)
    return out


def dvf_years(today: Optional[date] = None) -> list[int]:
    """Millésimes à tenter : les 6 dernières années civiles (le fichier « latest » couvre ~5 ans)."""
    y = (today or date.today()).year
    return list(range(y - 6, y + 1))


def _departement(code: str) -> str:
    return code[:3] if code.startswith("97") else code[:2]


async def _load_year(client: httpx.AsyncClient, code: str, year: int) -> Optional[list[dict]]:
    """None = erreur réseau ; [] = pas de fichier pour cette année."""
    key = f"dvf:{code}:{year}"
    hit = cache.get(key)
    if hit is not None:
        return hit
    async with cache.lock(key):
        hit = cache.get(key)
        if hit is not None:
            return hit
        url = f"{GEO_DVF_BASE}/{year}/communes/{_departement(code)}/{code}.csv"
        try:
            r = await client.get(url, headers={"Accept": "text/csv"})
        except httpx.HTTPError as e:
            logger.warning("geo-dvf %s: %s", url, type(e).__name__)
            return None
        if r.status_code == 404:
            cache.set(key, [], DAY)
            return []
        if r.status_code >= 400:
            logger.warning("geo-dvf %s: HTTP %s", url, r.status_code)
            return None
        muts = parse_geo_dvf_csv(r.text)
        cache.set(key, muts, DAY)
        return muts


async def load_dvf(lat: float, lon: float, code_insee: Optional[str]) -> dict:
    async with make_client() as client:
        code = await resolve_code_insee(client, lat, lon, code_insee)
        if not code or not is_valid_code_insee(code):
            raise UpstreamError("Code commune introuvable")
        years = dvf_years()
        per_year = await asyncio.gather(*[_load_year(client, code, y) for y in years])
    if all(r is None for r in per_year):
        raise UpstreamError("Fichiers DVF injoignables")
    mutations: list[dict] = []
    millesimes: list[int] = []
    for y, muts in zip(years, per_year):
        if muts:
            millesimes.append(y)
            mutations.extend(muts)
    return {
        "code_insee": code,
        "millesimes": millesimes,
        "partial": any(r is None for r in per_year),
        "mutations": mutations,
    }


def dvf_meta(loaded: dict) -> dict:
    return {
        "source": "DVF géolocalisées (DGFiP / Etalab)",
        "source_url": "https://files.data.gouv.fr/geo-dvf/latest/csv/",
        "fetched_at": utcnow_iso(),
        "code_insee": loaded["code_insee"],
        "millesimes": loaded["millesimes"],
        "partial": loaded["partial"],
    }


def nearby(mutations: list[dict], lat: float, lon: float, radius: float) -> list[dict]:
    out = []
    for m in mutations:
        if m["latitude"] is None:
            continue
        d = haversine_m(lat, lon, m["latitude"], m["longitude"])
        if d <= radius:
            out.append({**m, "distance": round(d)})
    out.sort(key=lambda m: m["date_mutation"] or "", reverse=True)
    return out


PRIX_M2_MIN, PRIX_M2_MAX = 300, 30000  # bornes anti-aberrations (ventes en bloc, erreurs de saisie)


def price_stats(mutations: list[dict]) -> Optional[dict]:
    prices = [m["prix_m2"] for m in mutations if m.get("prix_m2") and PRIX_M2_MIN <= m["prix_m2"] <= PRIX_M2_MAX]
    if not prices:
        return None
    return {
        "nombre_transactions": len(prices),
        "prix_moyen_m2": round(statistics.fmean(prices)),
        "prix_median_m2": round(statistics.median(prices)),
        "prix_min_m2": min(prices),
        "prix_max_m2": max(prices),
    }


def market_stats(mutations: list[dict], lat: float, lon: float, radius: float) -> dict:
    near = nearby(mutations, lat, lon, radius)
    by_type = {
        t: price_stats([m for m in near if m["type_principal"] == t]) for t in (TYPE_APPART, TYPE_MAISON)
    }
    commune = {
        t: price_stats([m for m in mutations if m["type_principal"] == t]) for t in (TYPE_APPART, TYPE_MAISON)
    }
    global_stats = price_stats(near) or {
        "nombre_transactions": 0,
        "prix_moyen_m2": 0,
        "prix_median_m2": 0,
        "prix_min_m2": 0,
        "prix_max_m2": 0,
    }
    dates = sorted(m["date_mutation"] for m in near if m.get("date_mutation"))
    return {
        **global_stats,
        "rayon_m": radius,
        "nombre_mutations": len(near),
        "par_type": by_type,
        "commune": commune,
        "periode": {"debut": dates[0], "fin": dates[-1]} if dates else None,
    }
