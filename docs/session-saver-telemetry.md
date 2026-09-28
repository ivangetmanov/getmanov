# Session Saver telemetry integration

This is the handoff spec for the later Chrome extension implementation. This endpoint is in the getmanov.com repository; it does not modify or depend on the extension repository.

## Architecture audit

- **Site:** Astro 4 static site, built to `dist/`; there is no Astro SSR adapter or Astro API route.
- **Hosting:** Netlify. The repository already has `netlify/functions/pet-sitting-inquiry.mjs`, invoked through a rewrite, so another Netlify Function is the smallest existing-stack implementation.
- **Analytics:** `src/layouts/BaseLayout.astro` loads GA4 `G-Q9Y8XEE6EF` in the browser and tracks website funnel events including `session_saver_cta_click` and `chrome_store_click`. The endpoint uses the same property through the GA4 Measurement Protocol.
- **Configuration:** server-only Netlify environment variables are already used for the pet-sitting function. This endpoint uses `GA4_API_SECRET` and `SESSION_SAVER_EXTENSION_ORIGINS`.
- **Analytics helpers:** browser-side GA4 calls live in Astro layouts/components. There was no server-side GA4 helper before this function.
- **Headers / CSP / redirects:** `public/_headers` only contains retired-page `X-Robots-Tag` rules. No CSP is configured. `public/_redirects` carries Netlify redirects; the API rewrite is added there.
- **Privacy copy:** the live Astro policy is `src/pages/tools/session-saver/privacy-policy/index.astro`. A legacy HTML policy also exists at `tools/session-saver/privacy-policy.html`; confirm whether anything outside this Astro build publishes it before updating it.

## Endpoint

- **Production URL:** `https://getmanov.com/api/session-saver/events`
- **Method:** `POST` JSON, one event per request.
- **Required headers:** `Content-Type: application/json`; the Chrome extension request has its `Origin` set by Chrome.
- **CORS preflight:** `OPTIONS` is supported for configured extension origins. The server returns the exact allowed origin, permits `POST, OPTIONS`, and permits only `Content-Type`.
- **Consent:** there is no consent field. The extension must send no request until the user opts in; decline means zero requests. Do not add a fallback identifier or tracking path.
- **Body limit:** 4,096 bytes.
- **Timestamp:** UTC ISO-8601 ending in `Z`; at most 72 hours old and no more than 5 minutes in the future. A small accepted future clock skew is normalized to the function's receipt time for GA4.
- **Install ID:** UUID v4 only. Generate a random UUID in the extension; do not use an account, email, browser ID, page ID, or fingerprint.
- **Properties:** optional object; all keys and values must match the allowlist below. Unknown top-level keys and unknown properties are rejected as a whole. The endpoint does not keep the request body or log validation failures.

### Request example

```json
{
  "event": "job_completed",
  "install_id": "123e4567-e89b-42d3-a456-426614174000",
  "timestamp": "2026-09-26T12:00:00.000Z",
  "properties": {
    "extension_version": "2.50",
    "mode": "entire",
    "dom_adapter": "new",
    "duration_bucket": "30-120s",
    "pairs_bucket": "101-300",
    "foreground_state": "background",
    "concurrent_jobs_bucket": "3-5",
    "retry_count": 0
  }
}
```

### Supported events

`extension_installed`, `save_started`, `job_started`, `job_completed`, `job_failed`, `job_incomplete`, `job_cancelled`, `job_recovered`, `export_downloaded`, `review_prompt_shown`, `review_prompt_clicked`, `pro_teaser_shown`, `pro_teaser_clicked`.

### Supported properties

| Property | Accepted values |
| --- | --- |
| `extension_version` | Version string such as `2.50` (bounded numeric dotted version, optional short prerelease/build suffix) |
| `mode` | `entire`, `current`, `recent` |
| `dom_adapter` | `old`, `new`, `unknown` |
| `duration_bucket` | `<10s`, `10-30s`, `30-120s`, `2m+` |
| `pairs_bucket` | `1-20`, `21-100`, `101-300`, `301+` |
| `foreground_state` | `foreground`, `background` |
| `concurrent_jobs_bucket` | `1`, `2`, `3-5`, `6+` |
| `retry_count` | Integer from 0 through 20 |
| `error_code` | Lowercase stable machine code, 1–40 characters, matching `[a-z][a-z0-9_]*`; never an exception message or stack |
| `export_format` | `txt`, `markdown`, `json`, `zip`, `other` |
| `complete` | Boolean |
| `provider` | `chatgpt`, `claude`, `gemini`, `other` |

Never send conversation text, titles, URLs, conversation/project/job/run IDs, prompts, answers, filenames, search queries, copied text, HTML/DOM, stack traces, arbitrary error messages, browser history, email, IP-derived location, or account identifiers. The function has no permissive “extra properties” path.

## Responses and rate limiting

- `202 {"ok":true}` — validated event forwarded to the GA4 endpoint.
- `400 {"ok":false,"error":"invalid_json"}` or `invalid_payload` — malformed JSON or rejected schema.
- `403 origin_not_allowed` — missing/unconfigured extension origin.
- `405 method_not_allowed` — methods other than `POST` and `OPTIONS`.
- `413 payload_too_large` — request exceeds 4,096 bytes.
- `415 unsupported_media_type` — request is not JSON.
- `429 rate_limited` — more than 60 events per install UUID per hour in the current warm function instance; response includes `Retry-After: 3600`.
- `502 forwarding_failed` — GA4 network timeout or non-2xx response.
- `503 telemetry_unavailable` — server configuration is missing.

Responses are generic and never include the API secret, submitted values, or GA4 response content. The rate limiter is intentionally small and ephemeral: Netlify instances do not share it, and it does not authenticate the UUID. It is a best-effort burst limit, not a defense against a determined caller rotating UUIDs.

## Extension origin and Chrome permission

From an MV3 **service worker or extension page**, use `fetch()` with `Content-Type: application/json` and a fixed endpoint URL. Do not send this from a content script. Chrome requires host permission for a cross-origin fetch. The closest valid narrow host permission is:

```json
"host_permissions": ["https://getmanov.com/*"]
```

Chrome match patterns do not enforce a path restriction in `host_permissions`, so this grants the origin; the endpoint's CORS response still permits only the configured extension origin and the telemetry route accepts only the methods above. Production CORS origin must be the published extension origin, `chrome-extension://<32-character-extension-id>`. For unpacked development, add that unpacked extension's own origin to the environment variable. Do not use `Access-Control-Allow-Origin: *`.

## GA4 mapping

- Uses Measurement ID `G-Q9Y8XEE6EF` and the server-only `GA4_API_SECRET`.
- Sends one event to the GA4 Measurement Protocol `mp/collect` endpoint. The event name and the validated properties keep their names and values.
- Maps the lowercase install UUID to `client_id = (first 128 SHA-256 bits + 1) + "." + (last 128 SHA-256 bits + 1)`, with each half interpreted as a big-endian hexadecimal integer. This is deterministic, contains two positive decimal integers in Google's recommended format, and never sends the original UUID.
- Maps `timestamp` to request-level `timestamp_micros` (clamping an accepted future clock skew to receipt time). Production omits `validation_behavior`; Google's current guidance recommends strict validation during development and omitting this setting in production to minimize rejected data.
- Marks `analytics_storage` as `GRANTED` because the endpoint contract is opt-in only. The extension must enforce consent and send nothing on decline; the backend cannot prove a public caller's consent.
- Sends no `user_id`, session ID, IP override, user location, device profile, conversation data, or extra analytics fields.
- Does not synthesize `session_id` or `engagement_time_msec`. GA4 says these help session, engagement, and Realtime reporting. Session Saver currently provides neither a GA session identifier nor an elapsed user-engagement interval in its agreed schema; inventing these values would misrepresent the events. The event payload may therefore have reduced session/Realtime reporting.
- No website GA cookie is read or shared. Extension IDs cannot be joined to the website's browser `client_id`, so GA4 can report aggregate website and extension event volumes but this design does not attribute an individual website visit to a particular extension install.
- GA4 Measurement Protocol returns 2xx when it receives a request even if it later drops or ignores invalid data. Local schema checks and mocked strict-format coverage reduce payload risk, but the production endpoint can only report transport-level delivery, not confirm report inclusion.
- For development-only validation, the handler factory supports dependency injection of Google's `/debug/mp/collect` URL and strict validation mode. Automated tests mock this request; the public function always uses `/mp/collect` and the production payload.

Official references: [GA4 Measurement Protocol reference](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag), [validate events](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events), [Realtime verification](https://developers.google.com/analytics/devguides/collection/protocol/ga4/verify-implementation?client_type=gtag).

## Environment and deployment

Configure these in Netlify **for the production deploy context**:

1. `GA4_API_SECRET` — create under GA4 Admin → Data streams → the existing web stream → Measurement Protocol API secrets. Keep it server-only; do not put it in Astro `PUBLIC_*` variables or the extension.
2. `SESSION_SAVER_EXTENSION_ORIGINS` — comma-separated exact `chrome-extension://...` origins. Add the production extension ID before enabling extension requests. Add unpacked IDs only to a non-production/dev context as needed.

Then deploy the site. Netlify serves `/api/session-saver/events` through the rewrite to the new function; no Astro SSR adapter, database, or second backend is needed. For local function development use Netlify CLI (`netlify dev`) with the same environment names. Use a separate non-production GA4 property/secret before manually posting any event; automated tests mock the GA4 transport.

Manual GA4 setup is limited to creating the Measurement Protocol API secret. Register the approved property names as custom dimensions/metrics in GA4 only if they need to appear in standard reports; custom dimensions are not required for raw event collection. GA4 DebugView validation is optional but should use a non-production property.

## Privacy copy audit — prepared, not published

The current Astro privacy policy accurately says conversation content and saved sessions are not sent to analytics or processed on a backend, but it does not explain the planned opt-in operational events. Its broad “personal data” sharing sentence also needs review because the extension install ID is a persistent pseudonymous identifier. Update the policy **before the extension telemetry feature is released**, after extension opt-in behavior is implemented and verified. The current landing page says chats are processed locally and not sent to a separate processing server; that remains accurate for conversation/export content, but should be paired with a clear opt-in telemetry statement at launch. Do not publish this copy with the endpoint-only deployment.

Suggested replacement for the current “Information Collection and Use” analytics paragraph:

> Session Saver processes the active conversation locally when you choose to save it. The extension does not send conversation content, prompts, answers, titles, URLs, or exported files to getmanov.com or to analytics providers. If you opt in to anonymous product analytics, Session Saver sends a limited set of operational events and coarse technical categories to getmanov.com, which forwards them to Google Analytics 4. This telemetry does not include conversation content or identifiers for individual conversations. If you decline, the extension sends no telemetry requests.

Suggested replacement for the current “Data Storage” backend sentence:

> Saved sessions are stored locally on your device using browser storage. getmanov.com does not store telemetry requests in an application database; it validates and forwards opt-in events to Google Analytics 4. Google Analytics processes the forwarded telemetry under Google's applicable terms and settings.

Suggested clarification under “Data Sharing”:

> We do not sell or share saved sessions. If you opt in to product analytics, the limited anonymous event data described above is sent to Google Analytics 4. It does not include conversation content.

At release, update the live Astro policy and review the landing page trust copy. Also check whether `tools/session-saver/privacy-policy.html` is published by any separate legacy process; it is outside Astro's normal `public/` tree.

## Operational risks and boundaries

- The public endpoint is not authenticated. Exact CORS origin checks constrain browser callers but are not authentication; arbitrary non-browser clients can spoof `Origin`. Strict schema, body size, timeout, and ephemeral per-install throttling limit accidental or low-effort abuse.
- Per-instance throttling is not globally shared. A determined caller can rotate UUIDs or hit multiple function instances; stronger limits would need Netlify edge/platform support or shared state and are intentionally out of scope.
- Events do not provide person-level website-to-extension attribution. Preserve that boundary; do not reuse browser cookies or add fingerprinting to fill it.
- `GA4_API_SECRET` must be configured before requests can succeed. Until the extension implementation and opt-in UI ship, the endpoint has no legitimate telemetry caller and the privacy text must not imply that it is already active.
