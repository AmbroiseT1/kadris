"""Tests de /api/v1/public-data (httpx mocké via MockTransport, aucun appel réseau)."""
import json

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.endpoints import public_data
from app.services import public_data_service as svc

LAT, LON = 48.8566, 2.3522

DVF_HEADER = (
    "id_mutation,date_mutation,numero_disposition,nature_mutation,valeur_fonciere,adresse_numero,adresse_suffixe,"
    "adresse_nom_voie,adresse_code_voie,code_postal,code_commune,nom_commune,code_departement,ancien_code_commune,"
    "ancien_nom_commune,id_parcelle,ancien_id_parcelle,numero_volume,lot1_numero,lot1_surface_carrez,lot2_numero,"
    "lot2_surface_carrez,lot3_numero,lot3_surface_carrez,lot4_numero,lot4_surface_carrez,lot5_numero,"
    "lot5_surface_carrez,nombre_lots,code_type_local,type_local,surface_reelle_bati,nombre_pieces_principales,"
    "code_nature_culture,nature_culture,code_nature_culture_speciale,nature_culture_speciale,surface_terrain,"
    "longitude,latitude"
)


def dvf_row(mid, date, nature, valeur, type_local, surface, lon, lat, terrain="", parcelle="75104000AB0001"):
    code_type = {"Maison": "1", "Appartement": "2", "Dépendance": "3"}.get(type_local, "")
    return (
        f"{mid},{date},000001,{nature},{valeur},12,,RUE DE RIVOLI,1234,75004,75104,Paris 4e Arrondissement,75,,,"
        f"{parcelle},,,,,,,,,,,,,1,{code_type},{type_local},{surface},3,,,,,{terrain},{lon},{lat}"
    )


CSV_2024 = "\n".join(
    [
        DVF_HEADER,
        # Appartement + cave (dépendance) : une seule mutation, 50 m² -> 10 000 €/m²
        dvf_row("2024-1", "2024-03-01", "Vente", "500000", "Appartement", "50", LON, LAT),
        dvf_row("2024-1", "2024-03-01", "Vente", "500000", "Dépendance", "", LON, LAT),
        # Appartement à ~100 m
        dvf_row("2024-2", "2024-06-01", "Vente", "360000", "Appartement", "40", LON + 0.0012, LAT),
        # Loin (> 2 km) : exclu du rayon
        dvf_row("2024-3", "2024-07-01", "Vente", "900000", "Appartement", "60", LON + 0.05, LAT),
        # Échange : ignoré
        dvf_row("2024-4", "2024-08-01", "Echange", "1", "Appartement", "30", LON, LAT),
    ]
)


def make_handler(routes: dict, calls: list):
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        for prefix, resp in routes.items():
            if str(request.url).startswith(prefix):
                if isinstance(resp, Exception):
                    raise resp
                status, body = resp
                if isinstance(body, str):
                    return httpx.Response(status, text=body)
                return httpx.Response(status, json=body)
        return httpx.Response(404, json={})

    return handler


@pytest.fixture
def mock_http(monkeypatch):
    """Installe un transport httpx mocké ; renvoie (routes, calls) à remplir par le test."""
    svc.cache.clear()
    routes: dict = {}
    calls: list = []

    def fake_client():
        return httpx.AsyncClient(transport=httpx.MockTransport(make_handler(routes, calls)))

    monkeypatch.setattr(svc, "make_client", fake_client)
    yield routes, calls
    svc.cache.clear()


@pytest.fixture
def pd_client():
    app = FastAPI()
    app.include_router(public_data.router, prefix="/api/v1/public-data")
    return TestClient(app)


G = svc.GEORISQUES_BASE


def georisques_ok_routes():
    return {
        f"{G}/rga": (200, {"exposition": "Exposition forte", "codeExposition": "3"}),
        f"{G}/gaspar/azi": (200, {"results": 1, "data": [{"code_national_azi": "AZI1", "libelle_azi": "Seine"}]}),
        f"{G}/gaspar/risques": (
            200,
            {"data": [{"risques_detail": [{"libelle_risque_long": "Inondation"}, {"libelle_risque_long": "Séisme"}]}]},
        ),
        f"{G}/gaspar/catnat": (
            200,
            {
                "results": 3,
                "data": [
                    {"libelle_risque_jo": "Inondations et/ou Coulées de Boue", "date_debut_evt": "01/06/2016"},
                    {"libelle_risque_jo": "Sécheresse", "date_debut_evt": "01/07/2003"},
                    {"libelle_risque_jo": "Tempête", "date_debut_evt": "25/12/1999"},
                ],
            },
        ),
        f"{G}/cavites": (200, {"results": 2, "data": [{"type": "carrière", "nom": "C1"}, {"type": "cave", "nom": "C2"}]}),
        f"{G}/installations_classees": (200, {"results": 0, "data": []}),
        f"{G}/zonage_sismique": (200, {"data": [{"code_zone": "1", "zone_sismicite": "1 - TRES FAIBLE"}]}),
        f"{G}/radon": (200, {"data": [{"classe_potentiel": "1"}]}),
    }


def test_risks_maps_georisques(mock_http, pd_client):
    routes, calls = mock_http
    routes.update(georisques_ok_routes())
    r = pd_client.get("/api/v1/public-data/risks", params={"lat": LAT, "lon": LON, "code_insee": "75104"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["argiles"] == {"status": "ok", "niveau": "Fort", "libelle": "Exposition forte", "code": "3"}
    assert body["inondation"]["en_zone"] is True
    assert body["catnat"]["count"] == 3
    assert body["cavites"]["count"] == 2
    assert body["installations"]["count"] == 0
    assert body["sismicite"]["zone"] == "1"
    assert body["radon"]["classe"] == "1"
    assert body["pdf_url"].endswith("latlon=2.35220,48.85660")
    # Géorisques attend longitude,latitude
    assert any("latlon=2.35220%2C48.85660" in c or "latlon=2.35220,48.85660" in c for c in calls)

    # Deuxième appel servi par le cache
    n = len(calls)
    pd_client.get("/api/v1/public-data/risks", params={"lat": LAT, "lon": LON, "code_insee": "75104"})
    assert len(calls) == n


def test_risks_upstream_failure_is_error_not_no_risk(mock_http, pd_client):
    routes, _ = mock_http
    routes[G] = (503, {"message": "down"})
    routes[svc.GEO_API_BASE] = httpx.ConnectError("boom")
    r = pd_client.get("/api/v1/public-data/risks", params={"lat": LAT, "lon": LON, "code_insee": "75104"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "unavailable"
    for section in ["argiles", "inondation", "catnat", "cavites", "installations", "sismicite", "radon"]:
        assert body[section]["status"] == "error", section
        assert "count" not in body[section] and "en_zone" not in body[section]


def test_risks_partial(mock_http, pd_client):
    routes, _ = mock_http
    ok = georisques_ok_routes()
    ok[f"{G}/rga"] = httpx.ReadTimeout("slow")
    routes.update(ok)
    body = pd_client.get("/api/v1/public-data/risks", params={"lat": LAT, "lon": LON, "code_insee": "75104"}).json()
    assert body["status"] == "partial"
    assert body["errors"] == ["argiles"]
    assert body["catnat"]["status"] == "ok"


def test_risks_rejects_bad_insee(pd_client):
    r = pd_client.get("/api/v1/public-data/risks", params={"lat": LAT, "lon": LON, "code_insee": "75;--"})
    assert r.status_code == 422


def test_parse_geo_dvf_aggregates_mutations():
    muts = {m["id_mutation"]: m for m in svc.parse_geo_dvf_csv(CSV_2024)}
    assert set(muts) == {"2024-1", "2024-2", "2024-3"}  # l'échange est ignoré
    m = muts["2024-1"]
    assert m["type_principal"] == "Appartement"
    assert m["nombre_dependances"] == 1
    assert m["surface_bati"] == 50
    assert m["prix_m2"] == 10000
    assert m["adresse"] == "12 RUE DE RIVOLI, 75004 Paris 4e Arrondissement"


def dvf_routes():
    base = svc.GEO_DVF_BASE
    return {f"{base}/2024/communes/75/75104.csv": (200, CSV_2024)}


def test_dvf_transactions_radius(mock_http, pd_client):
    routes, _ = mock_http
    routes.update(dvf_routes())
    r = pd_client.get(
        "/api/v1/public-data/dvf/transactions", params={"lat": LAT, "lon": LON, "radius": 500, "code_insee": "75104"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["millesimes"] == [2024]
    ids = [t["id_mutation"] for t in body["transactions"]]
    assert ids == ["2024-2", "2024-1"]  # tri date décroissante, la vente lointaine est exclue
    assert 80 < body["transactions"][0]["distance"] < 110


def test_dvf_stats(mock_http, pd_client):
    routes, _ = mock_http
    routes.update(dvf_routes())
    body = pd_client.get(
        "/api/v1/public-data/dvf/stats", params={"lat": LAT, "lon": LON, "radius": 500, "code_insee": "75104"}
    ).json()
    assert body["nombre_transactions"] == 2
    assert body["prix_median_m2"] == 9500  # médiane de 10 000 et 9 000
    assert body["par_type"]["Appartement"]["prix_median_m2"] == 9500
    assert body["par_type"]["Maison"] is None
    assert body["commune"]["Appartement"]["nombre_transactions"] == 3


def test_dvf_unreachable_is_502(mock_http, pd_client):
    routes, _ = mock_http
    routes[svc.GEO_DVF_BASE] = httpx.ConnectError("blocked")
    r = pd_client.get("/api/v1/public-data/dvf/stats", params={"lat": LAT, "lon": LON, "code_insee": "75104"})
    assert r.status_code == 502


def test_plm_commune_resolved_to_arrondissement(mock_http, pd_client):
    routes, calls = mock_http
    routes[f"{svc.GEO_API_BASE}/communes"] = (200, [{"code": "75104"}])
    routes.update(dvf_routes())
    body = pd_client.get(
        "/api/v1/public-data/dvf/transactions", params={"lat": LAT, "lon": LON, "code_insee": "75056"}
    ).json()
    assert body["code_insee"] == "75104"
    assert any("type=arrondissement-municipal" in c for c in calls)
