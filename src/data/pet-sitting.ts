export type PetSittingPageKind = "main" | "dogs" | "cats";

/**
 * The only operational settings for the static pet-sitting experiment.
 * Update this file for availability, pricing, Telegram, photos, or video embeds.
 */
export const petSittingConfig = {
  telegramUsername: "ya_kushka",
  unavailablePeriods: [
    // { from: "2026-10-12", to: "2026-10-19" },
  ],
  prices: {
    oneAnimal: [
      { duration: "1–3 дня", price: "2 000 RSD в сутки" },
      { duration: "4–13 дней", price: "1 500 RSD в сутки" },
      { duration: "14+ дней", price: "обсуждаем цену и возможную скидку отдельно" },
    ],
    twoAnimals: [
      { duration: "1–3 дня", price: "3 000 RSD в сутки" },
      { duration: "4–13 дней", price: "2 500 RSD в сутки" },
      { duration: "14+ дней", price: "обсуждаем отдельно" },
    ],
  },
  residentCats: [
    {
      name: "Кот",
      description: "Общительный, дружелюбный и любопытный к гостям.",
      image: "", // Add a local public image path here, for example /images/pet-sitting/cat-1.webp
    },
    {
      name: "Кошка",
      description: "Осторожнее и спокойнее: выбирает своё тихое место и часто наблюдает со стороны.",
      image: "", // Add a local public image path here, for example /images/pet-sitting/cat-2.webp
    },
  ],
  heroPhotos: {
    main: "",
    dogs: "",
    cats: "",
  } as Record<PetSittingPageKind, string>,
  guestPhotos: [] as Array<{
    src: string;
    alt: string;
    kind?: PetSittingPageKind;
  }>,
  youtubeVideos: [] as Array<{
    id: string;
    title: string;
    kind?: PetSittingPageKind;
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
    path: "/ru/novi-sad/pet-sitting/",
    title: "Передержка животных в Нови-Саде — домашний петситтинг в Петроварадине",
    description: "Домашняя передержка собак и кошек в Петроварадине, Нови-Сад. Привычный режим, до 2 гостей, фото и видео, знакомство до первого проживания.",
    h1: "Домашняя передержка собак и кошек в Нови‑Саде",
    lead: "Питомец временно живёт у нас дома в Петроварадине. Стараемся сохранить его обычный режим — прогулки, кормление, сон и привычные правила.",
    focus: "Для собак и кошек",
  },
  dogs: {
    path: "/ru/novi-sad/pet-sitting/dogs/",
    title: "Передержка собак в Нови-Саде — домашний догситтер в Петроварадине",
    description: "Домашняя передержка собак в Петроварадине, Нови-Сад: привычный график прогулок и кормления, знакомство до первого проживания, фото и видео.",
    h1: "Передержка собак в Нови‑Саде",
    lead: "Если нужно оставить собаку в Нови-Саде на несколько дней или дольше, обсудим её привычный график прогулок, кормления, сна и возможность не оставаться одной.",
    focus: "Для собак",
  },
  cats: {
    path: "/ru/novi-sad/pet-sitting/cats/",
    title: "Передержка кошек в Нови-Саде — домашний ситтер в Петроварадине",
    description: "Домашняя передержка кошек в Петроварадине, Нови-Сад: отдельное пространство, привычный корм и наполнитель, спокойное знакомство, фото и видео.",
    h1: "Передержка кошек в Нови‑Саде",
    lead: "Кошке не нужно становиться общительной, чтобы ей было спокойно. Сохраняем привычный корм, наполнитель, ритм и возможность уйти в своё безопасное пространство.",
    focus: "Для кошек",
  },
};

export const telegramUrl = (text = "") => {
  if (!petSittingConfig.telegramUsername) return "";
  const base = `https://t.me/${petSittingConfig.telegramUsername}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
