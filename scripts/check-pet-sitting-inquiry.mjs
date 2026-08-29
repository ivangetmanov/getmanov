import assert from "node:assert/strict";
import { handler } from "../netlify/functions/pet-sitting-inquiry.mjs";
import { buildPetSittingTelegramMessage, preparePetSittingInquiry } from "../src/lib/pet-sitting-inquiry.mjs";

const validPayload = {
  arrival: "2026-09-07",
  departure: "2026-09-09",
  pet: "dog",
  quantity: 1,
  flexible: false,
  telegramUsername: "@test_user",
  website: "",
  locale: "en",
  pageKind: "dogs",
  sourcePage: "/en/novi-sad/pet-sitting/dogs/",
};

const prepared = preparePetSittingInquiry(validPayload);
assert.equal(prepared.ok, true);
assert.equal(prepared.inquiry.quote.billableDays, 2);
assert.equal(prepared.inquiry.quote.total, 4000);
const notification = buildPetSittingTelegramMessage(prepared.inquiry, "2026-08-29T18:00:00.000Z");
assert.match(notification, /New pet boarding enquiry/);
assert.match(notification, /Estimated price: 4,000 RSD/);
assert.match(notification, /Source: https:\/\/getmanov\.com\/en\/novi-sad\/pet-sitting\/dogs\//);
assert.match(notification, /Submitted: 2026-08-29T18:00:00\.000Z/);

assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, telegramUsername: "bad" }),
  { ok: false, error: "invalid_telegram" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, arrival: "", departure: "" }),
  { ok: false, error: "missing_dates" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, arrival: "2026-09-05", departure: "2026-09-08" }),
  { ok: false, error: "unavailable_dates" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, website: "spam.example" }),
  { ok: true, ignored: true },
);

const originalToken = process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
const originalChatId = process.env.PET_SITTING_TELEGRAM_CHAT_ID;
const originalFetch = globalThis.fetch;
const fetchCalls = [];
process.env.PET_SITTING_TELEGRAM_BOT_TOKEN = "test-only-bot-token";
process.env.PET_SITTING_TELEGRAM_CHAT_ID = "test-only-chat-id";
globalThis.fetch = async (url, options) => {
  fetchCalls.push({ url: String(url), options });
  return { ok: true, status: 200 };
};

try {
  const accepted = await handler({ httpMethod: "POST", body: JSON.stringify(validPayload) });
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual(JSON.parse(accepted.body), { ok: true });
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].url, /test-only-bot-token\/sendMessage$/);
  const telegramBody = JSON.parse(fetchCalls[0].options.body);
  assert.equal(telegramBody.chat_id, "test-only-chat-id");
  assert.equal("parse_mode" in telegramBody, false);
  assert.match(telegramBody.text, /Customer Telegram: @test_user/);

  const invalidUsername = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, telegramUsername: "bad" }),
  });
  assert.equal(invalidUsername.statusCode, 400);
  assert.equal(fetchCalls.length, 1);

  const missingDates = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, arrival: "", departure: "" }),
  });
  assert.equal(missingDates.statusCode, 400);
  assert.equal(fetchCalls.length, 1);

  const honeypot = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, website: "spam.example" }),
  });
  assert.equal(honeypot.statusCode, 200);
  assert.equal(fetchCalls.length, 1);

  delete process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
  delete process.env.PET_SITTING_TELEGRAM_CHAT_ID;
  const unavailable = await handler({ httpMethod: "POST", body: JSON.stringify(validPayload) });
  assert.equal(unavailable.statusCode, 503);
} finally {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
  else process.env.PET_SITTING_TELEGRAM_BOT_TOKEN = originalToken;
  if (originalChatId === undefined) delete process.env.PET_SITTING_TELEGRAM_CHAT_ID;
  else process.env.PET_SITTING_TELEGRAM_CHAT_ID = originalChatId;
}

console.log("Pet-sitting enquiry checks passed.");
