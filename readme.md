# Project Context & LLM Operating Manual

This repository contains a static website built with Astro and deployed to Netlify.

---

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

---

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

---

## 3. Editor & Notes Environment

### Obsidian (IMPORTANT CLARIFICATION)

- Obsidian is used **only as a local Markdown editor**
- Obsidian is **NOT** part of the build system
- Obsidian is **NOT** a server or runtime
- No Obsidian-specific syntax should be assumed

Obsidian vault = regular folder with `.md` files.

---

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
