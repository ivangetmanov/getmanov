(() => {
  const galleries = [...document.querySelectorAll(".case-gallery")];
  if (!galleries.length) return;

  const lightbox = document.createElement("dialog");
  lightbox.className = "case-lightbox";
  lightbox.innerHTML = `
    <div class="case-lightbox__panel">
      <div class="case-lightbox__header">
        <span class="case-lightbox__title"></span>
        <span class="case-lightbox__count"></span>
        <button class="case-lightbox__close" type="button" aria-label="Close image viewer">Close</button>
      </div>
      <div class="case-lightbox__stage">
        <button class="case-lightbox__nav case-lightbox__nav--prev" type="button" aria-label="Previous image">←</button>
        <figure>
          <img alt="" />
          <figcaption></figcaption>
        </figure>
        <button class="case-lightbox__nav case-lightbox__nav--next" type="button" aria-label="Next image">→</button>
      </div>
    </div>
  `;
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  const lightboxTitle = lightbox.querySelector(".case-lightbox__title");
  const lightboxCount = lightbox.querySelector(".case-lightbox__count");
  const lightboxPrevious = lightbox.querySelector(".case-lightbox__nav--prev");
  const lightboxNext = lightbox.querySelector(".case-lightbox__nav--next");
  const lightboxClose = lightbox.querySelector(".case-lightbox__close");

  let activeImages = [];
  let activeIndex = 0;
  let returnFocus = null;

  const renderLightbox = () => {
    const image = activeImages[activeIndex];
    const galleryName =
      image.closest(".case-gallery")?.getAttribute("aria-label") || "Case study images";
    const description = image.alt || galleryName;

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = description;
    lightboxCaption.textContent = description;
    lightboxTitle.textContent = galleryName;
    lightboxCount.textContent = `${activeIndex + 1} / ${activeImages.length}`;
    lightboxPrevious.disabled = activeIndex === 0;
    lightboxNext.disabled = activeIndex === activeImages.length - 1;
  };

  const openLightbox = (images, index, trigger) => {
    activeImages = images;
    activeIndex = index;
    returnFocus = trigger;
    renderLightbox();
    lightbox.showModal();
  };

  const changeLightboxImage = (step) => {
    activeIndex = Math.max(
      0,
      Math.min(activeImages.length - 1, activeIndex + step),
    );
    renderLightbox();
  };

  lightboxPrevious.addEventListener("click", () => changeLightboxImage(-1));
  lightboxNext.addEventListener("click", () => changeLightboxImage(1));
  lightboxClose.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => returnFocus?.focus());
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") changeLightboxImage(-1);
    if (event.key === "ArrowRight") changeLightboxImage(1);
  });

  galleries.forEach((gallery) => {
    const images = [...gallery.querySelectorAll(":scope > img")];
    if (!images.length) return;

    images.forEach((image, index) => {
      image.classList.add("case-gallery__image");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute(
        "aria-label",
        `Open image ${index + 1} of ${images.length} in full-screen viewer`,
      );
      image.addEventListener("click", () => openLightbox(images, index, image));
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(images, index, image);
        }
      });
    });

    if (images.length === 1) {
      gallery.classList.add("case-gallery--single");
      return;
    }

    const shell = document.createElement("section");
    shell.className = "case-gallery-shell";
    shell.setAttribute("aria-label", gallery.getAttribute("aria-label") || "Image gallery");

    const toolbar = document.createElement("div");
    toolbar.className = "case-gallery__toolbar";
    toolbar.innerHTML = `
      <div>
        <div class="case-gallery__title">${gallery.getAttribute("aria-label") || "Case study images"}</div>
        <div class="case-gallery__hint">Swipe, scroll, or use the arrows. Select an image to enlarge it.</div>
      </div>
      <div class="case-gallery__controls">
        <span class="case-gallery__count" aria-live="polite">1 / ${images.length}</span>
        <button class="case-gallery__button case-gallery__button--prev" type="button" aria-label="Previous image">←</button>
        <button class="case-gallery__button case-gallery__button--next" type="button" aria-label="Next image">→</button>
      </div>
    `;

    gallery.parentNode.insertBefore(shell, gallery);
    shell.append(toolbar, gallery);
    gallery.classList.add("case-gallery--carousel");
    gallery.tabIndex = 0;
    gallery.setAttribute("role", "region");
    gallery.setAttribute("aria-roledescription", "carousel");

    const counter = toolbar.querySelector(".case-gallery__count");
    const previous = toolbar.querySelector(".case-gallery__button--prev");
    const next = toolbar.querySelector(".case-gallery__button--next");
    let currentIndex = 0;
    let scrollFrame = null;

    const updateControls = (index) => {
      currentIndex = Math.max(0, Math.min(images.length - 1, index));
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
      previous.disabled = currentIndex === 0;
      next.disabled = currentIndex === images.length - 1;
    };

    const goTo = (index) => {
      const nextIndex = Math.max(0, Math.min(images.length - 1, index));
      gallery.scrollTo({
        left: images[nextIndex].offsetLeft,
        behavior: "smooth",
      });
      updateControls(nextIndex);
    };

    previous.addEventListener("click", () => goTo(currentIndex - 1));
    next.addEventListener("click", () => goTo(currentIndex + 1));
    gallery.addEventListener("scroll", () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
        updateControls(index);
      });
    });
    gallery.addEventListener("keydown", (event) => {
      if (event.target !== gallery) return;
      if (event.key === "ArrowLeft") goTo(currentIndex - 1);
      if (event.key === "ArrowRight") goTo(currentIndex + 1);
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(images.length - 1);
    });

    updateControls(0);
  });
})();
