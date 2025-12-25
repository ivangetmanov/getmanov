````md
# Project Context & LLM Operating Manual

This repository contains a static website built with Astro and deployed to Netlify.

## 1. Project Overview

**Project type:** Static website  
**Primary goal:** Content-driven site with tools, notes, projects, and case studies  
**Rendering model:** Static generation only

### Explicit non-goals (important)

- ❌ No backend
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

## 4. Project Structure

```txt
src/
 ├─ pages/
 │   ├─ index.astro
 │   ├─ tools/
 │   │   ├─ index.astro
 │   │   └─ track-email-copy.astro
 │   ├─ projects/
 │   ├─ notes/
 │   │   └─ *.md
 │   └─ case-studies/
 │
 ├─ layouts/
 │   └─ BaseLayout.astro
 │
 ├─ components/
 │   ├─ Header.astro
 │   ├─ Footer.astro
 │   └─ ...
 │
 ├─ styles/
 │   └─ global.css
 │
 └─ env.d.ts
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
* No backend or server logic
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
