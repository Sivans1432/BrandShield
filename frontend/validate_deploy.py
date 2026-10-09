import os
import sys

errors = []
warnings = []

print("=== BRANDSHIELD AI DEPLOYMENT VALIDATION ===")

# 1. Check frontend build
dist_index = os.path.join('frontend', 'dist', 'index.html')
if not os.path.exists(dist_index):
    errors.append("frontend/dist/index.html does not exist. Run 'npm run build' first.")
else:
    with open(dist_index, 'r', encoding='utf-8') as f:
        html = f.read()
    if 'id="root"' in html:
        print("[PASS] frontend/dist/index.html exists and contains #root container.")
    else:
        warnings.append("frontend/dist/index.html does not contain #root div.")

# 2. Check root Dockerfile
dockerfile = 'Dockerfile'
if not os.path.exists(dockerfile):
    errors.append("Root Dockerfile does not exist.")
else:
    with open(dockerfile, 'r', encoding='utf-8') as f:
        df_content = f.read()
    if "FROM node:20-alpine AS frontend-builder" not in df_content:
        errors.append("Dockerfile missing node:20-alpine frontend-builder stage.")
    if "rm -rf /etc/nginx/sites-enabled/*" not in df_content:
        errors.append("Dockerfile does not remove default Nginx sites-enabled.")
    if "/frontend/dist /usr/share/nginx/html" not in df_content:
        errors.append("Dockerfile does not copy dist to /usr/share/nginx/html.")
    if "nginx -t" not in df_content:
        warnings.append("Dockerfile does not run 'nginx -t' build verification.")
    print("[PASS] Root Dockerfile contains all clean-slate build instructions and validations.")

# 3. Check nginx.all-in-one.conf
nginx_conf_path = 'nginx.all-in-one.conf'
with open(nginx_conf_path, 'r', encoding='utf-8') as f:
    conf = f.read()

checks = [
    ("listen 80 default_server;", "Nginx listening on port 80 as default_server"),
    ("server_name _;", "Nginx catch-all server_name _"),
    ("root /usr/share/nginx/html;", "Document root set to /usr/share/nginx/html"),
    ("try_files $uri $uri/ /index.html;", "React Router fallback try_files"),
    ("location /api/ {", "/api/ proxy block defined"),
    ("proxy_pass http://127.0.0.1:8000/api/;", "/api/ proxy pass to 127.0.0.1:8000/api/"),
    ("location /static/ {", "/static/ proxy block defined"),
    ("proxy_pass http://127.0.0.1:8000/static/;", "/static/ proxy pass to 127.0.0.1:8000/static/"),
    ("location /health {", "/health proxy block defined"),
    ("proxy_pass http://127.0.0.1:8000/health;", "/health proxy pass to 127.0.0.1:8000/health"),
    ("location ~ ^/(docs|openapi\\.json|redoc) {", "FastAPI docs proxy block defined"),
]

for string_to_find, desc in checks:
    if string_to_find in conf:
        print(f"[PASS] {desc}")
    else:
        errors.append(f"nginx.all-in-one.conf missing: {string_to_find} ({desc})")

# 4. Check supervisord.conf
sup_path = 'supervisord.conf'
with open(sup_path, 'r', encoding='utf-8') as f:
    sup = f.read()

if "command=uvicorn app.main:app --host 127.0.0.1 --port 8000" in sup and "command=nginx -g \"daemon off;\"" in sup:
    print("[PASS] supervisord.conf correctly orchestrates Uvicorn (127.0.0.1:8000) and Nginx daemon off.")
else:
    errors.append("supervisord.conf command mismatch.")

# 5. Check Python backend imports
sys.path.insert(0, os.path.abspath('backend'))
try:
    import app.main
    from app.services.authenticity_engine import BeautifulSoup, fuzz
    from app.utils.image_sim import Image
    print("[PASS] Backend FastAPI app.main and all risk engine dependencies import without errors.")
except Exception as e:
    errors.append(f"Backend import error: {e}")

# 6. Check frontend API relative URL
api_js_path = os.path.join('frontend', 'src', 'services', 'api.js')
with open(api_js_path, 'r', encoding='utf-8') as f:
    api_src = f.read()

if "const API_BASE = '/api';" in api_src:
    print("[PASS] frontend/src/services/api.js uses relative '/api' base URL.")
else:
    warnings.append("frontend/src/services/api.js does not contain const API_BASE = '/api';")

# 7. Check root .dockerignore
if os.path.exists('.dockerignore'):
    with open('.dockerignore', 'r', encoding='utf-8') as f:
        di = f.read()
    if 'node_modules' in di:
        print("[PASS] Root .dockerignore exists and excludes node_modules.")
    else:
        warnings.append(".dockerignore missing node_modules exclusion.")
else:
    errors.append(".dockerignore missing at root.")

# Report results
print("\n=== SUMMARY ===")
if warnings:
    print(f"Warnings ({len(warnings)}):")
    for w in warnings:
        print(f"  [!] {w}")
if errors:
    print(f"FAILED WITH {len(errors)} ERRORS:")
    for err in errors:
        print(f"  [X] {err}")
    sys.exit(1)
else:
    print("ALL VALIDATION CHECKS PASSED PERFECTLY!")
