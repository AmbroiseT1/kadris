"""Validation et stockage disque des fichiers envoyés par les utilisateurs.

Les fichiers sont écrits sous settings.UPLOAD_DIR avec un nom aléatoire (jamais le nom fourni
par le client) et ne sont servis que par l'endpoint de téléchargement authentifié.
"""
import logging
import os
import secrets
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

UNSUPPORTED_DETAIL = "Format non supporté (PDF, JPEG, PNG, WEBP ou HEIC uniquement)."


def _too_large() -> HTTPException:
    return HTTPException(
        status_code=413,
        detail=f"Fichier trop volumineux (max {settings.MAX_UPLOAD_SIZE_MB} Mo).",
    )


def _unsupported() -> HTTPException:
    return HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=UNSUPPORTED_DETAIL)


async def read_validated_upload(file: UploadFile) -> Tuple[bytes, str]:
    """Vérifie le type déclaré et la taille (sans tout lire en mémoire au-delà de la limite)."""
    mime = (file.content_type or "").lower()
    if mime not in ALLOWED_MIME_TYPES:
        raise _unsupported()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise _too_large()
    return content, mime


def _matches_magic(content: bytes, mime: str) -> bool:
    """Contrôle les premiers octets : le Content-Type envoyé par le client n'est pas fiable."""
    if mime == "application/pdf":
        return content.startswith(b"%PDF")
    if mime == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if mime == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if mime == "image/webp":
        return content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    if mime in ("image/heic", "image/heif"):
        return content[4:8] == b"ftyp"
    return False


async def read_validated_document(file: UploadFile) -> Tuple[bytes, str]:
    """Comme read_validated_upload, avec en plus la vérification de la signature du fichier."""
    content, mime = await read_validated_upload(file)
    if not _matches_magic(content, mime):
        raise _unsupported()
    return content, mime


def upload_root() -> Path:
    root = Path(settings.UPLOAD_DIR).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_file(content: bytes, mime: str) -> str:
    """Écrit le fichier et renvoie son nom de stockage (relatif à UPLOAD_DIR)."""
    name = secrets.token_hex(16) + ALLOWED_MIME_TYPES[mime]
    path = upload_root() / name
    # O_EXCL : n'écrase jamais un fichier existant
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(content)
    return name


def resolve_path(stored_path: str) -> Path:
    """Chemin absolu d'un fichier stocké ; refuse tout ce qui sortirait de UPLOAD_DIR."""
    root = upload_root()
    path = (root / stored_path).resolve()
    if path.parent != root:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier introuvable")
    return path


def delete_file(stored_path: str) -> None:
    try:
        resolve_path(stored_path).unlink(missing_ok=True)
    except (OSError, HTTPException):
        logger.warning("Suppression du fichier stocké impossible")
