import urllib.request
import urllib.error
import json
import random

slug = f"test-{random.randint(1000, 9999)}"

url_reg = 'http://localhost:8001/api/auth/register'
data_reg = json.dumps({"name": "Test Rest", "slug": slug, "email": f"{slug}@test.com", "password": "password", "phone": "123", "country": "VE"}).encode("utf-8")

req = urllib.request.Request(url_reg, data_reg, {"Content-Type": "application/json"}, method='POST')
try:
  response = urllib.request.urlopen(req)
  token_resp = json.loads(response.read().decode())
  token = token_resp.get('access_token')
  print('REGISTER OK')
  url_cat = f'http://localhost:8001/api/{slug}/menu/categories'
  data_cat = json.dumps({'name': 'Pizza', 'display_order': 0}).encode('utf-8')
  req_cat = urllib.request.Request(url_cat, data_cat, {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
  response_cat = urllib.request.urlopen(req_cat)
  print('CREATE CAT OK:', response_cat.read().decode())
except urllib.error.HTTPError as e:
  print(f'ERROR {e.code}: {e.read().decode()}')
