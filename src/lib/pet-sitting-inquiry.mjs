import { petSittingUnavailablePeriods } from "../data/pet-sitting-availability.mjs";
import { calendarDayDifference, isCalendarDateKey, rangeHasUnavailable } from "./pet-sitting-calendar.mjs";
import { calculatePetSittingQuote, formatRsd, formatRussianStayDuration, isAllowedPetSittingSourcePage, petSittingBusiness } from "./pet-sitting-business.mjs";

const animals = new Set(["dog", "cat"]);
const locales = new Set(["ru", "en"]);
const pageKinds = new Set(["main", "dogs", "cats"]);

export function normalizeTelegramUsername(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed && !trimmed.startsWith("@") ? `@${trimmed}` : trimmed;
}

export function preparePetSittingInquiry(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "invalid_payload" };
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return { ok: true, ignored: true };
  }

  const locale = typeof payload.locale === "string" ? payload.locale : "";
  const pageKind = typeof payload.pageKind === "string" ? payload.pageKind : "";
  const sourcePage = typeof payload.sourcePage === "string" ? payload.sourcePage : "";
  const arrival = typeof payload.arrival === "string" ? payload.arrival : "";
  const departure = typeof payload.departure === "string" ? payload.departure : "";
  const pet = typeof payload.pet === "string" ? payload.pet : "";
  const quantity = Number(payload.quantity);
  const flexible = payload.flexible === true;
  const telegramUsername = normalizeTelegramUsername(payload.telegramUsername);

  if (!locales.has(locale) || !pageKinds.has(pageKind)) return { ok: false, error: "invalid_page" };
  if (!isAllowedPetSittingSourcePage(locale, pageKind, sourcePage)) return { ok: false, error: "invalid_source" };
  if (!isCalendarDateKey(arrival) || !isCalendarDateKey(departure)) return { ok: false, error: "missing_dates" };
  if (calendarDayDifference(arrival, departure) <= 0) return { ok: false, error: "invalid_dates" };
  if (rangeHasUnavailable(arrival, departure, petSittingUnavailablePeriods)) return { ok: false, error: "unavailable_dates" };
  if (!animals.has(pet)) return { ok: false, error: "invalid_pet" };
  if (![1, 2].includes(quantity)) return { ok: false, error: "invalid_quantity" };
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) return { ok: false, error: "invalid_telegram" };

  const quote = calculatePetSittingQuote(arrival, departure, quantity);
  if (!quote) return { ok: false, error: "invalid_quote" };

  return {
    ok: true,
    inquiry: {
      locale,
      pageKind,
      pageLabel: petSittingBusiness.pageLabels[locale][pageKind],
      sourcePage,
      arrival,
      departure,
      pet,
      quantity,
      flexible,
      telegramUsername,
      quote,
    },
  };
}

function formatCalendarDate(key, locale) {
  const months = locale === "en"
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const [, month, day] = key.split("-").map(Number);
  return `${day} ${months[month - 1]}`;
}

function sanitizePlainText(value, maxLength = 240) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function buildPetSittingTelegramMessage(inquiry, submittedAt = new Date().toISOString()) {
  const isEnglish = inquiry.locale === "en";
  const animal = isEnglish
    ? inquiry.pet
    : inquiry.pet === "dog" ? "собака" : "кошка";
  const flexible = inquiry.flexible ? (isEnglish ? "yes" : "да") : (isEnglish ? "no" : "нет");
  const price = inquiry.quote.individualPricing
    ? isEnglish ? "discuss individually" : "обсуждается отдельно"
    : `${formatRsd(inquiry.quote.total, inquiry.locale)} RSD`;
  const sourceUrl = `https://getmanov.com${inquiry.sourcePage}`;

  const lines = isEnglish ? [
    "🐾 New pet boarding enquiry",
    "",
    `Page: ${inquiry.pageLabel}`,
    `Dates: ${formatCalendarDate(inquiry.arrival, "en")} — ${formatCalendarDate(inquiry.departure, "en")}`,
    `Days of stay: ${inquiry.quote.billableDays}`,
    `Pet: ${animal}`,
    `Number of pets: ${inquiry.quantity}`,
    `Flexible dates: ${flexible}`,
    `Estimated price: ${price}`,
    `Customer Telegram: ${inquiry.telegramUsername}`,
    "Language: EN",
    `Source: ${sourceUrl}`,
    `Submitted: ${submittedAt}`,
  ] : [
    "🐾 Новая заявка на передержку",
    "",
    `Страница: ${inquiry.pageLabel}`,
    `Даты: ${formatCalendarDate(inquiry.arrival, "ru")} — ${formatCalendarDate(inquiry.departure, "ru")}`,
    `Срок: ${formatRussianStayDuration(inquiry.quote.billableDays)}`,
    `Питомец: ${animal}`,
    `Количество: ${inquiry.quantity}`,
    `Даты гибкие: ${flexible}`,
    `Расчётная цена: ${price}`,
    `Telegram клиента: ${inquiry.telegramUsername}`,
    "Язык: RU",
    `Источник: ${sourceUrl}`,
    `Отправлено: ${submittedAt}`,
  ];

  return lines.map((line) => sanitizePlainText(line)).join("\n");
}
