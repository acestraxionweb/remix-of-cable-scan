import { encryptPassword } from "./blowfish.server";

// FNT servers commonly use self-signed certs — disable TLS verification.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { DEMO_ENTITIES, type FntEntity } from "./fnt-demo-data";

const ENTITY_TYPES = [
  "cableMaster",
  "powerCable",
  "dataCable",
  "building",
  "room",
  "floor",
  "campus",
] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type CacheState = {
  index: Map<string, FntEntity>;
  counts: Record<string, number>;
  loadedAt: number;
  source: "fnt" | "demo";
  sessionId: string | null;
  error: string | null;
};

let cache: CacheState | null = null;
let inflight: Promise<CacheState> | null = null;

import fs from "fs";
import path from "path";

function ensureEnvLoaded() {
  const envPaths = [
    "/home/user/cable-scanner-pwa/.env",
    "/home/ubuntu/remix-of-cable-scan/.env",
    path.join(process.cwd(), ".env"),
  ];
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const idx = trimmed.indexOf("=");
            if (idx > 0) {
              const key = trimmed.slice(0, idx).trim();
              const val = trimmed.slice(idx + 1).trim();
              if (key) process.env[key] = val;
            }
          }
        }
      }
    } catch {}
  }
}

function config() {
  ensureEnvLoaded();
  return {
    baseUrl: (process.env["FNT_BASE_URL"] ?? "").replace(/\/+$/, ""),
    username: process.env["FNT_USERNAME"] ?? "",
    password: process.env["FNT_PASSWORD"] ?? "",
    sessionId: process.env["FNT_SESSION_ID"] ?? "",
  };
}

async function soapLogin(baseUrl: string, username: string, password: string): Promise<string> {
  const encrypted = encryptPassword(password);
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Body>
    <ns2:login xmlns:ns2="https://fntsoftware.com/service"
      soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
      <username xsi:type="xsd:string">${username}</username>
      <password xsi:type="xsd:string">${encrypted}</password>
      <dataXml xsi:type="ns2:XML"><login action="login"/></dataXml>
    </ns2:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(`${baseUrl}/service/UserWS`, {
    method: "POST",
    headers: { "content-type": "text/xml; charset=utf-8", SOAPAction: "" },
    body: envelope,
  });
  const text = await res.text();
  const match = /sessionid="([^"]+)"/i.exec(text);
  if (!match) throw new Error(`FNT login failed (HTTP ${res.status})`);
  return match[1]!;
}

async function queryEntity(
  baseUrl: string,
  sessionId: string,
  entityType: EntityType,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${baseUrl}/api/rest/entity/${entityType}/query?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      // FNT's REST API accepts no filters: an empty body returns ALL records.
      body: "{}",
    },
  );
  if (!res.ok) throw new Error(`FNT ${entityType} query failed (HTTP ${res.status})`);
  const json = (await res.json()) as {
    status?: { success?: boolean; errorCode?: number; errorMessage?: string };
    returnData?: Record<string, unknown>[];
  };
  if (json.status && json.status.success === false) {
    throw new Error(json.status.errorMessage ?? `FNT ${entityType} query error`);
  }
  return json.returnData ?? [];
}

function indexRecords(records: FntEntity[]) {
  const index = new Map<string, FntEntity>();
  for (const record of records) {
    for (const key of ["elid", "visibleId", "id"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        index.set(value.trim().toUpperCase(), record);
      }
    }
  }
  return index;
}

function demoState(error: string | null): CacheState {
  return {
    index: indexRecords(DEMO_ENTITIES),
    counts: DEMO_ENTITIES.reduce<Record<string, number>>((acc, r) => {
      acc[r._entityType] = (acc[r._entityType] ?? 0) + 1;
      return acc;
    }, {}),
    loadedAt: Date.now(),
    source: "demo",
    sessionId: null,
    error,
  };
}

async function loadFromFnt(): Promise<CacheState> {
  const { baseUrl, username, password, sessionId: preset } = config();
  if (!baseUrl) return demoState(null);

  try {
    const sessionId = preset || (await soapLogin(baseUrl, username, password));
    const all: FntEntity[] = [];
    const counts: Record<string, number> = {};
    for (const entityType of ENTITY_TYPES) {
      const records = await queryEntity(baseUrl, sessionId, entityType);
      counts[entityType] = records.length;
      for (const record of records) {
        all.push({ ...record, elid: String(record["elid"] ?? ""), _entityType: entityType });
      }
    }
    return {
      index: indexRecords(all),
      counts,
      loadedAt: Date.now(),
      source: "fnt",
      sessionId,
      error: null,
    };
  } catch (error) {
    return demoState(error instanceof Error ? error.message : String(error));
  }
}

export async function getCache(force = false): Promise<CacheState> {
  const stale = !cache || Date.now() - cache.loadedAt > REFRESH_INTERVAL_MS;
  if (!force && cache && !stale) return cache;
  if (!inflight) {
    inflight = loadFromFnt().then((state) => {
      cache = state;
      inflight = null;
      return state;
    });
  }
  return inflight;
}

export async function lookupCable(rawId: string) {
  const key = rawId.trim().toUpperCase();
  let state = await getCache();
  let hit = state.index.get(key);
  // Session may have expired on demo FNT instances: retry once with a fresh login.
  if (!hit && state.source === "fnt") {
    state = await getCache(true);
    hit = state.index.get(key);
  }
  if (!hit) return null;

  // Enrich installed cables with their catalog (cableMaster) type data.
  const isCable = hit._entityType === "powerCable" || hit._entityType === "dataCable";
  const typeElid = isCable && typeof hit["typeElid"] === "string" ? hit["typeElid"] : null;
  const master = typeElid ? state.index.get(typeElid.toUpperCase()) : undefined;
  return master && master !== hit ? { ...master, ...hit, _master: master } : hit;
}

export async function cacheStats(force = false) {
  const state = await getCache(force);
  return {
    source: state.source,
    counts: state.counts,
    indexedKeys: state.index.size,
    loadedAt: new Date(state.loadedAt).toISOString(),
    authenticated: Boolean(state.sessionId),
    error: state.error,
  };
}
