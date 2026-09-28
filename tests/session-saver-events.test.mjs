import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHandler,
  ga4ClientId,
  MAX_BODY_BYTES,
} from "../netlify/functions/session-saver-events.mjs";

const NOW = Date.parse("2026-09-26T12:00:00.000Z");
const ORIGIN = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";
const SECRET = "test-only-ga4-secret";

function validPayload(overrides = {}) {
  return {
    event: "job_completed",
    install_id: "123e4567-e89b-42d3-a456-426614174000",
    timestamp: new Date(NOW).toISOString(),
    properties: {
      extension_version: "2.50",
      mode: "entire",
      dom_adapter: "new",
      duration_bucket: "30-120s",
      pairs_bucket: "101-300",
      foreground_state: "background",
      concurrent_jobs_bucket: "3-5",
      retry_count: 0,
      complete: true,
      provider: "chatgpt",
    },
    ...overrides,
  };
}

function makeRequest(payload, overrides = {}) {
  return {
    httpMethod: "POST",
    headers: {
      origin: ORIGIN,
      "content-type": "application/json",
      ...overrides.headers,
    },
    body: overrides.body === undefined ? JSON.stringify(payload) : overrides.body,
    ...overrides,
  };
}

function setup({
  response = { ok: true, status: 204 },
  secret = SECRET,
  fetchImpl,
  ga4Endpoint,
  strictValidation,
} = {}) {
  const calls = [];
  const handler = createHandler({
    env: {
      GA4_API_SECRET: secret,
      SESSION_SAVER_EXTENSION_ORIGINS: ORIGIN,
    },
    now: () => NOW,
    ...(ga4Endpoint ? { ga4Endpoint } : {}),
    ...(strictValidation !== undefined ? { strictValidation } : {}),
    fetchImpl:
      fetchImpl ||
      (async (url, options) => {
        calls.push({ url: new URL(url), options });
        return response;
      }),
  });
  return { handler, calls };
}

async function send(handler, payload, overrides) {
  return handler(makeRequest(payload, overrides));
}

test("valid job_completed event is accepted and forwarded with only approved fields", async () => {
  const { handler, calls } = setup();
  const response = await send(handler, validPayload());

  assert.equal(response.statusCode, 202);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].url.pathname, "/mp/collect");
  const forwarded = JSON.parse(calls[0].options.body);
  assert.equal(forwarded.client_id, ga4ClientId(validPayload().install_id));
  assert.match(forwarded.client_id, /^[0-9]+\.[0-9]+$/);
  assert.equal(forwarded.events[0].name, "job_completed");
  assert.deepEqual(forwarded.events[0].params, validPayload().properties);
  assert.equal(forwarded.events[0].params.install_id, undefined);
  assert.equal(forwarded.timestamp_micros, NOW * 1_000);
  assert.equal(forwarded.validation_behavior, undefined);
  assert.equal(calls[0].url.searchParams.get("measurement_id"), "G-Q9Y8XEE6EF");
  assert.equal(calls[0].url.searchParams.get("api_secret"), SECRET);
});

test("GA4 client ID derivation is deterministic and follows Google's numeric format", () => {
  const installId = validPayload().install_id;
  const first = ga4ClientId(installId);
  const again = ga4ClientId(installId);
  const [part1, part2] = first.split(".");

  assert.equal(first, again);
  assert.match(first, /^[0-9]+\.[0-9]+$/);
  assert.ok(BigInt(part1) > 0n);
  assert.ok(BigInt(part2) > 0n);
});

test("different install UUIDs derive different GA4 client IDs", () => {
  const first = ga4ClientId("123e4567-e89b-42d3-a456-426614174000");
  const second = ga4ClientId("123e4567-e89b-42d3-a456-426614174001");

  assert.notEqual(first, second);
});

test("GA4 forwarding does not include the original install UUID", async () => {
  const { handler, calls } = setup();
  const installId = validPayload().install_id;
  const response = await send(handler, validPayload());
  const forwardedBody = calls[0].options.body;

  assert.equal(response.statusCode, 202);
  assert.doesNotMatch(forwardedBody, new RegExp(installId));
  assert.notEqual(JSON.parse(forwardedBody).client_id, installId);
});

test("mocked GA4 validation request uses Google's debug payload format", async () => {
  const { handler, calls } = setup({
    ga4Endpoint: "https://region1.google-analytics.com/debug/mp/collect",
    strictValidation: true,
  });
  const response = await send(handler, validPayload());

  assert.equal(response.statusCode, 202);
  assert.equal(calls[0].url.pathname, "/debug/mp/collect");
  const validationPayload = JSON.parse(calls[0].options.body);
  assert.match(validationPayload.client_id, /^[0-9]+\.[0-9]+$/);
  assert.equal(validationPayload.validation_behavior, "ENFORCE_RECOMMENDATIONS");
  assert.deepEqual(validationPayload.events, [
    {
      name: "job_completed",
      params: validPayload().properties,
    },
  ]);
  assert.equal(validationPayload.timestamp_micros, NOW * 1_000);
  assert.equal(validationPayload.consent.analytics_storage, "GRANTED");
  assert.equal(validationPayload.events[0].params.install_id, undefined);
});

test("unknown event names are rejected", async () => {
  const { handler, calls } = setup();
  const response = await send(handler, validPayload({ event: "anything_else" }));

  assert.equal(response.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("unexpected properties are rejected", async () => {
  const { handler, calls } = setup();
  const payload = validPayload();
  payload.properties.unapproved_flag = true;
  const response = await send(handler, payload);

  assert.equal(response.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("conversation text at the top level is rejected without echoing it", async () => {
  const { handler, calls } = setup();
  const payload = validPayload({ conversation_text: "private conversation body" });
  const response = await send(handler, payload);

  assert.equal(response.statusCode, 400);
  assert.doesNotMatch(response.body, /private conversation body/);
  assert.equal(calls.length, 0);
});

test("raw exception text is rejected as an error_code", async () => {
  const { handler, calls } = setup();
  const payload = validPayload();
  payload.properties.error_code = "TypeError: chat title was missing";
  const response = await send(handler, payload);

  assert.equal(response.statusCode, 400);
  assert.doesNotMatch(response.body, /chat title/);
  assert.equal(calls.length, 0);
});

test("malformed or non-v4 install UUIDs are rejected", async () => {
  const { handler, calls } = setup();
  const response = await send(handler, validPayload({ install_id: "not-an-id" }));

  assert.equal(response.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("invalid enum values are rejected", async () => {
  const { handler, calls } = setup();
  const payload = validPayload();
  payload.properties.mode = "all_conversations";
  const response = await send(handler, payload);

  assert.equal(response.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("oversized request bodies are rejected before JSON parsing", async () => {
  const { handler, calls } = setup();
  const response = await send(handler, validPayload(), {
    body: "x".repeat(MAX_BODY_BYTES + 1),
  });

  assert.equal(response.statusCode, 413);
  assert.deepEqual(JSON.parse(response.body), { ok: false, error: "payload_too_large" });
  assert.equal(calls.length, 0);
});

test("GA4 downstream failure returns a generic gateway error", async () => {
  const { handler, calls } = setup({ response: { ok: false, status: 503 } });
  const response = await send(handler, validPayload());

  assert.equal(response.statusCode, 502);
  assert.deepEqual(JSON.parse(response.body), { ok: false, error: "forwarding_failed" });
  assert.equal(calls.length, 1);
});

test("successful responses never expose the GA4 API secret", async () => {
  const { handler } = setup();
  const response = await send(handler, validPayload());

  assert.equal(response.statusCode, 202);
  assert.doesNotMatch(response.body, new RegExp(SECRET));
  assert.equal(response.headers["access-control-allow-origin"], ORIGIN);
});

test("GET requests are rejected", async () => {
  const { handler, calls } = setup();
  const response = await handler(makeRequest(validPayload(), { httpMethod: "GET" }));

  assert.equal(response.statusCode, 405);
  assert.equal(calls.length, 0);
});

test("consent is not a required request field", async () => {
  const { handler, calls } = setup();
  const payload = validPayload();
  delete payload.consent;
  const response = await send(handler, payload);

  assert.equal(response.statusCode, 202);
  assert.equal(calls.length, 1);
});

test("preflight is limited to an explicitly configured extension origin", async () => {
  const { handler } = setup();
  const response = await handler({
    httpMethod: "OPTIONS",
    headers: { origin: ORIGIN },
  });

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], ORIGIN);
  assert.equal(response.headers["access-control-allow-methods"], "POST, OPTIONS");
});

test("repeated events from one install are rate limited in a warm function instance", async () => {
  const { handler } = setup();
  let response;
  for (let index = 0; index < 61; index += 1) response = await send(handler, validPayload());

  assert.equal(response.statusCode, 429);
  assert.equal(response.headers["retry-after"], "3600");
});
