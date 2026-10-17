"""Limiteur de débit en mémoire (fenêtre glissante).

ATTENTION : l'état vit dans la mémoire du processus. Il n'est ni partagé entre
plusieurs workers/conteneurs ni conservé après un redémarrage. L'API doit donc
tourner avec un seul worker uvicorn (voir Dockerfile) ; au-delà, passer à un
stockage partagé (Redis...).

L'IP client vient de ``request.client.host``. Derrière un reverse proxy, elle
n'est correcte que si uvicorn tourne avec ``--proxy-headers`` et
``--forwarded-allow-ips`` limité au proxy de confiance.
"""
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import HTTPException, Request, status


class SlidingWindowLimiter:
    """Au plus ``max_events`` événements par clé sur ``window_seconds`` secondes."""

    def __init__(self, max_events: int, window_seconds: int):
        self.max_events = max_events
        self.window = window_seconds
        self._events: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, key: str, now: float) -> Deque[float]:
        q = self._events[key]
        while q and now - q[0] > self.window:
            q.popleft()
        return q

    def _gc(self, key: str) -> None:
        # Évite que le dictionnaire grossisse indéfiniment avec des clés vides
        if key in self._events and not self._events[key]:
            del self._events[key]

    def is_blocked(self, key: str) -> bool:
        with self._lock:
            blocked = len(self._prune(key, time.monotonic())) >= self.max_events
            self._gc(key)
            return blocked

    def record(self, key: str) -> None:
        """Enregistre un événement (ex. un échec de connexion)."""
        with self._lock:
            now = time.monotonic()
            self._prune(key, now).append(now)

    def hit(self, key: str) -> bool:
        """Enregistre un événement ; renvoie False (sans l'enregistrer) si la limite est atteinte."""
        with self._lock:
            now = time.monotonic()
            q = self._prune(key, now)
            if len(q) >= self.max_events:
                return False
            q.append(now)
            return True

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._events.clear()


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def too_many_requests(detail: str = "Trop de requêtes. Réessayez dans quelques minutes.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)
