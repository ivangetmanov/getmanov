(() => {
  const article = document.querySelector("#article-content");
  const progressBar = document.querySelector(".reading-progress__bar");
  const tocList = document.querySelector(".article-toc__list");

  if (!article || !progressBar || !tocList) return;

  const headings = [
    ...article.querySelectorAll(":scope > h2, :scope > h3"),
  ];

  if (!headings.length) {
    document.body.classList.add("article-toc-empty");
  }

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const usedIds = new Set();

  headings.forEach((heading, index) => {
    let id = heading.id || slugify(heading.textContent) || `section-${index + 1}`;
    const baseId = id;
    let suffix = 2;

    while (usedIds.has(id) || (document.getElementById(id) && heading.id !== id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    heading.id = id;
    usedIds.add(id);

    const item = document.createElement("li");
    item.className = `article-toc__item article-toc__item--${heading.tagName.toLowerCase()}`;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = heading.textContent;
    link.dataset.headingId = id;

    item.append(link);
    tocList.append(item);
  });

  const tocLinks = [...tocList.querySelectorAll("a")];

  const updateReadingState = () => {
    const articleTop = article.getBoundingClientRect().top + window.scrollY;
    const articleBottom = articleTop + article.offsetHeight;
    const viewportMarker = window.scrollY + Math.min(window.innerHeight * 0.32, 260);
    const progressEnd = Math.max(articleTop + 1, articleBottom - window.innerHeight);
    const progress = Math.min(
      1,
      Math.max(0, (window.scrollY - articleTop) / (progressEnd - articleTop)),
    );

    progressBar.style.transform = `scaleX(${progress})`;

    let activeId = headings[0]?.id;
    headings.forEach((heading) => {
      const headingTop = heading.getBoundingClientRect().top + window.scrollY;
      if (headingTop <= viewportMarker) activeId = heading.id;
    });

    tocLinks.forEach((link) => {
      const isActive = link.dataset.headingId === activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
        const nav = tocList.closest("nav");
        const linkTop = link.offsetTop;
        const linkBottom = linkTop + link.offsetHeight;

        if (linkTop < nav.scrollTop) {
          nav.scrollTop = linkTop - 8;
        } else if (linkBottom > nav.scrollTop + nav.clientHeight) {
          nav.scrollTop = linkBottom - nav.clientHeight + 8;
        }
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  let animationFrame = 0;
  const requestUpdate = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updateReadingState);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateReadingState();
})();
