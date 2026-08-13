# Remix of Cable Scan

Cable Scanner PWA — Field Engineer Scanner & FNT Command Integration

## Overview
A Progressive Web App (PWA) that allows field engineers to scan cable barcodes/QR codes with a smartphone camera and instantly view cable data from **FNT Command** (telecom infrastructure management system). Features continuous scanning, offline caching, and automatic fallback to demo data.

---

## 🚀 Quick Start & Installation

### Option 1: Run with Docker & Docker Compose (Recommended)

#### Prerequisites
- Docker & Docker Compose installed.

#### Step 1: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your FNT Command connection details:
```env
FNT_BASE_URL=https://YOUR_FNT_SERVER/app/command
FNT_USERNAME=command
FNT_PASSWORD=command
FNT_SESSION_ID=
```
*(Note: If `FNT_BASE_URL` is left empty or unreachable, the application automatically runs in built-in Demo Mode).*

#### Step 2: Build & Start the Container
```bash
docker compose up -d --build
```
The application will be running live on `http://localhost:5173`.

#### Useful Docker Commands
```bash
# View container logs
docker compose logs -f

# Restart container
docker compose restart

# Stop container
docker compose down
```

---

### Option 2: Local Development (Without Docker)

#### Prerequisites
- Node.js 20+ and npm

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🔒 HTTPS & Nginx Reverse Proxy Setup

Camera access in modern mobile browsers requires **HTTPS** (or `localhost`). For network deployment, wire the application into an Nginx reverse proxy.

### Sample Nginx Reverse Proxy Configuration

```nginx
# Cable Scanner PWA HTTP -> HTTPS Redirect
server {
    listen 80;
    server_name cable.172.26.239.122.nip.io ~^cable\..*\.nip\.io$;
    return 308 https://$host$request_uri;
}

# Cable Scanner PWA HTTPS Reverse Proxy
server {
    listen 443 ssl;
    server_name cable.172.26.239.122.nip.io ~^cable\..*\.nip\.io$;

    ssl_certificate /etc/nginx/certs/owui.crt;
    ssl_certificate_key /etc/nginx/certs/owui.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 🏗️ Architecture & FNT Integration

### System Architecture
```
┌──────────────────────────────┐
│   PWA (Mobile Browser)       │
│   Camera + html5-qrcode      │
│   Info Overlay Card (UI)     │
│   IndexedDB Cache            │
└──────────┬───────────────────┘
           │ GET /api/cable/:elid
           ▼
┌──────────────────────────────┐
│   TanStack Start / Nitro SSR │
│   In-memory Cable Cache      │
│   FNT SOAP/REST Client       │
│   Blowfish Password Encrypt │
└──────────┬───────────────────┘
           │ POST /entity/{type}/query
           ▼
┌──────────────────────────────┐
│   FNT Command Server        │
└──────────────────────────────┘
```

### FNT Integration Flow
1. **Password Encryption**: Password is encrypted client-side/server-side using FNT's embedded Blowfish ECB key.
2. **SOAP Login**: Logs in via `/service/UserWS` to obtain a session token.
3. **Data Caching**: Queries `cableMaster`, `powerCable`, and `dataCable` entities and caches records indexed by `elid`, `visibleId`, and `id`.
4. **Fallback Demo Mode**: Automatically activates if `FNT_BASE_URL` is unconfigured or unreachable.

---

## 📁 Repository Structure
```
.
├── Dockerfile              # Multi-stage Node 22 Alpine Docker build
├── docker-compose.yml      # Docker Compose service definition (Port 5173)
├── .dockerignore           # Optimized build context exclusions
├── .env.example            # Environment template
├── REGISTRY.md             # System & project deployment registry
├── src/
│   ├── components/         # React scanner & cable card UI
│   ├── lib/
│   │   ├── fnt.server.ts   # FNT SOAP/REST client & caching engine
│   │   ├── fnt-demo-data.ts# Fallback demo cable dataset
│   │   └── cable.functions.ts # SSR functions for cable lookup
│   └── routes/             # TanStack Start file-based routes
└── vite.config.ts          # Vite & PWA configuration
```
