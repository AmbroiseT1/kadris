from app.core.config import settings
from app.api.v1.endpoints import proxy
from conftest import API


def test_proxy_rate_limited_and_cached(client, monkeypatch):
    # Cache factice pour ne pas toucher le disque ni Overpass
    class FakeCache(dict):
        def set(self, k, v, expire=None):
            self[k] = v

    monkeypatch.setattr(proxy, "cache", FakeCache({"quartier_48.0_2.0": {"elements": []}}))
    for _ in range(settings.PROXY_MAX_PER_IP):
        assert client.get(f"{API}/proxy/quartier", params={"lat": 48.0, "lon": 2.0}).status_code == 200
    assert client.get(f"{API}/proxy/quartier", params={"lat": 48.0, "lon": 2.0}).status_code == 429
