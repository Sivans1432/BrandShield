# ==============================================================
# BrandShield AI - All-In-One Unified Production Container
# Builds React frontend and serves alongside FastAPI via Nginx
# Ideal for single-container cloud hosts (Render, Railway, Fly.io)
# ==============================================================

# Stage 1: Build React 19 Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci || npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Unified Runtime with Python 3.12, Nginx & Supervisor
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH="/app/backend"

WORKDIR /app

# Install system dependencies, Nginx, and Supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Clean out Debian's default Nginx configuration and default welcome pages
RUN rm -rf /etc/nginx/sites-enabled/* \
    /etc/nginx/sites-available/* \
    /etc/nginx/conf.d/* \
    /var/www/html/* \
    /usr/share/nginx/html/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/app ./backend/app
RUN mkdir -p ./backend/app/static/logos

# Copy compiled frontend SPA to Nginx document root
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Mirror assets to /var/www/html to prevent fallback to Debian default root
RUN mkdir -p /var/www/html && \
    cp -r /usr/share/nginx/html/* /var/www/html/ && \
    chown -R www-data:www-data /usr/share/nginx/html /var/www/html && \
    chmod -R 755 /usr/share/nginx/html /var/www/html

# Copy custom Nginx configuration and Supervisor process management
COPY nginx.all-in-one.conf /etc/nginx/conf.d/brandshield.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Validate build integrity inside the container
RUN test -f /usr/share/nginx/html/index.html && echo "✓ Frontend index.html present in /usr/share/nginx/html"
RUN nginx -t && echo "✓ Nginx configuration syntax verified"
RUN python -c "import app.main; print('✓ FastAPI backend imported successfully')"

# Expose HTTP port 80
EXPOSE 80

# Healthcheck checking Nginx proxy to FastAPI /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1/health || exit 1

# Start Supervisor to run both Uvicorn and Nginx
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
