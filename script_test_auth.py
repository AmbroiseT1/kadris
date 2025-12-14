
import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000/api/v1"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

email = f"test_{random_string()}@example.com"
password = "testpassword123"

print(f"Testing with {email} / {password}")

# 1. Register
print("--- REGISTER ---")
reg_payload = {"email": email, "password": password, "confirmPassword": password}
try:
    r_reg = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"Status: {r_reg.status_code}")
    print(f"Response: {r_reg.text}")
    if r_reg.status_code not in [200, 201]:
        print("Registration failed")
except Exception as e:
    print(f"Registration exception: {e}")

# 2. Login
print("\n--- LOGIN ---")
login_data = {"username": email, "password": password}
try:
    r_login = requests.post(f"{BASE_URL}/auth/login", data=login_data) # Form data
    print(f"Status: {r_login.status_code}")
    print(f"Response: {r_login.text}")
    
    if r_login.status_code == 200:
        token_data = r_login.json()
        token = token_data.get("access_token")
        print(f"Token received: {token[:20]}...")
        
        # 3. User Me
        print("\n--- USER ME ---")
        headers = {"Authorization": f"Bearer {token}"}
        r_me = requests.get(f"{BASE_URL}/users/me", headers=headers)
        print(f"Status: {r_me.status_code}")
        print(f"Response: {r_me.text}")
    else:
        print("Login failed")

except Exception as e:
    print(f"Login exception: {e}")
