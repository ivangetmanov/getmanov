(() => {
  const article = document.querySelector("#article-content");
  const progressBar = document.querySelector(".reading-progress__bar");
  const tocList = document.querySelector(".article-toc__list");

  if (!article || !progressBar || !tocList) return;

  const headingRoot = article.querySelector(":scope > .pet-article") || article;
  let headings = [
    ...headingRoot.querySelectorAll(":scope > h2, :scope > h3"),
  ];

  if (!headings.length) {
    const fallbackLabels = [...headingRoot.querySelectorAll(":scope > p")].filter(
      (paragraph) =>
        paragraph.children.length === 1 &&
        paragraph.firstElementChild?.tagName === "STRONG" &&
        paragraph.textContent.trim().length <= 90,
    );

    headings = [
      ...headingRoot.querySelectorAll(":scope > h1"),
      ...fallbackLabels,
    ].sort((first, second) =>
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    );
  }

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
  const tocNav = tocList.closest("nav");
  let currentActiveId = "";

  const moveActiveIndicator = (link) => {
    tocList.style.setProperty("--toc-active-y", `${link.offsetTop}px`);
    tocList.style.setProperty(
      "--toc-active-height",
      `${link.offsetHeight}px`,
    );
  };

  const keepActiveLinkInPlace = (link) => {
    if (!tocNav) return;

    const title = tocNav.querySelector(".article-toc__title");
    const titleHeight = title?.offsetHeight ?? 0;
    const availableHeight = Math.max(0, tocNav.clientHeight - titleHeight);
    const anchorLine = titleHeight + Math.min(availableHeight * 0.38, 220);
    const linkCenter = link.offsetTop + link.offsetHeight / 2;
    const maxScroll = Math.max(0, tocNav.scrollHeight - tocNav.clientHeight);

    const targetTop = Math.min(
      maxScroll,
      Math.max(0, linkCenter - anchorLine),
    );

    tocNav.scrollTo({
      top: targetTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

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

    const activeChanged = activeId !== currentActiveId;
    currentActiveId = activeId;

    tocLinks.forEach((link) => {
      const isActive = link.dataset.headingId === activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
        moveActiveIndicator(link);
        if (activeChanged) keepActiveLinkInPlace(link);
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
  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const heading = document.getElementById(link.dataset.headingId);
      if (!heading) return;

      event.preventDefault();
      heading.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      history.replaceState(null, "", link.hash);
    });
  });
  updateReadingState();
})();
