import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = path.resolve("dist");
const siteOrigin = "https://getmanov.com";

if (!fs.existsSync(root)) {
  console.error("dist/ does not exist. Run npm run build first.");
  process.exit(1);
}

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push(absolute);
  }
};
walk(root);

const htmlFiles = files.filter((file) => file.endsWith(".html"));
const publicPaths = new Set(
  files.map((file) => `/${path.relative(root, file).split(path.sep).join("/")}`),
);
const routeToFile = new Map();

for (const file of htmlFiles) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const route =
    relative === "index.html"
      ? "/"
      : `/${relative.replace(/index\.html$/, "").replace(/\.html$/, "")}`;
  routeToFile.set(route, file);
}

const redirects = new Set();
const redirectsFile = path.join(root, "_redirects");
if (fs.existsSync(redirectsFile)) {
  for (const line of fs.readFileSync(redirectsFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    redirects.add(trimmed.split(/\s+/)[0]);
  }
}

const failures = [];
const incoming = new Map([...routeToFile.keys()].map((route) => [route, 0]));
const domCache = new Map();

const getDom = (file) => {
  if (!domCache.has(file)) {
    domCache.set(file, new JSDOM(fs.readFileSync(file, "utf8")).window.document);
  }
  return domCache.get(file);
};

const resolveTarget = (rawValue, sourceRoute) => {
  if (
    !rawValue ||
    rawValue.startsWith("mailto:") ||
    rawValue.startsWith("tel:") ||
    rawValue.startsWith("javascript:") ||
    rawValue.startsWith("data:")
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(rawValue, `${siteOrigin}${sourceRoute}`);
  } catch {
    return { error: `invalid URL: ${rawValue}` };
  }

  if (url.origin !== siteOrigin) return null;
  const pathname = decodeURIComponent(url.pathname);
  return { pathname, hash: decodeURIComponent(url.hash.slice(1)) };
};

const routeExists = (pathname) => {
  if (routeToFile.has(pathname)) return true;
  if (routeToFile.has(`${pathname.replace(/\/?$/, "/")}`)) return true;
  if (publicPaths.has(pathname)) return true;
  if (redirects.has(pathname)) return true;
  return false;
};

for (const [sourceRoute, file] of routeToFile) {
  const document = getDom(file);
  const checks = [
    ...[...document.querySelectorAll("a[href]")].map((node) => ({
      type: "link",
      value: node.getAttribute("href"),
    })),
    ...[...document.querySelectorAll("img[src]")].map((node) => ({
      type: "image",
      value: node.getAttribute("src"),
    })),
  ];

  for (const check of checks) {
    const target = resolveTarget(check.value, sourceRoute);
    if (!target) continue;
    if (target.error) {
      failures.push(`${sourceRoute}: ${target.error}`);
      continue;
    }

    if (!routeExists(target.pathname)) {
      failures.push(
        `${sourceRoute}: missing ${check.type} target ${check.value}`,
      );
      continue;
    }

    const normalizedRoute = routeToFile.has(target.pathname)
      ? target.pathname
      : `${target.pathname.replace(/\/?$/, "/")}`;
    if (check.type === "link" && incoming.has(normalizedRoute)) {
      incoming.set(normalizedRoute, incoming.get(normalizedRoute) + 1);
    }

    if (target.hash && routeToFile.has(normalizedRoute)) {
      const targetDocument = getDom(routeToFile.get(normalizedRoute));
      const escapedHash = target.hash.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      if (
        !targetDocument.getElementById(target.hash) &&
        !targetDocument.querySelector(`[name="${escapedHash}"]`)
      ) {
        failures.push(
          `${sourceRoute}: missing anchor #${target.hash} in ${normalizedRoute}`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} broken internal references:\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const unlinked = [...incoming]
  .filter(([route, count]) => route !== "/" && count === 0)
  .map(([route]) => route);

console.log(
  `Checked ${routeToFile.size} pages: all internal links, anchors, and images resolve.`,
);
if (unlinked.length) {
  console.log(`Pages with no incoming content link (${unlinked.length}):`);
  for (const route of unlinked) console.log(`- ${route}`);
}
