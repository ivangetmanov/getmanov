import { petSittingInitialMonth, petSittingUnavailablePeriods } from "./pet-sitting-availability.mjs";
import { formatRsd, petSittingBusiness } from "../lib/pet-sitting-business.mjs";

export type PetSittingPageKind = "main" | "dogs" | "cats";

/**
 * The only operational settings for the static pet-sitting experiment.
 * Update the shared data modules for availability, pricing, Telegram, photos, or video embeds.
 */
export const petSittingConfig = {
  telegramUsername: petSittingBusiness.telegramUsername,
  initialMonth: petSittingInitialMonth,
  unavailablePeriods: petSittingUnavailablePeriods,
  prices: {
    oneAnimal: [
      { duration: "1–3 дня", price: `${formatRsd(petSittingBusiness.pricing[1].shortStayDailyRate)} RSD в сутки` },
      { duration: "4–13 дней", price: `${formatRsd(petSittingBusiness.pricing[1].standardDailyRate)} RSD в сутки` },
      { duration: "14+ дней", price: "обсуждаем цену и возможную скидку отдельно" },
    ],
    twoAnimals: [
      { duration: "1–3 дня", price: `${formatRsd(petSittingBusiness.pricing[2].shortStayDailyRate)} RSD в сутки` },
      { duration: "4–13 дней", price: `${formatRsd(petSittingBusiness.pricing[2].standardDailyRate)} RSD в сутки` },
      { duration: "14+ дней", price: "обсуждаем отдельно" },
    ],
  },
  residentCats: [
    {
      name: "Пабло",
      nameEn: "Pablo",
      description: "Очень дружелюбный и любопытный. Обычно ему интересно, кто приехал, и он хочет познакомиться.",
      descriptionEn: "Very friendly and curious. He is usually interested in new guests and likes to see who has arrived.",
      descriptionSr: "Veoma je druželjubiv i radoznao. Obično želi da vidi ko je došao i da se upozna.",
      image: "/images/pet-sitting/pablo.webp",
    },
    {
      name: "Свит",
      nameEn: "Sweet",
      description: "Более пугливая. Чаще сама уходит куда-нибудь подальше и спокойно чиллит отдельно.",
      descriptionEn: "More cautious. She usually chooses somewhere away from the action and relaxes on her own.",
      descriptionSr: "Opreznija je. Obično se skloni na mirno mesto i odmara sama.",
      image: "/images/pet-sitting/sweet.webp",
    },
  ],
  heroPhotos: {
    main: "/images/pet-sitting/main-hero.webp",
    dogs: "/images/pet-sitting/dog-guest-02.webp",
    cats: "/images/pet-sitting/cats-hero.webp",
  } as Record<PetSittingPageKind, string>,
  guestPhotos: [
    { src: "/images/pet-sitting/dog-guest-01.webp", alt: "Собака-гость во время домашней передержки", altEn: "Guest dog during a stay in our home", altSr: "Pas koji boravi kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-02.webp", alt: "Собака-гость отдыхает дома", altEn: "Guest dog resting at home", altSr: "Pas odmara kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-03.webp", alt: "Собака-гость дома", altEn: "Guest dog staying in our home", altSr: "Pas koji boravi kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-04.webp", alt: "Собака-гость во время игры", altEn: "Guest dog during play", altSr: "Pas se igra kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-05.webp", alt: "Собака-гость играет дома", altEn: "Guest dog playing at home", altSr: "Pas se igra kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-06.webp", alt: "Собака-гость у окна", altEn: "Guest dog by the window", altSr: "Pas pored prozora", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-07.webp", alt: "Собака-гость во время домашней передержки", altEn: "Guest dog during home boarding", altSr: "Pas tokom boravka kod nas", kind: "dogs" },
    { src: "/images/pet-sitting/cat-guest-01.webp", alt: "Кошки отдыхают дома", altEn: "Cats resting at home", altSr: "Mačke odmaraju kod nas", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-02.webp", alt: "Кошка-гость дома", altEn: "Guest cat staying in our home", altSr: "Mačka koja boravi kod nas", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-03.webp", alt: "Кошка-гость отдыхает рядом с человеком", altEn: "Guest cat resting next to a person", altSr: "Mačka odmara pored Ane", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-04.webp", alt: "Кошки отдыхают на кровати", altEn: "Cats resting on the bed", altSr: "Mačke odmaraju na krevetu", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-05.webp", alt: "Кошка-гость спит", altEn: "Guest cat sleeping", altSr: "Mačka spava", kind: "cats" },
  ] as Array<{
    src: string;
    alt: string;
    altEn: string;
    altSr: string;
    kind?: PetSittingPageKind;
  }>,
  guestVideos: [
    { url: "https://youtu.be/NwHXwGqr1FM?si=krP4SBa6TYdMlXMo", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/kTsjlgpyK_E?si=n0Qf6Jcc1vJ231X9", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/IPpKV9xGk_s?si=qbjCkbb_SJt7-QOs", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/upcNP-lwlLQ?si=RbdyU7oAZ4ldyc1D", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/QoDvkleTOmA?si=DVpxaX1qHRzOCxAf", animal: "dog" },
    { url: "https://youtube.com/shorts/LnHXyW79-6w?si=t7xWQDIybbWnlP8H", animal: "dog" },
    { url: "https://youtube.com/shorts/Nnp80nmWhMA?si=zo_ORiSnNe6Xcsi0", animal: "dog" },
    { url: "https://youtube.com/shorts/NpaWewHy8Mo?si=VaW3Dfb9gU1v_dgT", animal: "dog" },
    { url: "https://youtube.com/shorts/uwBPEaJk56o?si=v6WYRKUxxo_hw7Ti", animal: "dog" },
    { url: "https://youtube.com/shorts/F-IxpMWhlSw?si=3AgPaT1TKh0jZuHU", animal: "dog" },
    { url: "https://youtube.com/shorts/YKHKXpjGzpA?si=BmaubqQsftRyvwio", animal: "dog" },
    { url: "https://youtube.com/shorts/HiwjWxa9qfM?si=xqmauQOeDt5Fsh2O", animal: "dog" },
    { url: "https://youtube.com/shorts/gzEpuT0el14?feature=share", animal: "cat" },
    { url: "https://youtube.com/shorts/I3BhAy-cihk", animal: "cat" },
    { url: "https://youtube.com/shorts/NxRSlW0QHEM", animal: "cat" },
    { url: "https://youtube.com/shorts/D5RhmfSyBcw", animal: "cat" },
    { url: "https://youtube.com/shorts/zvSrI_TzmTk", animal: "cat" },
    { url: "https://youtube.com/shorts/unefUKL2sv8?feature=share", animal: "dog" },
  ] as Array<{
    url: string;
    animal: "dog" | "cat";
    title?: string;
    featured?: boolean;
  }>,
};

export const petSittingPages: Record<PetSittingPageKind, {
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  focus: string;
}> = {
  main: {
    path: petSittingBusiness.pagePaths.ru.main,
    title: "Домашняя передержка собак и кошек в Нови-Саде",
    description: "Домашняя передержка собак и кошек в Нови-Саде. Животное живёт с нами дома в Петроварадине — фото и видео минимум 3 раза в день.",
    h1: "Домашняя передержка собак и кошек в Нови‑Саде",
    lead: "Питомец живёт у нас дома в Петроварадине. Его обычная жизнь меняется как можно меньше: гуляем и кормим по привычному графику, не меняем правила дома и учитываем его характер и привычки.",
    focus: "Для собак и кошек",
  },
  dogs: {
    path: petSittingBusiness.pagePaths.ru.dogs,
    title: "Передержка собак в Нови-Саде | Домашняя передержка в Петроварадине",
    description: "Домашняя передержка собак в Нови-Саде. Собака живёт с нами в квартире в Петроварадине — фото и видео минимум 3 раза в день.",
    h1: "Передержка собак в Нови‑Саде",
    lead: "Домашняя передержка помогает сохранить для собаки привычный ритм жизни, пока хозяина нет рядом. Мы придерживаемся обычной рутины собаки: графика прогулок и кормления, игр, отдыха и других важных для неё вещей.",
    focus: "Для собак",
  },
  cats: {
    path: petSittingBusiness.pagePaths.ru.cats,
    title: "Передержка кошек в Нови-Саде | Домашняя передержка в Петроварадине",
    description: "Домашняя передержка кошек в Нови-Саде. Кошка живёт с нами дома в Петроварадине, при необходимости отдельно — фото и видео минимум 3 раза в день.",
    h1: "Передержка кошек в Нови‑Саде",
    lead: "Кошке не нужно становиться общительной, чтобы ей было спокойно. Сохраняем привычный корм, наполнитель, ритм и возможность уйти в своё безопасное пространство.",
    focus: "Для кошек",
  },
};

export const petSittingPagesEn: typeof petSittingPages = {
  main: {
    path: petSittingBusiness.pagePaths.en.main,
    title: "Home Pet Boarding in Novi Sad | Pet Sitting in Petrovaradin",
    description: "Home pet boarding in Novi Sad. Your pet stays with us in our home in Petrovaradin, with photo and video updates at least 3 times a day.",
    h1: "Home pet boarding for dogs and cats in Novi Sad",
    lead: "Your pet stays with us in our home in Petrovaradin. We try to change as little as possible about their normal life: walks and meals stay close to their usual schedule, familiar house rules stay familiar, and we take their personality and habits into account.",
    focus: "Pet boarding",
  },
  dogs: {
    path: petSittingBusiness.pagePaths.en.dogs,
    title: "Home Dog Boarding in Novi Sad | Dog Sitting in Petrovaradin",
    description: "Home dog boarding in Novi Sad. Your dog stays with us in our Petrovaradin apartment, with photo and video updates at least 3 times a day.",
    h1: "Dog boarding in Novi Sad",
    lead: "Your dog stays with us in our home in Petrovaradin and, as much as possible, continues their normal routine. We walk them as often as they are used to. We feed them on their normal schedule. If they are allowed on the bed at home, they are allowed on the bed here. And if your dog cannot stay home alone at all, tell us in advance — we may be able to arrange the stay so that one of us is always home.",
    focus: "Dog boarding",
  },
  cats: {
    path: petSittingBusiness.pagePaths.en.cats,
    title: "Home Cat Boarding in Novi Sad | Cat Sitting in Petrovaradin",
    description: "Home cat boarding in Novi Sad. Your cat stays with us in our Petrovaradin apartment, with photo and video updates at least 3 times a day.",
    h1: "Cat boarding in Novi Sad",
    lead: "A cat does not need to become sociable just because they are staying somewhere new. We keep familiar food, litter, routines and the option to have a quiet space of their own.",
    focus: "Cat boarding",
  },
};

export const petSittingPagesSr: typeof petSittingPages = {
  main: {
    path: petSittingBusiness.pagePaths.sr.main,
    title: "Čuvanje pasa i mačaka u Novom Sadu kod nas",
    description: "Kućno čuvanje pasa i mačaka u Petrovaradinu. Vaš ljubimac boravi kod Ane i Ivana, zajedno sa njihove dve mačke.",
    h1: "Čuvanje pasa i mačaka u Novom Sadu",
    lead: "Vaš ljubimac boravi kod nas u Petrovaradinu. Trudimo se da mu svakodnevica ostane što sličnija: pratimo uobičajeni raspored šetnji i obroka i vodimo računa o njegovom karakteru i navikama.",
    focus: "Čuvanje ljubimaca",
  },
  dogs: {
    path: petSittingBusiness.pagePaths.sr.dogs,
    title: "Čuvanje pasa u Novom Sadu | Petrovaradin",
    description: "Kućno čuvanje pasa u Petrovaradinu. Pas boravi sa Anom i Ivanom i njihove dve mačke, uz poznatu rutinu šetnji i hranjenja.",
    h1: "Čuvanje pasa u Novom Sadu",
    lead: "Pas boravi kod nas u Petrovaradinu i, koliko je moguće, nastavlja svoju uobičajenu rutinu. Šetamo ga i hranimo po njegovom rasporedu, uzimajući u obzir njegove navike.",
    focus: "Čuvanje pasa",
  },
  cats: {
    path: petSittingBusiness.pagePaths.sr.cats,
    title: "Čuvanje mačaka u Novom Sadu | Petrovaradin",
    description: "Kućno čuvanje mačaka u Petrovaradinu. Vaša mačka boravi kod Ane i Ivana, uz poznatu hranu, posip i miran prostor po potrebi.",
    h1: "Čuvanje mačaka u Novom Sadu",
    lead: "Mačka ne mora da bude druželjubiva da bi joj bilo prijatno. Zadržavamo poznatu hranu, posip i rutinu, uz mogućnost da se povuče u svoj miran prostor.",
    focus: "Čuvanje mačaka",
  },
};

export const petSittingArticleGuides = [
  {
    slug: "pet-sitter-vs-boarding",
    kinds: ["main", "dogs", "cats"] as PetSittingPageKind[],
    ru: {
      href: "/ru/novi-sad/pet-sitting/pet-sitter-vs-boarding/",
      title: "Петситтер, домашняя передержка или зоогостиница",
      description: "Сравниваем четыре формата ухода за питомцем на время поездки.",
    },
    en: {
      href: "/en/novi-sad/pet-sitting/pet-sitter-vs-boarding/",
      title: "Pet sitter, home boarding, or pet hotel",
      description: "Compare four care arrangements for your pet while you are away.",
    },
    sr: {
      href: "/sr/novi-sad/pet-sitting/pet-sitter-vs-boarding/",
      title: "Pet sitter, čuvanje kod kuće ili hotel za ljubimce",
      description: "Uporedite četiri načina da zbrinete ljubimca dok ste na putu.",
    },
  },
  {
    slug: "can-cat-stay-alone-for-a-week",
    kinds: ["main", "cats"] as PetSittingPageKind[],
    ru: {
      href: "/ru/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
      title: "Можно ли оставить кошку одну на неделю",
      description: "Визиты, ситтер с проживанием или домашняя передержка.",
    },
    en: {
      href: "/en/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
      title: "Can a cat stay alone for a week?",
      description: "Compare visits, a live-in sitter, and home boarding.",
    },
    sr: {
      href: "/sr/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
      title: "Može li mačka da ostane sama nedelju dana?",
      description: "Uporedite obilaske, čuvara koji boravi u domu i čuvanje kod nas.",
    },
  },
  {
    slug: "prepare-dog-for-boarding",
    kinds: ["main", "dogs"] as PetSittingPageKind[],
    ru: {
      href: "/ru/novi-sad/pet-sitting/prepare-dog-for-boarding/",
      title: "Как подготовить собаку к передержке",
      description: "Режим, корм, прогулки, знакомые вещи и пробный визит.",
    },
    en: {
      href: "/en/novi-sad/pet-sitting/prepare-dog-for-boarding/",
      title: "How to prepare a dog for boarding",
      description: "Routines, food, walks, familiar belongings, and a trial visit.",
    },
    sr: {
      href: "/sr/novi-sad/pet-sitting/prepare-dog-for-boarding/",
      title: "Kako pripremiti psa za prvi boravak kod čuvara",
      description: "Rutina, hrana, šetnje, poznate stvari i probni boravak.",
    },
  },
  {
    slug: "prepare-cat-for-boarding",
    kinds: ["main", "cats"] as PetSittingPageKind[],
    ru: {
      href: "/ru/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      title: "Как подготовить кошку к передержке",
      description: "Корм, лоток, наполнитель, знакомые вещи и спокойная адаптация.",
    },
    en: {
      href: "/en/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      title: "How to prepare a cat for boarding",
      description: "Food, litter, familiar belongings, and a quiet adaptation plan.",
    },
    sr: {
      href: "/sr/novi-sad/pet-sitting/prepare-cat-for-boarding/",
      title: "Kako pripremiti mačku za boravak kod čuvara",
      description: "Hrana, posip, poznate stvari i mirno privikavanje.",
    },
  },
  {
    slug: "prices",
    kinds: ["main", "dogs", "cats"] as PetSittingPageKind[],
    excludeFromRelatedArticles: true,
    titleByKind: {
      ru: {
        main: "Сколько стоит передержка и уход за животными в Нови-Саде?",
        dogs: "Сколько стоит передержка собаки в Нови-Саде?",
        cats: "Сколько стоит передержка кошки в Нови-Саде?",
      },
      en: {
        main: "How much does pet sitting and boarding cost in Novi Sad?",
        dogs: "How much does dog boarding cost in Novi Sad?",
        cats: "How much does cat boarding cost in Novi Sad?",
      },
      sr: {
        main: "Koliko košta čuvanje ljubimaca u Novom Sadu?",
        dogs: "Koliko košta čuvanje pasa u Novom Sadu?",
        cats: "Koliko košta čuvanje mačaka u Novom Sadu?",
      },
    },
    ru: {
      href: "/ru/novi-sad/pet-sitting/prices/",
      title: "Цены на передержку и петситтинг в Нови-Саде",
      description: "Сравнение опубликованных цен на визиты, передержку и зоогостиницы.",
    },
    en: {
      href: "/en/novi-sad/pet-sitting/prices/",
      title: "Pet sitting and boarding prices in Novi Sad",
      description: "Compare published prices for home visits, boarding, and pet hotels.",
    },
    sr: {
      href: "/sr/novi-sad/pet-sitting/prices/",
      title: "Cene čuvanja ljubimaca u Novom Sadu",
      description: "Uporedite objavljene cene obilazaka, čuvanja i hotela za ljubimce.",
    },
  },
] as const;

export const telegramUrl = (text = "") => {
  if (!petSittingConfig.telegramUsername) return "";
  const base = `https://t.me/${petSittingConfig.telegramUsername}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
