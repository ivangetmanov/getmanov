export const siteOrigin = "https://getmanov.com";

export const petSittingSchemaIds = Object.freeze({
  website: `${siteOrigin}/#website`,
  ivan: `${siteOrigin}/#ivan-getmanov`,
  anna: `${siteOrigin}/#anna-iakushko`,
  services: Object.freeze({
    main: `${siteOrigin}/#home-pet-boarding-service`,
    dogs: `${siteOrigin}/#home-dog-boarding-service`,
    cats: `${siteOrigin}/#home-cat-boarding-service`,
    homeVisits: `${siteOrigin}/#in-home-pet-sitting-service`,
  }),
});

export function absoluteSiteUrl(path) {
  return new URL(path, siteOrigin).href;
}

export function petSittingWebsiteEntity() {
  return {
    "@type": "WebSite",
    "@id": petSittingSchemaIds.website,
    url: `${siteOrigin}/`,
    name: "GETMANOV",
    inLanguage: ["en", "ru"],
    publisher: { "@id": petSittingSchemaIds.ivan },
  };
}

export function ivanEntity() {
  return {
    "@type": "Person",
    "@id": petSittingSchemaIds.ivan,
    name: "Ivan Getmanov",
    alternateName: ["Иван", "Ваня"],
    url: `${siteOrigin}/`,
  };
}

export function annaEntity() {
  return {
    "@type": "Person",
    "@id": petSittingSchemaIds.anna,
    name: "Anna Iakushko",
    alternateName: "Аня",
  };
}

export function primaryImageEntity({ url, width, height }) {
  return {
    "@type": "ImageObject",
    "@id": `${url}#image`,
    url,
    contentUrl: url,
    width,
    height,
    representativeOfPage: true,
  };
}

export function petSittingAreaServed() {
  return [
    { "@type": "City", name: "Novi Sad" },
    { "@type": "Place", name: "Petrovaradin" },
  ];
}
