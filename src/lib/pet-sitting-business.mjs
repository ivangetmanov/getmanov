import { billableStayDays } from "./pet-sitting-calendar.mjs";

export const petSittingBusiness = {
  telegramUsername: "ya_kushka",
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
    },
    en: {
      main: "/en/novi-sad/pet-sitting/",
      dogs: "/en/novi-sad/pet-sitting/dogs/",
      cats: "/en/novi-sad/pet-sitting/cats/",
    },
  },
  pageLabels: {
    ru: { main: "Домашняя передержка", dogs: "Передержка собак", cats: "Передержка кошек" },
    en: { main: "Pet boarding", dogs: "Dog boarding", cats: "Cat boarding" },
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
