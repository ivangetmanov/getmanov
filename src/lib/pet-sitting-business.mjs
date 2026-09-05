import { billableStayDays, calendarDayDifference } from "./pet-sitting-calendar.mjs";

export const petSittingBusiness = {
  telegramUsername: "ya_kushka",
  homeVisits: {
    standardVisitPrice: 1500,
    dogVisitWithWalkPrice: 2000,
    standaloneDogWalkPrice: 2000,
    includedPetQuantity: { min: 1, max: 2 },
    dogWalkMinutes: 30,
    usualDurationMinutes: { min: 30, max: 60 },
    visitsPerDay: [1, 2, 3],
    minimumVisits: 1,
    oneOffVisitsAllowed: true,
    animals: ["cat", "dog"],
    serviceArea: {
      normal: [
        { ru: "Петроварадин", en: "Petrovaradin" },
        { ru: "центр Нови-Сада", en: "central Novi Sad" },
        { ru: "Лиман", en: "Liman" },
        { ru: "Грбавица", en: "Grbavica" },
        { ru: "ближайшие центральные районы, если дорога остаётся разумной", en: "nearby practical central districts where travel remains reasonable" },
      ],
      askFirst: [
        { ru: "Телеп, Адице и Ветерник", en: "Telep, Adice, and Veternik" },
        { ru: "Мали-Београд и другие удалённые северные районы", en: "Mali Beograd and similarly distant northern areas" },
        { ru: "другие районы далеко от обычного маршрута", en: "other areas far outside our normal route" },
      ],
      copy: {
        ru: "Обычно приезжаем в Петроварадин, центр Нови-Сада, на Лиман, Грбавицу и в ближайшие центральные районы, если дорога остаётся разумной. Для Телепа, Адице, Ветерника, Мали-Београда и других удалённых районов сначала уточните возможность выезда — границы приблизительные, не по улицам.",
        en: "We normally visit Petrovaradin, central Novi Sad, Liman, Grbavica, and nearby practical central districts where travel remains reasonable. For Telep, Adice, Veternik, Mali Beograd, and similarly distant areas, please ask first—the boundary is approximate, not street by street.",
      },
    },
    introductoryMeeting: { optional: true, free: true, usuallyHandledBy: "Anna" },
    dogWalk: { optional: true, standaloneAllowed: true },
    medication: { accordingToOwnerInstructions: true, complexCareByAgreement: true, injectionsPromised: false },
    reporting: { afterEveryVisit: true, photos: 2, videos: 2, writtenUpdate: true },
    reportingCopy: {
      ru: "После каждого визита присылаем пару фотографий, пару видео и короткий письменный отчёт: как питомец и что мы сделали.",
      en: "After every visit, we send a couple of photos, a couple of videos, and a short written update explaining how your pet is doing and what we did.",
    },
    smallHomeTasksByAgreement: ["water_a_few_plants", "feed_fish", "briefly_air_apartment", "basic_home_check"],
    payment: { method: "cash", timing: "in_advance", cancellationsAfterPaymentRefundable: false },
    paymentCopy: {
      ru: "Оплата наличными вносится заранее, до начала визитов. Если после оплаты вы отменяете визиты или сокращаете количество дней, внесённая сумма не возвращается.",
      en: "Payment is made in cash in advance, before the visits begin. If you cancel visits or reduce the number of booked days after payment, the amount paid is non-refundable.",
    },
    accessCopy: {
      ru: "Ключи и доступ передаём так, как удобно вам и нам — обычно договариваемся об этом заранее.",
      en: "We arrange keys and access in whatever way works for both you and us, usually agreeing the details in advance.",
    },
    whoVisitsCopy: {
      ru: "Приезжает кто-то из нас — Аня или Ваня, а иногда можем приехать вдвоём. Если для вас важно, чтобы приходил кто-то конкретный, просто скажите об этом заранее.",
      en: "One of us — Anna or Ivan — will usually visit, and sometimes we may come together. If you prefer a specific person, tell us in advance.",
    },
  },
  longStayFromDays: 14,
  pricing: {
    1: { shortStayMaxDays: 3, shortStayDailyRate: 2000, standardDailyRate: 1500 },
    2: { shortStayMaxDays: 3, shortStayDailyRate: 3000, standardDailyRate: 2500 },
  },
  pagePaths: {
    ru: {
      main: "/ru/novi-sad/pet-sitting/",
      dogs: "/ru/novi-sad/pet-sitting/dogs/",
      cats: "/ru/novi-sad/pet-sitting/cats/",
      homeVisits: "/ru/novi-sad/pet-sitting/home-visits/",
    },
    en: {
      main: "/en/novi-sad/pet-sitting/",
      dogs: "/en/novi-sad/pet-sitting/dogs/",
      cats: "/en/novi-sad/pet-sitting/cats/",
      homeVisits: "/en/novi-sad/pet-sitting/home-visits/",
    },
  },
  pageLabels: {
    ru: { main: "Домашняя передержка", dogs: "Передержка собак", cats: "Передержка кошек", homeVisits: "Выезды к питомцу домой" },
    en: { main: "Pet boarding", dogs: "Dog boarding", cats: "Cat boarding", homeVisits: "In-home pet sitting" },
  },
  articlePaths: {
    ru: {
      main: ["/ru/novi-sad/pet-sitting/pet-sitter-vs-boarding/"],
      dogs: ["/ru/novi-sad/pet-sitting/prepare-dog-for-boarding/"],
      cats: [
        "/ru/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
        "/ru/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      ],
    },
    en: {
      main: ["/en/novi-sad/pet-sitting/pet-sitter-vs-boarding/"],
      dogs: ["/en/novi-sad/pet-sitting/prepare-dog-for-boarding/"],
      cats: [
        "/en/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
        "/en/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      ],
    },
  },
};

export function isAllowedPetSittingSourcePage(locale, pageKind, sourcePage) {
  if (sourcePage === petSittingBusiness.pagePaths[locale]?.[pageKind]) return true;
  return petSittingBusiness.articlePaths[locale]?.[pageKind]?.includes(sourcePage) ?? false;
}

export function formatRsd(amount, locale = "ru") {
  const separator = locale === "en" ? "," : " ";
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function russianDayForm(days) {
  const count = Math.abs(Number(days));
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return "день";
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return "дня";
  return "дней";
}

export function formatRussianStayDuration(days) {
  return `${days} ${russianDayForm(days)} передержки`;
}

export function calculatePetSittingQuote(arrival, departure, quantity) {
  const petQuantity = Number(quantity);
  if (!arrival || !departure || ![1, 2].includes(petQuantity)) return null;

  let billableDays;
  try {
    billableDays = billableStayDays(arrival, departure);
  } catch {
    return null;
  }
  if (!billableDays) return null;

  if (billableDays >= petSittingBusiness.longStayFromDays) {
    return {
      billableDays,
      quantity: petQuantity,
      dailyRate: null,
      total: null,
      individualPricing: true,
    };
  }

  const pricing = petSittingBusiness.pricing[petQuantity];
  const dailyRate = billableDays <= pricing.shortStayMaxDays
    ? pricing.shortStayDailyRate
    : pricing.standardDailyRate;

  return {
    billableDays,
    quantity: petQuantity,
    dailyRate,
    total: billableDays * dailyRate,
    individualPricing: false,
  };
}

export function calculateHomeVisitQuote(dateFrom, dateTo, quantity, visitsPerDay, dogWalk) {
  const rules = petSittingBusiness.homeVisits;
  const petQuantity = Number(quantity);
  const dailyVisits = Number(visitsPerDay);
  let dayDifference;
  try {
    dayDifference = calendarDayDifference(dateFrom, dateTo);
  } catch {
    return null;
  }
  if (dayDifference < 0 || !Number.isInteger(petQuantity) || petQuantity < 1 || !rules.visitsPerDay.includes(dailyVisits)) return null;

  const days = dayDifference + 1;
  const visitCount = days * dailyVisits;
  const perVisit = dogWalk ? rules.dogVisitWithWalkPrice : rules.standardVisitPrice;
  const needsConfirmation = petQuantity > rules.includedPetQuantity.max;
  return {
    days,
    visitCount,
    perVisit,
    total: needsConfirmation ? null : visitCount * perVisit,
    needsConfirmation,
    confirmationReason: needsConfirmation ? "more_than_two_pets" : null,
  };
}
