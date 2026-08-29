import { petSittingUnavailablePeriods } from "./pet-sitting-availability.mjs";

export type PetSittingPageKind = "main" | "dogs" | "cats";

/**
 * The only operational settings for the static pet-sitting experiment.
 * Update the shared data modules for availability, pricing, Telegram, photos, or video embeds.
 */
export const petSittingConfig = {
  telegramUsername: "ya_kushka",
  unavailablePeriods: petSittingUnavailablePeriods,
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
      name: "Пабло",
      nameEn: "Pablo",
      description: "Очень дружелюбный и любопытный. Обычно ему интересно, кто приехал, и он хочет познакомиться.",
      descriptionEn: "Very friendly and curious. He is usually interested in new guests and likes to see who has arrived.",
      image: "/images/pet-sitting/pablo.webp",
    },
    {
      name: "Свит",
      nameEn: "Sweet",
      description: "Более пугливая. Чаще сама уходит куда-нибудь подальше и спокойно чиллит отдельно.",
      descriptionEn: "More cautious. She usually chooses somewhere away from the action and relaxes on her own.",
      image: "/images/pet-sitting/sweet.webp",
    },
  ],
  heroPhotos: {
    main: "/images/pet-sitting/cat-guest-01.webp",
    dogs: "/images/pet-sitting/dog-guest-02.webp",
    cats: "/images/pet-sitting/cats-hero.webp",
  } as Record<PetSittingPageKind, string>,
  guestPhotos: [
    { src: "/images/pet-sitting/dog-guest-01.webp", alt: "Собака-гость во время домашней передержки", altEn: "Guest dog during a stay in our home", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-02.webp", alt: "Собака-гость отдыхает дома", altEn: "Guest dog resting at home", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-03.webp", alt: "Собака-гость дома", altEn: "Guest dog staying in our home", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-04.webp", alt: "Собака-гость во время игры", altEn: "Guest dog during play", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-05.webp", alt: "Собака-гость играет дома", altEn: "Guest dog playing at home", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-06.webp", alt: "Собака-гость у окна", altEn: "Guest dog by the window", kind: "dogs" },
    { src: "/images/pet-sitting/dog-guest-07.webp", alt: "Собака-гость во время домашней передержки", altEn: "Guest dog during home boarding", kind: "dogs" },
    { src: "/images/pet-sitting/cat-guest-01.webp", alt: "Кошки отдыхают дома", altEn: "Cats resting at home", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-02.webp", alt: "Кошка-гость дома", altEn: "Guest cat staying in our home", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-03.webp", alt: "Кошка-гость отдыхает рядом с человеком", altEn: "Guest cat resting next to a person", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-04.webp", alt: "Кошки отдыхают на кровати", altEn: "Cats resting on the bed", kind: "cats" },
    { src: "/images/pet-sitting/cat-guest-05.webp", alt: "Кошка-гость спит", altEn: "Guest cat sleeping", kind: "cats" },
  ] as Array<{
    src: string;
    alt: string;
    altEn: string;
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

export const petSittingPagesEn: typeof petSittingPages = {
  main: {
    path: "/en/novi-sad/pet-sitting/",
    title: "Pet Boarding in Novi Sad — Home Pet Sitting in Petrovaradin",
    description: "Home pet boarding for dogs and cats in Petrovaradin, Novi Sad. Familiar routines, up to two guest pets, real photos and videos, and a free introduction before the first stay.",
    h1: "Home pet boarding for dogs and cats in Novi Sad",
    lead: "Your pet stays with us in our home in Petrovaradin. We try to change as little as possible about their normal life: walks and meals stay close to their usual schedule, familiar house rules stay familiar, and we take their personality and habits into account.",
    focus: "Pet boarding",
  },
  dogs: {
    path: "/en/novi-sad/pet-sitting/dogs/",
    title: "Dog Boarding in Novi Sad — Home Dog Sitter in Petrovaradin",
    description: "Home dog boarding in Petrovaradin, Novi Sad. Familiar walking and feeding routines, real guest videos, a free introduction and a trial stay before boarding.",
    h1: "Dog boarding in Novi Sad",
    lead: "Your dog stays with us in our home in Petrovaradin and, as much as possible, continues their normal routine. We walk them as often as they are used to. We feed them on their normal schedule. If they are allowed on the bed at home, they are allowed on the bed here. And if your dog cannot stay home alone at all, tell us in advance — we may be able to arrange the stay so that one of us is always home.",
    focus: "Dog boarding",
  },
  cats: {
    path: "/en/novi-sad/pet-sitting/cats/",
    title: "Cat Boarding in Novi Sad — Home Cat Sitter in Petrovaradin",
    description: "Home cat boarding in Petrovaradin, Novi Sad. Separate rooms when needed, familiar food and litter, no forced interaction, real photos and videos.",
    h1: "Cat boarding in Novi Sad",
    lead: "A cat does not need to become sociable just because they are staying somewhere new. We keep familiar food, litter, routines and the option to have a quiet space of their own.",
    focus: "Cat boarding",
  },
};

export const telegramUrl = (text = "") => {
  if (!petSittingConfig.telegramUsername) return "";
  const base = `https://t.me/${petSittingConfig.telegramUsername}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
