import { createHash } from "node:crypto";

const MEASUREMENT_ID = "G-Q9Y8XEE6EF";
const GA4_ENDPOINT = "https://region1.google-analytics.com/mp/collect";
export const MAX_BODY_BYTES = 4_096;
const MAX_EVENT_AGE_MS = 72 * 60 * 60 * 1_000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1_000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
const RATE_LIMIT_MAX_KEYS = 5_000;

const ALLOWED_EVENTS = new Set([
  "extension_installed",
  "save_started",
  "job_started",
  "job_completed",
  "job_failed",
  "job_incomplete",
  "job_cancelled",
  "job_recovered",
  "export_downloaded",
  "review_prompt_shown",
  "review_prompt_clicked",
  "pro_teaser_shown",
  "pro_teaser_clicked",
]);

const PROPERTY_RULES = {
  extension_version: (value) =>
    typeof value === "string" &&
    value.length <= 32 &&
    /^\d{1,3}(?:\.\d{1,3}){0,3}(?:[-+][A-Za-z0-9.-]{1,20})?$/.test(value),
  mode: (value) => ["entire", "current", "recent"].includes(value),
  dom_adapter: (value) => ["old", "new", "unknown"].includes(value),
  duration_bucket: (value) => ["<10s", "10-30s", "30-120s", "2m+"].includes(value),
  pairs_bucket: (value) => ["1-20", "21-100", "101-300", "301+"].includes(value),
  foreground_state: (value) => ["foreground", "background"].includes(value),
  concurrent_jobs_bucket: (value) => ["1", "2", "3-5", "6+"].includes(value),
  retry_count: (value) => Number.isInteger(value) && value >= 0 && value <= 20,
  error_code: (value) =>
    typeof value === "string" && /^[a-z][a-z0-9_]{0,39}$/.test(value),
  export_format: (value) => ["txt", "markdown", "json", "zip", "other"].includes(value),
  complete: (value) => typeof value === "boolean",
  provider: (value) => ["chatgpt", "claude", "gemini", "other"].includes(value),
};

const TOP_LEVEL_KEYS = new Set(["event", "install_id", "timestamp", "properties"]);
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function requestHeader(headers, name) {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === target) return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

function allowedOrigins(env) {
  return String(env.SESSION_SAVER_EXTENSION_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => /^chrome-extension:\/\/[a-p]{32}$/.test(origin));
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

function parseRequestBody(event) {
  if (typeof event.body !== "string") return { error: "invalid_json" };
  if (event.isBase64Encoded && event.body.length > Math.ceil(MAX_BODY_BYTES / 3) * 4) {
    return { error: "payload_too_large" };
  }

  let bytes;
  try {
    bytes = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");
  } catch {
    return { error: "invalid_json" };
  }
  if (bytes.byteLength > MAX_BODY_BYTES) return { error: "payload_too_large" };

  try {
    return { payload: JSON.parse(bytes.toString("utf8")) };
  } catch {
    return { error: "invalid_json" };
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateTelemetryPayload(payload, { nowMs = Date.now() } = {}) {
  if (!isPlainObject(payload)) return null;
  if (Object.keys(payload).some((key) => !TOP_LEVEL_KEYS.has(key))) return null;
  if (!ALLOWED_EVENTS.has(payload.event)) return null;
  if (typeof payload.install_id !== "string" || !UUID_V4_PATTERN.test(payload.install_id)) return null;
  if (typeof payload.timestamp !== "string" || !UTC_TIMESTAMP_PATTERN.test(payload.timestamp)) return null;

  const timestampMs = Date.parse(payload.timestamp);
  if (!Number.isFinite(timestampMs)) return null;
  const normalizedTimestamp = payload.timestamp.includes(".")
    ? payload.timestamp
    : payload.timestamp.replace(/Z$/, ".000Z");
  if (new Date(timestampMs).toISOString() !== normalizedTimestamp) return null;
  if (timestampMs < nowMs - MAX_EVENT_AGE_MS || timestampMs > nowMs + MAX_FUTURE_SKEW_MS) return null;

  const properties = payload.properties === undefined ? {} : payload.properties;
  if (!isPlainObject(properties)) return null;
  for (const [key, value] of Object.entries(properties)) {
    const validate = PROPERTY_RULES[key];
    if (!validate || !validate(value)) return null;
  }

  return {
    event: payload.event,
    installId: payload.install_id.toLowerCase(),
    timestampMs,
    gaTimestampMs: Math.min(timestampMs, nowMs),
    properties,
  };
}

function createRateLimiter({ now = Date.now } = {}) {
  const buckets = new Map();

  return function isRateLimited(installId) {
    const currentTime = now();
    let bucket = buckets.get(installId);
    if (!bucket || currentTime - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
      bucket = { windowStart: currentTime, count: 0 };
      buckets.set(installId, bucket);
    }
    bucket.count += 1;

    if (buckets.size > RATE_LIMIT_MAX_KEYS) {
      for (const [key, value] of buckets) {
        if (currentTime - value.windowStart >= RATE_LIMIT_WINDOW_MS) buckets.delete(key);
      }
      while (buckets.size > RATE_LIMIT_MAX_KEYS) buckets.delete(buckets.keys().next().value);
    }

    return bucket.count > RATE_LIMIT_MAX;
  };
}

export function ga4ClientId(installId) {
  const digest = createHash("sha256").update(installId.toLowerCase()).digest("hex");
  const part1 = BigInt(`0x${digest.slice(0, 32)}`) + 1n;
  const part2 = BigInt(`0x${digest.slice(32)}`) + 1n;
  return `${part1}.${part2}`;
}

function buildGa4Payload(validated, { strictValidation = false } = {}) {
  const payload = {
    client_id: ga4ClientId(validated.installId),
    timestamp_micros: validated.gaTimestampMs * 1_000,
    consent: { analytics_storage: "GRANTED" },
    events: [
      {
        name: validated.event,
        params: validated.properties,
      },
    ],
  };
  if (strictValidation) payload.validation_behavior = "ENFORCE_RECOMMENDATIONS";
  return payload;
}

async function forwardToGa4({ validated, secret, fetchImpl, timeoutMs, endpoint, strictValidation }) {
  const url = new URL(endpoint);
  url.searchParams.set("measurement_id", MEASUREMENT_ID);
  url.searchParams.set("api_secret", secret);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildGa4Payload(validated, { strictValidation })),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function createHandler({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
  timeoutMs = 4_000,
  rateLimit,
  ga4Endpoint = GA4_ENDPOINT,
  strictValidation = false,
} = {}) {
  const isRateLimited = rateLimit || createRateLimiter({ now });

  return async function handler(event) {
    const method = event.httpMethod || "";
    const origin = requestHeader(event.headers, "origin");
    const origins = allowedOrigins(env);
    if (!env.SESSION_SAVER_EXTENSION_ORIGINS) {
      return jsonResponse(503, { ok: false, error: "telemetry_unavailable" });
    }
    if (typeof origin !== "string" || !origins.includes(origin)) {
      return jsonResponse(403, { ok: false, error: "origin_not_allowed" }, { vary: "Origin" });
    }
    const cors = corsHeaders(origin);

    if (method === "OPTIONS") {
      return { statusCode: 204, headers: { ...cors, "cache-control": "no-store" }, body: "" };
    }
    if (method !== "POST") return jsonResponse(405, { ok: false, error: "method_not_allowed" }, cors);

    const contentType = requestHeader(event.headers, "content-type");
    if (typeof contentType !== "string" || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType.trim())) {
      return jsonResponse(415, { ok: false, error: "unsupported_media_type" }, cors);
    }

    const parsed = parseRequestBody(event);
    if (parsed.error === "payload_too_large") {
      return jsonResponse(413, { ok: false, error: parsed.error }, cors);
    }
    if (parsed.error) return jsonResponse(400, { ok: false, error: parsed.error }, cors);

    const validated = validateTelemetryPayload(parsed.payload, { nowMs: now() });
    if (!validated) return jsonResponse(400, { ok: false, error: "invalid_payload" }, cors);
    if (isRateLimited(validated.installId)) {
      return jsonResponse(429, { ok: false, error: "rate_limited" }, { ...cors, "retry-after": "3600" });
    }

    const secret = env.GA4_API_SECRET;
    if (typeof secret !== "string" || !secret.trim()) {
      return jsonResponse(503, { ok: false, error: "telemetry_unavailable" }, cors);
    }

    const delivered = await forwardToGa4({
      validated,
      secret: secret.trim(),
      fetchImpl,
      timeoutMs,
      endpoint: ga4Endpoint,
      strictValidation,
    });
    if (!delivered) return jsonResponse(502, { ok: false, error: "forwarding_failed" }, cors);
    return jsonResponse(202, { ok: true }, cors);
  };
}

export const handler = createHandler();
