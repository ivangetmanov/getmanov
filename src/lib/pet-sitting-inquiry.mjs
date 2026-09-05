import { petSittingUnavailablePeriods } from "../data/pet-sitting-availability.mjs";
import { calendarDayDifference, isCalendarDateKey, rangeHasUnavailable } from "./pet-sitting-calendar.mjs";
import { calculateHomeVisitQuote, calculatePetSittingQuote, formatRsd, formatRussianStayDuration, isAllowedPetSittingSourcePage, petSittingBusiness } from "./pet-sitting-business.mjs";

const animals = new Set(["dog", "cat"]);
const locales = new Set(["ru", "en"]);
const pageKinds = new Set(["main", "dogs", "cats"]);
const homeVisitAnimals = new Set(petSittingBusiness.homeVisits.animals);

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

  if (payload.serviceType === "home_visit") return prepareHomeVisitInquiry(payload);

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

function cleanField(value, maxLength) {
  return typeof value === "string" ? sanitizePlainText(value, maxLength) : "";
}

export function prepareHomeVisitInquiry(payload) {
  const locale = typeof payload.locale === "string" ? payload.locale : "";
  const sourcePage = typeof payload.sourcePage === "string" ? payload.sourcePage : "";
  const dateFrom = typeof payload.dateFrom === "string" ? payload.dateFrom : "";
  const dateTo = typeof payload.dateTo === "string" ? payload.dateTo : "";
  const animal = typeof payload.animal === "string" ? payload.animal : "";
  const quantity = Number(payload.quantity);
  const visitsPerDay = Number(payload.visitsPerDay);
  const dogWalk = payload.dogWalk === true;
  const neighborhood = cleanField(payload.neighborhood, 120);
  const specialCare = cleanField(payload.specialCare, 300);
  const notes = cleanField(payload.notes, 1000);
  const telegramUsername = normalizeTelegramUsername(payload.telegramUsername);

  if (!locales.has(locale)) return { ok: false, error: "invalid_page" };
  if (sourcePage !== petSittingBusiness.pagePaths[locale].homeVisits) return { ok: false, error: "invalid_source" };
  if (!isCalendarDateKey(dateFrom) || !isCalendarDateKey(dateTo)) return { ok: false, error: "missing_dates" };
  if (dateTo < dateFrom) return { ok: false, error: "invalid_dates" };
  if (!homeVisitAnimals.has(animal)) return { ok: false, error: "invalid_pet" };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { ok: false, error: "invalid_quantity" };
  if (!petSittingBusiness.homeVisits.visitsPerDay.includes(visitsPerDay)) return { ok: false, error: "invalid_visit_frequency" };
  if (dogWalk && animal !== "dog") return { ok: false, error: "invalid_dog_walk" };
  if (!neighborhood) return { ok: false, error: "missing_neighborhood" };
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) return { ok: false, error: "invalid_telegram" };
  const quote = calculateHomeVisitQuote(dateFrom, dateTo, quantity, visitsPerDay, dogWalk);
  if (!quote) return { ok: false, error: "invalid_quote" };

  return {
    ok: true,
    inquiry: {
      serviceType: "home_visit",
      locale,
      pageLabel: petSittingBusiness.pageLabels[locale].homeVisits,
      sourcePage,
      dateFrom,
      dateTo,
      animal,
      quantity,
      visitsPerDay,
      dogWalk,
      neighborhood,
      specialCare,
      notes,
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
  if (inquiry.serviceType === "home_visit") return buildHomeVisitTelegramMessage(inquiry, submittedAt);
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

export function buildHomeVisitTelegramMessage(inquiry, submittedAt = new Date().toISOString()) {
  const isEnglish = inquiry.locale === "en";
  const animal = isEnglish
    ? inquiry.animal
    : inquiry.animal === "dog" ? "собака" : inquiry.animal === "cat" ? "кошка" : "другой";
  const sourceUrl = `https://getmanov.com${inquiry.sourcePage}`;
  const reason = inquiry.quote.confirmationReason === "special_care"
    ? isEnglish ? "special care" : "особый уход"
    : isEnglish ? "more than 2 pets" : "больше 2 питомцев";
  const price = inquiry.quote.needsConfirmation
    ? isEnglish
      ? `confirm individually (${reason}); base rate ${formatRsd(inquiry.quote.perVisit, inquiry.locale)} RSD per visit`
      : `уточнить индивидуально (${reason}); базовый тариф ${formatRsd(inquiry.quote.perVisit, inquiry.locale)} RSD за визит`
    : `${formatRsd(inquiry.quote.total, inquiry.locale)} RSD (${formatRsd(inquiry.quote.perVisit, inquiry.locale)} RSD × ${inquiry.quote.visitCount})${inquiry.specialCare ? isEnglish ? "; special care to confirm" : "; особый уход нужно подтвердить" : ""}`;
  const lines = isEnglish ? [
    "🏠 New home-visit pet-sitting request",
    "",
    "Service type: home_visit",
    `Page: ${inquiry.pageLabel}`,
    `Dates: ${inquiry.dateFrom} — ${inquiry.dateTo}`,
    `Pet: ${animal}`,
    `Number of pets: ${inquiry.quantity}`,
    `Visits per day: ${inquiry.visitsPerDay}`,
    `Dog walk needed: ${inquiry.dogWalk ? "yes" : "no"}`,
    `Approximate neighborhood: ${inquiry.neighborhood}`,
    `Area pricing: confirm from neighborhood; extended area adds ${formatRsd(petSittingBusiness.homeVisits.serviceArea.extendedVisitSurcharge, "en")} RSD per visit`,
    `Medication / special care: ${inquiry.specialCare || "not provided"}`,
    `Care details: ${inquiry.notes || "not provided"}`,
    `Base price: ${price}`,
    `Customer Telegram: ${inquiry.telegramUsername}`,
    "Language: EN",
    `Source: ${sourceUrl}`,
    `Submitted: ${submittedAt}`,
  ] : [
    "🏠 Новый запрос на выезд к питомцу",
    "",
    "Тип услуги: home_visit",
    `Страница: ${inquiry.pageLabel}`,
    `Даты: ${inquiry.dateFrom} — ${inquiry.dateTo}`,
    `Питомец: ${animal}`,
    `Количество: ${inquiry.quantity}`,
    `Визитов в день: ${inquiry.visitsPerDay}`,
    `Нужна прогулка с собакой: ${inquiry.dogWalk ? "да" : "нет"}`,
    `Примерный район: ${inquiry.neighborhood}`,
    `Цена по зоне: подтвердить по району; в расширенной зоне +${formatRsd(petSittingBusiness.homeVisits.serviceArea.extendedVisitSurcharge, "ru")} RSD за визит`,
    `Лекарства / особый уход: ${inquiry.specialCare || "не указаны"}`,
    `Детали ухода: ${inquiry.notes || "не указаны"}`,
    `Базовая стоимость: ${price}`,
    `Telegram клиента: ${inquiry.telegramUsername}`,
    "Язык: RU",
    `Источник: ${sourceUrl}`,
    `Отправлено: ${submittedAt}`,
  ];
  return lines.map((line) => sanitizePlainText(line, 1200)).join("\n");
}
