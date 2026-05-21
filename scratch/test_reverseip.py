from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("--- Testing /api/reverseip Endpoint with Valid IP ---")
# Query 8.8.8.8 (Google DNS IP)
response = client.get("/api/reverseip?ip=8.8.8.8")
print("Status Code:", response.status_code)
print("Response JSON Keys:", list(response.json().keys()))
print("Domains Count:", response.json().get("count"))
assert response.status_code == 200
assert "ip" in response.json()
assert "domains" in response.json()
assert "count" in response.json()
print("Valid IP test PASSED!\n")

print("--- Testing /api/reverseip Endpoint with Invalid IP ---")
response = client.get("/api/reverseip?ip=not-an-ip")
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
assert response.status_code == 400
assert response.json() == {"detail": "Invalid IP address format"}
print("Invalid IP validation test PASSED!\n")

print("All tests passed successfully!")
