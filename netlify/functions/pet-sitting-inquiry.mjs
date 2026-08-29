import { buildPetSittingTelegramMessage, preparePetSittingInquiry } from "../../src/lib/pet-sitting-inquiry.mjs";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "method_not_allowed" });
  }
  if ((event.body || "").length > 10_000) {
    return jsonResponse(413, { ok: false, error: "payload_too_large" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "invalid_json" });
  }

  const prepared = preparePetSittingInquiry(payload);
  if (!prepared.ok) return jsonResponse(400, { ok: false, error: "invalid_enquiry" });
  if (prepared.ignored) return jsonResponse(200, { ok: true });

  const botToken = process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.PET_SITTING_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return jsonResponse(503, { ok: false, error: "delivery_unavailable" });
  }

  const message = buildPetSittingTelegramMessage(prepared.inquiry);
  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });
    if (!telegramResponse.ok) return jsonResponse(502, { ok: false, error: "delivery_failed" });
  } catch {
    return jsonResponse(502, { ok: false, error: "delivery_failed" });
  }

  return jsonResponse(200, { ok: true });
}
