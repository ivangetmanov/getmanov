import { billableStayDays, calendarDayDifference } from "./pet-sitting-calendar.mjs";

export const petSittingBusiness = {
  telegramUsername: "ya_kushka",
  homeVisits: {
    standardVisitPrice: 1500,
    dogVisitWithWalkPrice: 2000,
    includedPetQuantity: { min: 1, max: 3 },
    dogWalkMinutes: 30,
    usualDurationMinutes: { min: 30, max: 60 },
    visitsPerDay: [1, 2, 3],
    minimumVisits: 1,
    oneOffVisitsAllowed: true,
    animals: ["cat", "dog", "cat_and_dog"],
    serviceArea: {
      geoJsonPath: "/data/home-visits-service-areas.geojson",
      extendedVisitSurcharge: 500,
      baseAreas: [
        { ru: "Петроварадин", en: "Petrovaradin", sr: "Petrovaradin" },
        { ru: "центр Нови-Сада", en: "central Novi Sad", sr: "centar Novog Sada" },
        { ru: "Лиман", en: "Liman", sr: "Liman" },
        { ru: "Грбавица", en: "Grbavica", sr: "Grbavica" },
        { ru: "Мишелук и ближайшие удобные районы вдоль основного маршрута", en: "Mišeluk and nearby practical areas along the main route", sr: "Mišeluk i obližnji delovi uz glavnu rutu" },
      ],
      extendedAreas: [
        { ru: "Клиса и Найлон-пияца", en: "Klisa and Najlon pijaca", sr: "Klisa i Najlon pijaca" },
        { ru: "более удалённые западные и юго-западные части Нови-Сада", en: "farther western and southwestern parts of Novi Sad", sr: "udaljeniji zapadni i jugozapadni delovi Novog Sada" },
        { ru: "более удалённые части вокруг Сремской Каменицы", en: "farther parts around Sremska Kamenica", sr: "udaljeniji delovi oko Sremske Kamenice" },
      ],
      copy: {
        ru: "В зелёной зоне действует базовая цена. В жёлтой к стоимости визита добавляется 500 RSD.",
        en: "The base price applies in the green area. In the yellow area, 500 RSD is added per visit.",
        sr: "U zelenoj zoni važi osnovna cena. U žutoj zoni se na cenu svake posete dodaje 500 RSD.",
      },
      noteCopy: {
        ru: "Если не уверены, к какой зоне относится ваш адрес, отметьте примерное место на карте — стоимость покажем сразу.",
        en: "If you are not sure which area your address is in, mark the approximate location on the map and the price will update straight away.",
        sr: "Ako niste sigurni kojoj zoni pripada vaša adresa, označite približnu lokaciju na mapi i cena će se odmah prikazati.",
      },
      legend: {
        base: { ru: "Базовая зона · 1 500 RSD", en: "Base area · 1,500 RSD", sr: "Osnovna zona · 1.500 RSD" },
        extended: { ru: "Расширенная зона · +500 RSD за визит", en: "Extended area · +500 RSD per visit", sr: "Šira zona · +500 RSD po poseti" },
        other: { ru: "За пределами обычной зоны", en: "Outside the usual service area", sr: "Van uobičajene zone" },
      },
      popup: {
        base: { ru: "Базовая зона\n1 500 RSD за стандартный визит", en: "Base area\n1,500 RSD per standard visit", sr: "Osnovna zona\n1.500 RSD po standardnoj poseti" },
        extended: { ru: "Расширенная зона\n+500 RSD за визит", en: "Extended area\n+500 RSD per visit", sr: "Šira zona\n+500 RSD po poseti" },
      },
    },
    introductoryMeeting: { optional: true, free: true, usuallyHandledBy: "Anna" },
    dogWalk: { optional: true, standaloneAllowed: false },
    medication: { accordingToOwnerInstructions: true, complexCareByAgreement: true, injectionsPromised: false },
    reporting: { afterEveryVisit: true, photos: 2, videos: 2, writtenUpdate: true },
    reportingCopy: {
      ru: "После каждого визита присылаем фото и видео и подробно рассказываем, как питомец себя чувствует и что мы сделали.",
      en: "After every visit, we send photos and videos and tell you how your pet is doing and what we did.",
      sr: "Posle svake posete šaljemo fotografije i video i javljamo kako je ljubimac i šta smo uradili.",
    },
    smallHomeTasksByAgreement: ["water_a_few_plants", "feed_fish", "briefly_air_apartment", "basic_home_check"],
    payment: { method: "cash", timing: "in_advance", cancellationsAfterPaymentRefundable: false },
    paymentCopy: {
      ru: "Визиты оплачиваются наличными заранее, до начала услуги.",
      en: "Visits are paid for in cash before the service begins.",
      sr: "Posete se plaćaju unapred, u gotovini, pre početka usluge.",
    },
    accessCopy: {
      ru: "Ключи и доступ передаём так, как удобно вам и нам — обычно договариваемся об этом заранее.",
      en: "We arrange keys and access in whatever way works for both you and us, usually agreeing the details in advance.",
      sr: "O predaji ključeva i pristupu dogovaramo se unapred, na način koji odgovara svima.",
    },
    whoVisitsCopy: {
      ru: "Приезжает кто-то из нас — Аня или Ваня, а иногда можем приехать вдвоём. Если для вас важно, чтобы приходил кто-то конкретный, просто скажите об этом заранее.",
      en: "One of us — Anna or Ivan — will visit, and sometimes we may come together. If you prefer a specific person, just tell us in advance.",
      sr: "U posetu dolazi Ana ili Ivan, u zavisnosti od obaveza, a ponekad možemo doći zajedno. Ako vam je važno ko će doći, samo nam recite unapred.",
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
    sr: {
      main: "/sr/novi-sad/pet-sitting/",
      dogs: "/sr/novi-sad/pet-sitting/dogs/",
      cats: "/sr/novi-sad/pet-sitting/cats/",
      homeVisits: "/sr/novi-sad/pet-sitting/home-visits/",
    },
  },
  pageLabels: {
    ru: { main: "Домашняя передержка", dogs: "Передержка собак", cats: "Передержка кошек", homeVisits: "Выезды к питомцу домой" },
    en: { main: "Pet boarding", dogs: "Dog boarding", cats: "Cat boarding", homeVisits: "In-home pet sitting" },
    sr: { main: "Čuvanje ljubimaca kod nas", dogs: "Čuvanje pasa", cats: "Čuvanje mačaka", homeVisits: "Obilasci ljubimaca kod kuće" },
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
    sr: {
      main: ["/sr/novi-sad/pet-sitting/pet-sitter-vs-boarding/"],
      dogs: ["/sr/novi-sad/pet-sitting/prepare-dog-for-boarding/"],
      cats: [
        "/sr/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
        "/sr/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      ],
    },
  },
};

export function isAllowedPetSittingSourcePage(locale, pageKind, sourcePage) {
  if (sourcePage === petSittingBusiness.pagePaths[locale]?.[pageKind]) return true;
  return petSittingBusiness.articlePaths[locale]?.[pageKind]?.includes(sourcePage) ?? false;
}

export function formatRsd(amount, locale = "ru") {
  const separator = locale === "en" ? "," : locale === "sr" ? "." : " ";
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

export function formatSerbianStayDuration(days) {
  const count = Math.abs(Number(days));
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const unit = lastDigit === 1 && lastTwoDigits !== 11 ? "dan" : "dana";
  return `${days} ${unit} boravka`;
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

export function calculateHomeVisitQuote(dateFrom, dateTo, visitsPerDay, dogWalk, serviceZone) {
  const rules = petSittingBusiness.homeVisits;
  const dailyVisits = Number(visitsPerDay);
  let dayDifference;
  try {
    dayDifference = calendarDayDifference(dateFrom, dateTo);
  } catch {
    return null;
  }
  if (dayDifference < 0 || !rules.visitsPerDay.includes(dailyVisits) || !["green", "yellow", "outside"].includes(serviceZone)) return null;

  const days = dayDifference + 1;
  const visitCount = days * dailyVisits;
  const basePerVisit = dogWalk ? rules.dogVisitWithWalkPrice : rules.standardVisitPrice;
  const surcharge = serviceZone === "yellow" ? rules.serviceArea.extendedVisitSurcharge : 0;
  const perVisit = basePerVisit + surcharge;
  const needsConfirmation = serviceZone === "outside";
  return {
    days,
    visitCount,
    basePerVisit,
    surcharge,
    perVisit,
    total: needsConfirmation ? null : visitCount * perVisit,
    needsConfirmation,
    confirmationReason: needsConfirmation ? "outside_service_area" : null,
  };
}
