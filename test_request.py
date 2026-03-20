import urllib.request
import urllib.error
import json
import random

slug = f"test-{random.randint(1000, 9999)}"

url_reg = 'http://localhost:8001/api/auth/register'
data_reg = json.dumps({"name": "Test Rest", "slug": slug, "email": f"{slug}@test.com", "password": "password", "phone": "123", "country": "VE"}).encode("utf-8")

req = urllib.request.Request(url_reg, data_reg, {"Content-Type": "application/json"}, method='POST')
response = urllib.request.urlopen(req)
token_resp = json.loads(response.read().decode())
token = token_resp.get('access_token')

import sys
sys.path.append('.')
from app.core.security import decode_token

payload = decode_token(token)
print("Decoded payload:", payload)
print("Payload type:", payload.get("type"))
print("Type check:", payload.get("type") in ["staff", "access"])
