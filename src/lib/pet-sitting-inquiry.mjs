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

  if (payload.service_type === "home_visit" || payload.serviceType === "home_visit") return prepareHomeVisitInquiry(payload);

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
  const dateFrom = typeof payload.date_from === "string" ? payload.date_from : typeof payload.dateFrom === "string" ? payload.dateFrom : "";
  const dateTo = typeof payload.date_to === "string" ? payload.date_to : typeof payload.dateTo === "string" ? payload.dateTo : "";
  const animal = typeof payload.pet_type === "string" ? payload.pet_type : typeof payload.animal === "string" ? payload.animal : "";
  const visitsPerDay = Number(payload.visits_per_day ?? payload.visitsPerDay);
  const dogWalk = (payload.dog_walk ?? payload.dogWalk) === true;
  const serviceZone = typeof payload.service_zone === "string" ? payload.service_zone : typeof payload.serviceZone === "string" ? payload.serviceZone : "";
  const neighborhood = cleanField(payload.neighborhood, 120);
  const notes = cleanField(payload.optional_comment ?? payload.notes, 1000);
  const telegramUsername = normalizeTelegramUsername(payload.telegram_username ?? payload.telegramUsername);
  const rawLocation = payload.approximate_location;
  const latitude = Number(rawLocation?.latitude ?? payload.approximateLatitude);
  const longitude = Number(rawLocation?.longitude ?? payload.approximateLongitude);
  const approximateLocation = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude: Number(latitude.toFixed(3)), longitude: Number(longitude.toFixed(3)) }
    : null;

  if (!locales.has(locale)) return { ok: false, error: "invalid_page" };
  if (sourcePage !== petSittingBusiness.pagePaths[locale].homeVisits) return { ok: false, error: "invalid_source" };
  if (!isCalendarDateKey(dateFrom) || !isCalendarDateKey(dateTo)) return { ok: false, error: "missing_dates" };
  if (dateTo < dateFrom) return { ok: false, error: "invalid_dates" };
  if (!homeVisitAnimals.has(animal)) return { ok: false, error: "invalid_pet" };
  if (!petSittingBusiness.homeVisits.visitsPerDay.includes(visitsPerDay)) return { ok: false, error: "invalid_visit_frequency" };
  if (dogWalk && !["dog", "cat_and_dog"].includes(animal)) return { ok: false, error: "invalid_dog_walk" };
  if (serviceZone && !["green", "yellow", "outside"].includes(serviceZone)) return { ok: false, error: "invalid_service_zone" };
  if (!serviceZone && !neighborhood) return { ok: false, error: "missing_location" };
  if (serviceZone && !approximateLocation) return { ok: false, error: "missing_location" };
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) return { ok: false, error: "invalid_telegram" };
  const quote = serviceZone ? calculateHomeVisitQuote(dateFrom, dateTo, visitsPerDay, dogWalk, serviceZone) : null;
  if (serviceZone && !quote) return { ok: false, error: "invalid_quote" };

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
      visitsPerDay,
      dogWalk,
      serviceZone,
      approximateLocation,
      neighborhood,
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
    ? inquiry.animal === "cat_and_dog" ? "cat and dog" : inquiry.animal
    : inquiry.animal === "dog" ? "собака" : inquiry.animal === "cat" ? "кошка" : "кошка и собака";
  const sourceUrl = `https://getmanov.com${inquiry.sourcePage}`;
  const price = !inquiry.quote || inquiry.quote.needsConfirmation
    ? isEnglish
      ? "confirm after contact"
      : "подтвердить после связи"
    : `${formatRsd(inquiry.quote.total, inquiry.locale)} RSD (${formatRsd(inquiry.quote.perVisit, inquiry.locale)} RSD × ${inquiry.quote.visitCount})`;
  const location = inquiry.approximateLocation
    ? `${inquiry.approximateLocation.latitude}, ${inquiry.approximateLocation.longitude}`
    : inquiry.neighborhood;
  const lines = isEnglish ? [
    "🏠 New home-visit pet-sitting request",
    "",
    "Service type: home_visit",
    `Page: ${inquiry.pageLabel}`,
    `Dates: ${inquiry.dateFrom} — ${inquiry.dateTo}`,
    `Pet: ${animal}`,
    `Visits per day: ${inquiry.visitsPerDay}`,
    `Dog walk needed: ${inquiry.dogWalk ? "yes" : "no"}`,
    `Service zone: ${inquiry.serviceZone || "map unavailable"}`,
    `Approximate location: ${location}`,
    `Comment: ${inquiry.notes || "not provided"}`,
    `Estimated price: ${price}`,
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
    `Визитов в день: ${inquiry.visitsPerDay}`,
    `Нужна прогулка с собакой: ${inquiry.dogWalk ? "да" : "нет"}`,
    `Зона выезда: ${inquiry.serviceZone || "карта недоступна"}`,
    `Примерное место: ${location}`,
    `Комментарий: ${inquiry.notes || "не указан"}`,
    `Ориентировочная стоимость: ${price}`,
    `Telegram клиента: ${inquiry.telegramUsername}`,
    "Язык: RU",
    `Источник: ${sourceUrl}`,
    `Отправлено: ${submittedAt}`,
  ];
  return lines.map((line) => sanitizePlainText(line, 1200)).join("\n");
}
