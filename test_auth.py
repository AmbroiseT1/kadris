import requests

# URL de l'API (VPS)
API_URL = "http://SERVER_IP:8000/api/v1"

# 1. Création d'un compte
print("--- 1. Inscription ---")
email = "test@example.com"
password = "password123"

try:
    response = requests.post(f"{API_URL}/auth/register", json={"email": email, "password": password})
    if response.status_code == 200:
        print("✅ Compte créé avec succès")
        print(response.json())
    elif response.status_code == 400 and "already exists" in response.text:
        print("⚠️ Le compte existe déjà (ce n'est pas grave)")
    else:
        print(f"❌ Erreur inscription: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Erreur connexion: {e}")

# 2. Connexion (Récupération du Token)
print("\n--- 2. Connexion ---")
token = None
try:
    response = requests.post(f"{API_URL}/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        print(f"✅ Token récupéré : {token[:20]}...")
    else:
        print(f"❌ Erreur connexion: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Erreur connexion: {e}")

# 3. Accès protégé (/users/me)
if token:
    print("\n--- 3. Accès Protégé ---")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/users/me", headers=headers)
        if response.status_code == 200:
            print("✅ Accès autorisé !")
            print(f"Utilisateur : {response.json()['email']}")
        else:
            print(f"❌ Accès refusé: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
else:
    print("\n❌ Pas de token, impossible de tester l'accès protégé.")
