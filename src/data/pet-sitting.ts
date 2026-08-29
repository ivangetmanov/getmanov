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
      description: "Очень дружелюбный и любопытный. Обычно ему интересно, кто приехал, и он хочет познакомиться.",
      image: "", // Add a local public image path here, for example /images/pet-sitting/cat-1.webp
    },
    {
      name: "Кошка",
      description: "Более пугливая. Чаще сама уходит куда-нибудь подальше и спокойно чиллит отдельно.",
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
  guestVideos: [
    { url: "https://youtu.be/NwHXwGqr1FM?si=krP4SBa6TYdMlXMo", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/kTsjlgpyK_E?si=n0Qf6Jcc1vJ231X9", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/IPpKV9xGk_s?si=qbjCkbb_SJt7-QOs", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/upcNP-lwlLQ?si=RbdyU7oAZ4ldyc1D", animal: "dog", featured: true },
    { url: "https://youtube.com/shorts/QoDvkleTOmA?si=DVpxaX1qHRzOCxAf", animal: "dog" },
    { url: "https://youtube.com/shorts/LnHXyW79-6w?si=t7xWQDIybbWnlP8H", animal: "dog" },
    { url: "https://youtube.com/shorts/Nnp80nmWhMA?si=zo_ORiSnNe6Xcsi0", animal: "dog" },
    { url: "https://youtube.com/shorts/NpaWewHy8Mo?si=VaW3Dfb9gU1v_dgT", animal: "dog" },
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
    path: "/ru/novi-sad/pet-sitting/",
    title: "Передержка животных в Нови-Саде — домашний петситтинг в Петроварадине",
    description: "Домашняя передержка собак и кошек в Петроварадине, Нови-Сад. Привычный режим, до 2 гостей, фото и видео, знакомство до первого проживания.",
    h1: "Домашняя передержка собак и кошек в Нови‑Саде",
    lead: "Питомец живёт у нас дома в Петроварадине. Стараемся сделать так, чтобы его обычная жизнь изменилась как можно меньше: гуляем и кормим по привычному графику, не меняем правила дома и учитываем его характер и привычки.",
    focus: "Для собак и кошек",
  },
  dogs: {
    path: "/ru/novi-sad/pet-sitting/dogs/",
    title: "Передержка собак в Нови-Саде — домашний догситтер в Петроварадине",
    description: "Домашняя передержка собак в Петроварадине, Нови-Сад: привычный график прогулок и кормления, знакомство до первого проживания, фото и видео.",
    h1: "Передержка собак в Нови‑Саде",
    lead: "Собака живёт у нас дома в Петроварадине и по возможности продолжает жить в своём обычном режиме. Гуляем столько, сколько она привыкла. Кормим по привычному графику. Если дома можно на кровать — у нас тоже можно. А если собака вообще не умеет оставаться одна, скажите заранее — можем организовать так, чтобы кто-то из нас был дома.",
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
