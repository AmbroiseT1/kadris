import requests

# L'adresse de ton VPS
url = "http://SERVER_IP:8000/api/v1/documents/analyze"

# Chemin de l'image fourni
image_path = r"C:\Users\ambto\OneDrive - HEC Paris\Bureau\Fichier-2-2-856x1024.jpg"

try:
    with open(image_path, "rb") as f:
        print(f"Envoi du fichier {image_path} au serveur Bricq...")
        files = {"file": f}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    print("Réponse de l'IA :")
    try:
        print(response.json())
    except:
        print("Réponse brute (non-JSON) :")
        print(response.text)
    
except Exception as e:
    print(f"Erreur : {e}")
