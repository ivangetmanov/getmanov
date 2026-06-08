---
layout: ../../../layouts/BaseLayout.astro
title: "Track Copy Email Events in GA4"
description: "A minimal JavaScript pattern for tracking copy-email intent in Google Analytics 4 without plugins."
canonical: "/tools/track-email-copy/"
---

# Track Copy Email Events in GA4

Updated for GA4. No plugins. Works on static sites.

When a visitor copies an email address from your website, you can send a `copy_email` event to GA4. This is useful for measuring contact intent on portfolio pages, case studies, landing pages, or service pages.

## What you will track

The event name is `copy_email`. The event can include the copied email address as an event parameter.

## Step 1: Mark up your email

Add a `data-email` attribute to the element users can copy.

```html
<a href="mailto:hello@getmanov.com" data-email="hello@getmanov.com">
  hello@getmanov.com
</a>
```

## Step 2: Add the JavaScript listener

```html
<script>
  document.addEventListener("copy", () => {
    const selection = String(window.getSelection() || "").trim();
    const emailElement = document.querySelector(`[data-email="${selection}"]`);

    if (!emailElement || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "copy_email", {
      email: emailElement.getAttribute("data-email"),
      event_category: "contact",
      event_label: "email_copy",
    });
  });
</script>
```

## Step 3: Check the event in GA4

1. Open GA4.
2. Go to Reports -> Engagement -> Events.
3. Find `copy_email`.
4. If you want to store the copied email value, create a custom dimension for the `email` parameter.

## Test

Copy this email: <a href="mailto:test@getmanov.com" data-email="test@getmanov.com">test@getmanov.com</a>

That is it. You now track copy-email intent with a tiny client-side script.
