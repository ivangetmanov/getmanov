# Project Context & LLM Operating Manual

This repository contains a static website built with Astro and deployed to Netlify.

## 1. Project Overview

**Project type:** Static website  
**Primary goal:** Content-driven site with tools, notes, projects, and case studies  
**Rendering model:** Static generation with one isolated Netlify Function for pet-sitting enquiry delivery

### Explicit non-goals (important)

- ❌ No general application backend beyond the isolated pet-sitting notification function
- ❌ No databases
- ❌ No authentication
- ❌ No SSR
- ❌ No API routes

The project follows a **static-first** philosophy.

## 2. Tech Stack

### Hosting & Build

- **Hosting:** Netlify
- **Build command:** `npm run build`
- **Build tool:** Astro (`astro build`)
- **Output directory:** `/dist`
- **Server OS:** Linux (Netlify build environment)
- **Filesystem:** Case-sensitive

### Framework

- **Framework:** Astro
- **Routing:** File-based (`src/pages/**`)
- **Layouts:** Astro components (manual imports only)

### Languages & Formats

- **Astro (`.astro`)** — pages, layouts, components  
- **Markdown (`.md`)** — content pages  
- **TypeScript / JavaScript** — minimal client-side logic  
- **HTML / CSS** — styling and markup  

Continue

## 3. Editor & Notes Environment

### Obsidian (IMPORTANT CLARIFICATION)

- Obsidian is used **only as a local Markdown editor**
- Obsidian is **NOT** part of the build system
- Obsidian is **NOT** a server or runtime
- No Obsidian-specific syntax should be assumed

Obsidian vault = regular folder with `.md` files.

Continue

## 3) Actual Project Structure

```txt
public/
 ├─ styles/
 │   └─ global.css
 ├─ _redirects
 └─ robots.txt

src/
 ├─ layouts/
 │   └─ BaseLayout.astro
 └─ pages/
     ├─ index.astro                 -> /
     ├─ case-studies/
     │   └─ index.astro             -> /case-studies
     ├─ notes/
     │   ├─ index.astro             -> /notes
     │   └─ llm-visible-research.md -> /notes/llm-visible-research
     ├─ projects/
     │   └─ index.astro             -> /projects
     └─ tools/
         ├─ index.astro             -> /tools
         └─ track-email-copy.astro  -> /tools/track-email-copy

netlify/
 └─ functions/
     └─ pet-sitting-inquiry.mjs     -> Telegram delivery for pet-sitting enquiries
````
### Structural rules

* Each file in `src/pages/` = one route
* `index.astro` maps to folder root
* Markdown files generate static routes
* Layouts and components are **not auto-imported**

Continue

## 5. Layout & Component Usage Rules

### Correct layout usage

```astro
import BaseLayout from "../../layouts/BaseLayout.astro";

<BaseLayout title="Page title">
  <main>
    ...
  </main>
</BaseLayout>
```

### Strict rules

* Components MUST be explicitly imported
* File and folder names are case-sensitive
* Do NOT rely on implicit globals
* Prefer relative imports over aliases

Continue

## 6. Routing Logic

| File path                     | Route             |
| ContinueContinueContinueContinueContinueContinueContinueContinueContinue-- | ContinueContinueContinueContinueContinue-- |
| `src/pages/index.astro`       | `/`               |
| `src/pages/tools/index.astro` | `/tools`          |
| `src/pages/tools/x.astro`     | `/tools/x`        |
| `src/pages/notes/example.md`  | `/notes/example/` |

Continue

## 7. Build & Deploy Rules (Netlify)

* Netlify runs builds on **Linux**
* Local macOS behavior may differ
* Common production-only failures:

  * incorrect filename casing
  * missing imports
  * invalid relative paths

Netlify logs are the **single source of truth** for build errors.

### Pet-sitting enquiry environment variables

The `pet-sitting-inquiry` Netlify Function requires these production environment variables:

* `PET_SITTING_TELEGRAM_BOT_TOKEN`
* `PET_SITTING_TELEGRAM_CHAT_ID`

They are server-side secrets and must never be exposed through Astro page data or client-side JavaScript. If either variable is unavailable, the function returns a temporary delivery error while the direct Telegram, WhatsApp, and Viber links remain usable.

Continue

## 8. Known Pitfalls

### Common errors

* `Component is not defined` → missing import
* `Cannot find module` → wrong path or casing
* Works locally, fails on Netlify → case-sensitive filesystem issue

Continue

## 9. What LLM Should Assume

When assisting with this repository, the LLM MUST assume:

* Static Astro project
* Linux case-sensitive filesystem
* No general backend or server logic beyond the isolated pet-sitting notification function
* No SSR
* Manual component imports only
* Markdown is plain CommonMark (no Obsidian extensions)

Continue

## 10. What LLM Must NOT Suggest

* ❌ Next.js / Nuxt / Remix
* ❌ Backend APIs
* ❌ Databases
* ❌ Server-side rendering
* ❌ Obsidian plugins as runtime features

Continue

## 11. LLM Prompt Contract

When working with this repository, use the following constraints:

> You are working inside an Astro static site deployed to Netlify.
> Use only Astro, Markdown, and static logic.
> Respect Linux case-sensitive filesystem rules.
> Never assume auto-imports or backend capabilities.

Continue

## 12. Current Status

* Build status: unstable (known layout import issue previously)
* Active focus: documentation clarity and LLM context stabilization

Continue

## 13. Change Log

2025-12-25

* Added unified LLM project context
* Explicitly documented Obsidian as editor-only
* Documented Netlify Linux environment


## ✅ Changelog (текущий этап)

### 🧱 Архитектура и контент

* Переведены кейсы и статьи из старого HTML (Tilda) в **Astro + Markdown**
* Настроен единый `BaseLayout.astro` для всех `.md` страниц
* Все страницы корректно рендерятся через `<slot />` внутри layout
* Введена единая структура:

  * `/case-studies/*/index.md`
  * `/notes/*/index.md`
  * `/tools/*`
* Главная навигация (header/footer) стабилизирована

### 🎨 Стили

* Подключены глобальные стили:

  * `/styles/global.css`
  * `/styles/markdown.css`
* Контент `.md` корректно оборачивается в `.prose`
* Текст, заголовки, списки и изображения отображаются стабильно
* Осознанно **отказались от старых tilda-css и js**

### 🖼️ Изображения

* Все изображения теперь грузятся из `/public/images`
* Исправлены некорректные пути (`__noroot`, `__img_`, `__blue_*` и т.д.)
* Принято решение:

  * **не восстанавливать “декоративные” tilda-фоны**
  * оставить только смысловые изображения
* В seo-case-b2b отображается **5 из 7** изображений (достаточно для кейса)

### 🧹 Технический мусор

* Старые tilda-скрипты (`tilda-blocks-*.js`, `lazyload`, etc.) **больше не используются**
* Проект стал:

  * легче
  * чище
  * полностью контролируемым


## 🧠 Зафиксированные решения

* **Ничего не “довылизываем” сейчас** — состояние “достаточно хорошо”
* Пушим текущую версию
* Все улучшения — в следующий этап, осознанно


## 🛠️ TODO / Next steps (будущее)

### 1️⃣ Контент-аудит статей

**Задача:** прочекать статьи на адекватность
Что именно:

* смысл (нет ли воды, устаревших формулировок)
* структура (где логика “плывёт”)
* дубли мыслей
* язык (особенно в старых RU-текстах)

📌 Можно делать постепенно, не все сразу.


### 2️⃣ Решить судьбу RU-статей

Варианты:

* оставить как есть (RU как исторический архив)
* частично переписать под Global / EN
* скрыть из навигации, но оставить для SEO
* вынести в `/ru/` или отдельную секцию

📌 Решение стратегическое — не срочно.


### 3️⃣ Убрать старый номер телефона

**Обязательно:**

* убрать старый номер **отовсюду**
* особенно:

  * `wa.me/...`
  * `tel:`
  * `https://wa.me/...`

Как делать:

```bash
grep -RIn "7951" .
grep -RIn "whatsapp" .
grep -RIn "wa.me" .
```

📌 Заменить либо на актуальный номер, либо убрать вообще, если стратегия — без телефона.


### 4️⃣ Вернуть нормальную структуру списков

Проблема:

* в старых статьях были:

  * пункты
  * подпункты
  * иерархия
* при миграции часть этого превратилась в “плоский текст”

Что нужно:

* восстановить:

  * `-` / `1.` / `1.1`
  * логические блоки
  * подзаголовки
* привести статьи к:

  * читаемому
  * сканируемому виду

📌 Это чисто **редакторская работа**, без техдолга.
