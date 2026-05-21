from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("--- Testing /api/dns/history Endpoint with Valid Domain (google.com) ---")
response = client.get("/api/dns/history?domain=google.com")
print("Status Code:", response.status_code)
data = response.json()
print("Response JSON Keys:", list(data.keys()))
print("A Records:", data.get("a_records"))
print("MX Records:", data.get("mx_records"))
print("NS Records:", data.get("ns_records"))
print("Hosts Count:", len(data.get("hosts", [])))
print("First Host Example:", data.get("hosts")[0] if data.get("hosts") else "None")

assert response.status_code == 200
assert data.get("domain") == "google.com"
assert isinstance(data.get("a_records"), list)
assert isinstance(data.get("mx_records"), list)
assert isinstance(data.get("ns_records"), list)
assert isinstance(data.get("hosts"), list)
print("Valid domain test PASSED!\n")

print("--- Testing /api/dns/history Endpoint with Invalid Domain ---")
response = client.get("/api/dns/history?domain=not_a_valid_domain")
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
assert response.status_code == 400
assert response.json() == {"detail": "Invalid domain name format"}
print("Invalid domain format test PASSED!\n")

print("All DNS history tests passed successfully!")
