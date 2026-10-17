"""
Crée (ou met à jour) le compte administrateur Bricq.

Usage, depuis le dossier backend :
    python create_admin.py admin@exemple.fr
Le mot de passe est demandé de façon masquée (ou lu dans ADMIN_PASSWORD s'il est défini).
Relancer le script avec le même email réinitialise le mot de passe.
"""
import getpass
import os
import sys

from app.db.init_db import upsert_admin
from app.db.migrate import upgrade_to_head
from app.db.session import SessionLocal


def main() -> None:
    email = sys.argv[1] if len(sys.argv) > 1 else os.getenv("ADMIN_EMAIL") or input("Email admin : ")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        password = getpass.getpass("Mot de passe admin : ")
        if password != getpass.getpass("Confirmer : "):
            sys.exit("Les mots de passe ne correspondent pas.")

    upgrade_to_head()  # crée / met à jour le schéma si besoin
    db = SessionLocal()
    try:
        admin = upsert_admin(db, email, password)
    except ValueError as e:
        sys.exit(str(e))
    finally:
        db.close()
    print(f"Compte admin prêt : {admin.email}")


if __name__ == "__main__":
    main()
