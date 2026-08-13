# Project Registry: Remix of Cable Scan

## Overview
- **Project**: Remix of Cable Scan (Cable Scanner PWA)
- **Path**: `/app`
- **Source Repository**: `https://github.com/acestraxionweb/remix-of-cable-scan.git`
- **Tech Stack**: Vite, TanStack Start, React 19, TypeScript, Docker

## Execution & Access
- **HTTPS Access URL**: [`https://cable.172.26.239.122.nip.io`](https://cable.172.26.239.122.nip.io) or [`https://cable.127.0.0.1.nip.io`](https://cable.127.0.0.1.nip.io)
- **HTTP Auto-Redirect**: Port 80 auto-redirects (`308 Permanent Redirect`) to HTTPS Port 443
- **Internal Direct Container Port**: `http://localhost:5173`
- **Container Name**: `cable-scanner-app`
- **Docker Compose Command**: `docker compose up -d --build`
- **Configuration**: `.env` (template at `.env.example`)
