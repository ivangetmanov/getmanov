import { billableStayDays } from "./pet-sitting-calendar.mjs";

export const petSittingBusiness = {
  telegramUsername: "ya_kushka",
  homeVisits: {
    provisional: true,
    usualDurationMinutes: { min: 45, max: 60 },
    visitsPerDay: [1, 2],
    additionalVisitByAgreement: 3,
    oneOffVisitsAllowed: true,
    priceBasis: "visit_and_travel",
    zones: {
      zone1: {
        label: { ru: "Зона 1", en: "Zone 1" },
        description: { ru: "Стандартная зона выезда", en: "Standard visit area" },
        confirmedAreas: ["Petrovaradin"],
        pricing: { oneVisit: 1500, twoVisitsPerDay: 2500 },
      },
      zone2: {
        label: { ru: "Зона 2", en: "Zone 2" },
        description: { ru: "Более дальняя зона / выше стоимость дороги", en: "Farther area / higher travel cost" },
        confirmedAreas: [],
        pricing: { oneVisit: 2000, twoVisitsPerDay: 3000 },
      },
    },
    introductoryMeetingFree: true,
    dogWalkIncludedWhenRelevant: true,
    routineMedication: ["tablets", "drops", "other_simple_routine_medication"],
    medicalProceduresOffered: false,
    updateAfterEveryVisit: true,
    smallHomeTasksByAgreement: ["water_a_few_plants", "feed_fish", "briefly_air_apartment", "basic_home_check"],
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
