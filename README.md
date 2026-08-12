# Remix of Cable Scan

Cable Scanner PWA — Agent Prompt
Project Overview
Build a Progressive Web App (PWA) that lets field engineers scan cable barcodes/QR codes with their phone camera and instantly see cable information from FNT Command (a telecom infrastructure management system). The app must support continuous scanning — the camera stays live, engineer points at next cable, info appears inline. No exit between scans.

Architecture
┌──────────────────────────────┐
│   PWA (Mobile Browser)       │
│                              │
│   Camera + html5-qrcode      │
│   Info Overlay Card (UI)     │
│   IndexedDB Cache            │
│   Service Worker (PWA)       │
└──────────┬───────────────────┘
           │ GET /api/cable/:elid
           ▼
┌──────────────────────────────┐
│   Middleware (Node.js)       │
│                              │
│   Express.js server         │
│   In-memory cable cache     │
│   FNT SOAP/REST client      │
│   Blowfish password encrypt │
└──────────┬───────────────────┘
           │ POST /entity/{type}/query
           ▼
┌──────────────────────────────┐
│   FNT Command Server        │
│                              │
│   SOAP: /service/UserWS     │
│   SOAP: /service/DispatcherWS│
│   REST: /api/rest/entity/   │
└──────────────────────────────┘
Tech Stack
Layer	Technology	Notes
Frontend	Vanilla HTML/CSS/JS	No frameworks — lightweight PWA
Scanner	html5-qrcode (CDN)	https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js
Middleware	Node.js + Express	Server-side only, keeps FNT credentials secure
FNT Auth	SOAP + Blowfish ECB	Password encrypted client-side before SOAP login
Cache	IndexedDB (client) + In-memory Map (server)	Client: 1hr TTL. Server: all cables cached on startup
PWA	Service Worker + manifest.json	Offline static assets, network-first for API
FNT Integration (CRITICAL — Already Reverse-Engineered)
Authentication Flow
Blowfish-encrypt the password using FNT's embedded key:
const ary = [99,110,205,31,66,100,167,8348,65371,20,119,217,126,114,88,94,
  77,18,78,478,149,215,165,106,164,95,30,29,205,119,154,134,
  65371,64,190,169,219,134,248,230,222,14,136,124,235,251,77,223,
  8376,111,249,254,228,27,8320,141];
const key = ary.map(n => String.fromCharCode(n ^ 166)).join("");
// Then: bf.encrypt(password, true) → returns 3-digit zero-padded byte string
SOAP login to {FNT_BASE_URL}/service/UserWS:
<ns2:login xmlns:ns2="https://fntsoftware.com/service"
  soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <username xsi:type="xsd:string">USERNAME</username>
  <password xsi:type="xsd:string">BLOWFISH_ENCRYPTED_PASSWORD</password>
  <dataXml xsi:type="ns2:XML"><login action="login"/></dataXml>
</ns2:login>
Extract session ID from response (regex: sessionid="xxx")
Cache all cable data on startup (REST API returns ALL records, no filtering):
POST /api/rest/entity/cableMaster/query?sessionId=X with body {}
POST /api/rest/entity/powerCable/query?sessionId=X with body {}
POST /api/rest/entity/dataCable/query?sessionId=X with body {}
REST API Query Format
Endpoint: POST {FNT_BASE_URL}/api/rest/entity/{entityType}/query?sessionId={sid}

Request body: {} (empty object — no filtering supported, returns ALL records)

Response:

{
  "status": { "errorCode": 0, "success": true },
  "returnData": [
    {
      "elid": "HDGBQY02DZI4QV",
      "type": "LWL-UNIVERSAL",
      "explanation": "Universal loose tube fiber-optic cable with 48 fibers G50/125",
      "connector1": "COMMON",
      "connector2": "COMMON",
      "medium": "FO",
      "category": "NETWORK",
      "diameter": 12.5,
      "weight": 185,
      "manufacturer": null,
      "manufacturerArticleNumber": null,
      "deliverLength": null,
      "isStandard": false,
      "prefix": "FCBL-"
    }
  ]
}
Entity Types & Fields
cableMaster (catalog — what type of cable it is):

Field	Description
elid	Internal ID (14 chars, alphanumeric)
type	Cable type name (e.g. "LWL-UNIVERSAL")
explanation	Description
category	NETWORK, POWER, etc.
medium	FO (fiber), CU (copper), etc.
connector1 / connector2	Connector types
diameter	mm
weight	kg/km
manufacturer	Manufacturer name
manufacturerArticleNumber	Part number
deliverLength	Delivered length
isStandard	Boolean
prefix	ID prefix
powerCable (installed instance):

Field	Description
elid	Internal ID
id	Object ID (visible, e.g. "PWR-1044")
visibleId	Visible ID
typeElid	Links to cableMaster ELID
length	Cable length
lengthIn / lengthOut	Front-end/initial length
installDate	Installation date
attenuation	dB
resistance	Ohm
emvEmission / emvResistance	EMC
remark	Notes
dataCable (installed instance):

Field	Description
elid	Internal ID
id	Object ID (e.g. "FCBL-1072")
visibleId	Visible ID
typeElid	Links to cableMaster ELID
length	Cable length
planStatus	ACTUAL, PLANNED, etc.
tcoLinename	Line name
tcoServiceType	Service type
tcoStatus	Status
Important Notes on FNT
No filtering in REST API — must fetch ALL records and index by ELID in memory
Index by multiple keys: elid, visibleId, id (so scans of any ID format work)
Demo FNT instances have very short session timeouts (~seconds). Production instances are stable.
Self-signed certs common — disable TLS verification: process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
Session ID can be pre-configured via env var FNT_SESSION_ID to bypass login
UI/UX Requirements
Core Flow
Phone camera opens full-screen
Scanner runs continuously (no buttons to start/stop)
Engineer points camera at cable barcode/QR
Decoded ELID triggers API lookup
Info card slides up from bottom showing cable details
Engineer moves to next cable — camera stays live, new info appears
Visual Design
Dark theme: background #1a1a2e, cards #16213e
Glass-morphism: backdrop-filter: blur(20px) on info card
Accent colors: #00b4d8 (success), #e94560 (error), #0f3460 (headers)
Scan region: animated green line sweeping across scan area
Info card: bottom sheet with handle, slides up with animation
Skeleton loader: pulsing gray bars while fetching
System font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Components
Full-screen camera view (background)
Scan region overlay (green bordered area with animated scan line)
Top bar (title + connection dot + torch/camera/manual buttons)
Info card (bottom sheet with cable fields)
Manual input (small input field as fallback)
Scan count badge (shows how many cables scanned)
Info Card Fields to Display
┌─────────────────────────────────┐
│  ✓ Found          ELID: xxxxxx │
│─────────────────────────────────│
│  Type:            Category:     │
│  LWL-UNIVERSAL    NETWORK       │
│                                 │
│  Description:                   │
│  Universal loose tube...        │
│                                 │
│  Connector 1:     Connector 2:  │
│  COMMON            COMMON       │
│                                 │
│  Diameter:         Weight:      │
│  12.5mm            185 kg/km    │
│                                 │
│  Manufacturer:     Part #:      │
│  Nexans            ABC-123      │
└─────────────────────────────────┘
Scanner Behavior
Continuous scanning — html5-qrcode in scan loop mode
Debounce — ignore same ELID for 2 seconds after detection
Camera toggle — front/rear camera switch
Torch toggle — flashlight for dark environments
Pause on tab switch — save battery when app is backgrounded
Resume on tab return — restart scanner automatically
API Contract
Middleware Endpoints
Method	Endpoint	Description
GET	/api/health	Health check + cache stats
GET	/api/cable/:elid	Look up cable by ELID, visibleId, or id
GET	/api/cache	Cache statistics
POST	/api/cache/refresh	Force cache refresh from FNT
Response Format
Success:

{
  "success": true,
  "data": {
    "elid": "HDGBQY02DZI4QV",
    "type": "LWL-UNIVERSAL",
    "explanation": "...",
    "_entityType": "cableMaster"
  }
}
Not Found:

{
  "success": false,
  "error": "CABLE_NOT_FOUND",
  "message": "No cable found with ELID: xxx"
}
File Structure
cable-scanner-pwa/
├── public/                     # PWA frontend (static files)
│   ├── index.html              # Main app (single-page, all CSS inline)
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── test-qrcodes.html       # Test page with QR codes
│   └── icons/                  # QR code PNGs for testing
│       └── qr_*.png
├── src/                        # Frontend JS modules
│   ├── app.js                  # Main entry — ties everything together
│   ├── scanner.js              # Continuous barcode/QR scanning
│   ├── api.js                  # Middleware API client
│   ├── cache.js                # IndexedDB cache layer
│   └── ui.js                   # Info card, loading, error states
├── middleware/                  # Server-side proxy
│   ├── server.js               # Express server
│   ├── fnt-client.js           # FNT SOAP/REST client + cache
│   ├── blowfish.js             # Exact Blowfish ECB from FNT client JS
│   ├── .env                    # FNT credentials (not committed)
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
Configuration
Environment Variables (.env)
FNT_BASE_URL=https://YOUR_FNT_SERVER/app/command
FNT_USERNAME=command
FNT_PASSWORD=command
FNT_SESSION_ID=           # Optional: pre-authenticated session to skip login
PORT=3000
PWA Manifest
{
  "name": "Cable Scanner",
  "short_name": "CableScan",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e"
}
Requirements Checklist
PWA Frontend
 Full-screen camera view with html5-qrcode continuous scanning
 Animated scan region overlay (green border + sweep line)
 Floating bottom-sheet info card with glass-morphism
 Skeleton loading state while fetching cable data
 Error states (not found, network error, FNT unavailable)
 Camera toggle (front/rear)
 Torch/flashlight toggle
 Manual ELID input fallback
 Scan count badge
 Connection status indicator (green/red dot)
 Debounce (2s) to prevent re-triggering on same barcode
 Pause scanner on tab hide, resume on tab show
 IndexedDB cache (1hr TTL)
 Service worker for offline static assets
 PWA manifest for installability
 Dark theme, responsive, mobile-first
Middleware
 Express.js server on configurable port
 CORS enabled for all origins
 FNT SOAP login with Blowfish-encrypted password
 Pre-configured session ID support (FNT_SESSION_ID env var)
 Cache ALL cableMasters, powerCables, dataCables on startup
 Index by elid, visibleId, and id for flexible lookups
 Auto-refresh cache every 30 minutes
 Re-login on session expiry
 Health endpoint with cache stats
 Force refresh endpoint
 Static file serving for PWA
Already Working (Don't Change)
✅ Blowfish ECB encryption (exact FNT implementation extracted to blowfish.js)
✅ FNT REST API format (POST /entity/{type}/query with {} body)
✅ Session management and cache refresh logic
✅ All cable data loads successfully (191 cableMasters, 7534 powerCables, 26049 dataCables)
Testing
Test QR Codes Available
ELID	Entity	Description
HDGBQY02DZI4QV	cableMaster	Fiber-optic 48 fibers
060I5XCW2PRIPB	powerCable	PWR-1044
WZ41CWBR8A1D1K	dataCable	FCBL-1072
ET45DWFK89DZCD	cableMaster	Cable type
Test Page
/test-qrcodes.html — displays all 4 QR codes for scanning tests.

How to Run
cd middleware
npm install
node server.js
# Open http://localhost:3000 on phone
# Open http://localhost:3000/test-qrcodes.html on computer
# Scan QR codes from computer screen with phone
Notes for the Agent
Don't change the Blowfish implementation — blowfish.js is extracted directly from FNT's client JS and works correctly. Any reimplementation will have subtle bugs.
Don't try to filter FNT REST queries — the API only accepts {} and returns ALL records. Filtering is done in-memory after fetching.
The FNT session can expire quickly on demo instances. Support FNT_SESSION_ID env var to bypass login.
Camera access requires HTTPS in production (not localhost). For Tailscale access, use http://TAILSCALE_IP:3000 (Tailscale network is trusted).
html5-qrcode CDN: https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js
The barcode/QR labels will encode just the ELID (14-char alphanumeric string). Both barcode (Code128) and QR encode the same value.
All FNT data is in camelCase in the REST response (e.g., elid, typeElid, visibleId, connector1).
Index the cache by multiple keys: elid, visibleId, and id — so scans of any identifier format work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/df7b9d8d-2932-414a-be1e-caf8a7380df9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
