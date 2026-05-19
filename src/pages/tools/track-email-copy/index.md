<div role="main">

<div>

# Track “Copy Email” Events in GA4 with JavaScript

<div>

Updated for GA4 • No plugins • Works on any static site

</div>

</div>

<div aria-label="Table of contents">

**Contents**

1.  [What you’ll track](#what)
2.  [Step 1 — Mark up your email](#html)
3.  [Step 2 — Add the JS listener (GA4)](#js)
4.  [Step 3 — See it in GA4](#ga4)

</div>

## What you’ll track

When a user copies an email address from your site, we’ll send a GA4 event: `copy_email`. This is useful for measuring “contact intent” on portfolio pages, case studies, or service pages.

## Step 1 — Mark up your email

Add a `data-email` attribute to the element that users can copy. This makes tracking reliable (we don’t have to guess what was copied).

    <a href="mailto:hello@getmanov.com" data-email="hello@getmanov.com">
      hello@getmanov.com
    </a>

## Step 2 — Add the JS listener (GA4)

Paste this script anywhere on the page (ideally before `</body>`). It listens for the `copy` event and fires `gtag("event", ...)`.

<div>

**Note:** this fires only if GA4 is installed (gtag/GTM). If your GA4 loads with delay (like in this page), the first copy within 2 seconds might not be tracked — usually acceptable. If you want 100% capture, we can buffer events until gtag is ready.

</div>

## Step 3 — See it in GA4

1.  GA4 → **Reports** → **Engagement** → **Events**.
2.  Find `copy_email` (may take a bit to appear after first hits).
3.  If you want to store the copied email value, create a **Custom dimension** for parameter `email` (Admin → Custom definitions).

That’s it. You now track “copy email” intent on a static site with a tiny JS snippet.

------------------------------------------------------------------------

**Test:** copy this email → <a href="mailto:test@getmanov.com" data-email="test@getmanov.com">test@getmanov.com</a>

</div>
