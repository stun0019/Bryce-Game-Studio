"use strict";

const GAME_DATA_FILES = [
  "./games/hooded-escape.json",
  "./games/Gomoku-Magic.json",
  "./games/game-cook.json",
  "./games/Mist-Ruins.json"
];

const UPCOMING_PROJECT_COUNT = 3;

const MOBILE_CAROUSEL_BREAKPOINT = 650;
const MOBILE_CAROUSEL_INTERVAL = 4200;
const MOBILE_CAROUSEL_RESUME_DELAY = 5000;
const MOBILE_SWIPE_THRESHOLD = 42;

const LOADER_TIMELINE = {
  to80Duration: 850,
  pause80: 300,
  to90Duration: 250,
  pause90: 200,
  to100Duration: 200,
  welcomeDuration: 450,
  fadeDuration: 250
};

const GAME_THEMES = {
  "hooded-escape": {
    theme: "hooded",
    label: "SHADOW PROTOCOL",
    monogram: "HE"
  },

  "gomoku-magic": {
    theme: "gomoku",
    label: "ARCANE BOARD",
    monogram: "GM"
  },

  "game-cook": {
    theme: "cooking",
    label: "KITCHEN RUSH",
    monogram: "GC"
  },

  "mist-ruins": {
    theme: "mist",
    label: "FOGBOUND RUINS",
    monogram: "MR"
  }
};

const elements = {
  body: document.body,

  loader: document.getElementById("studioLoader"),
  loaderBar: document.getElementById("loaderBar"),
  loaderPercent: document.getElementById("loaderPercent"),

  loaderProgressbar: document.getElementById(
    "loaderProgressbar"
  ),

  loaderProgressPanel: document.getElementById(
    "loaderProgressPanel"
  ),

  loaderWelcome: document.getElementById(
    "loaderWelcome"
  ),

  gameGrid: document.getElementById("gameGrid"),
  gameCount: document.getElementById("gameCount"),
  currentYear: document.getElementById("currentYear"),
  carouselDots: document.getElementById("carouselDots"),

  upcomingGrid: document.getElementById("upcomingGrid"),

  menuButton: document.getElementById("menuButton"),

  navigation: document.getElementById(
    "mainNavigation"
  ),

  modalBackdrop: document.getElementById("gameModal"),

  modalPanel: document.querySelector(
    ".project-modal"
  ),

  modalClose: document.getElementById("modalClose"),
  modalArtwork: document.getElementById("modalArtwork"),

  modalCoverImage: document.getElementById(
    "modalCoverImage"
  ),

  modalMonogram: document.getElementById(
    "modalMonogram"
  ),

  modalProjectNumber: document.getElementById(
    "modalProjectNumber"
  ),

  modalThemeLabel: document.getElementById(
    "modalThemeLabel"
  ),

  modalStatus: document.getElementById("modalStatus"),
  modalTitle: document.getElementById("modalTitle"),

  modalDescription: document.getElementById(
    "modalDescription"
  ),

  modalGenre: document.getElementById("modalGenre"),

  modalProgress: document.getElementById(
    "modalProgress"
  ),

  modalYear: document.getElementById("modalYear"),

  modalTechnologies: document.getElementById(
    "modalTechnologies"
  ),

  modalFeatures: document.getElementById(
    "modalFeatures"
  ),

  modalControls: document.getElementById(
    "modalControls"
  ),

  modalResponsibilities: document.getElementById(
    "modalResponsibilities"
  ),

  modalPlayButton: document.getElementById(
    "modalPlayButton"
  ),

  modalRepositoryButton: document.getElementById(
    "modalRepositoryButton"
  )
};

let loadedGames = [];
let lastFocusedElement = null;
let modalCloseTimer = null;

let carouselIndex = 0;
let carouselTimer = null;
let carouselResumeTimer = null;
let carouselBound = false;
let carouselPointerDown = false;
let carouselStartX = 0;
let carouselStartY = 0;
let carouselMoved = false;

let loaderFinished = false;

window.addEventListener(
  "DOMContentLoaded",
  initializeStudio
);

async function initializeStudio() {
  setCurrentYear();
  bindNavigation();
  bindModal();
  initializeRevealAnimations();

  const gameLoadPromise = loadGames();

  await runStudioLoader();
  await gameLoadPromise;

  initializeMobileCarousel();
}

async function runStudioLoader() {
  if (!elements.loader) {
    finishStudioLoader();
    return;
  }

  await animateLoaderProgress(
    0,
    80,
    LOADER_TIMELINE.to80Duration
  );

  await wait(
    LOADER_TIMELINE.pause80
  );

  await animateLoaderProgress(
    80,
    90,
    LOADER_TIMELINE.to90Duration
  );

  await wait(
    LOADER_TIMELINE.pause90
  );

  await animateLoaderProgress(
    90,
    100,
    LOADER_TIMELINE.to100Duration
  );

  elements.loaderProgressPanel?.classList.add(
    "is-hidden"
  );

  if (elements.loaderWelcome) {
    elements.loaderWelcome.classList.add(
      "is-visible"
    );

    elements.loaderWelcome.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  await wait(
    LOADER_TIMELINE.welcomeDuration
  );

  finishStudioLoader();

  await wait(
    LOADER_TIMELINE.fadeDuration
  );
}

function finishStudioLoader() {
  if (loaderFinished) {
    return;
  }

  loaderFinished = true;

  elements.body.classList.remove(
    "is-loading"
  );

  elements.body.classList.add(
    "is-ready"
  );

  elements.loader?.classList.add(
    "is-complete"
  );

  window.setTimeout(() => {
    elements.loader?.remove();
  }, LOADER_TIMELINE.fadeDuration + 80);
}

function animateLoaderProgress(
  from,
  to,
  duration
) {
  return new Promise((resolve) => {
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased = easeOutCubic(
        progress
      );

      const value = Math.round(
        from + (to - from) * eased
      );

      setLoaderProgress(value);

      if (progress < 1) {
        requestAnimationFrame(update);
        return;
      }

      setLoaderProgress(to);
      resolve();
    }

    requestAnimationFrame(update);
  });
}

function setLoaderProgress(value) {
  const safeValue = Math.max(
    0,
    Math.min(100, value)
  );

  if (elements.loaderBar) {
    elements.loaderBar.style.width =
      `${safeValue}%`;
  }

  if (elements.loaderPercent) {
    elements.loaderPercent.textContent =
      `${safeValue}%`;
  }

  if (elements.loaderProgressbar) {
    elements.loaderProgressbar.setAttribute(
      "aria-valuenow",
      String(safeValue)
    );
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      duration
    );
  });
}

function setCurrentYear() {
  if (!elements.currentYear) {
    return;
  }

  elements.currentYear.textContent =
    String(new Date().getFullYear());
}

function formatProjectNumber(number) {
  return String(number).padStart(
    2,
    "0"
  );
}

function setText(element, value) {
  if (!element) {
    return;
  }

  element.textContent =
    String(value ?? "");
}

function bindNavigation() {
  if (
    !elements.menuButton ||
    !elements.navigation
  ) {
    return;
  }

  elements.menuButton.addEventListener(
    "click",
    () => {
      const isOpen =
        elements.navigation.classList.toggle(
          "is-open"
        );

      elements.menuButton.classList.toggle(
        "is-open",
        isOpen
      );

      elements.menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }
  );

  elements.navigation
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeNavigation
      );
    });

  document.addEventListener(
    "click",
    (event) => {
      const clickedNavigation =
        elements.navigation.contains(
          event.target
        );

      const clickedMenuButton =
        elements.menuButton.contains(
          event.target
        );

      if (
        !clickedNavigation &&
        !clickedMenuButton
      ) {
        closeNavigation();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 840) {
        closeNavigation();
      }
    }
  );
}

function closeNavigation() {
  if (
    !elements.menuButton ||
    !elements.navigation
  ) {
    return;
  }

  elements.navigation.classList.remove(
    "is-open"
  );

  elements.menuButton.classList.remove(
    "is-open"
  );

  elements.menuButton.setAttribute(
    "aria-expanded",
    "false"
  );
}

async function loadGames() {
  if (!elements.gameGrid) {
    return;
  }

  const results =
    await Promise.allSettled(
      GAME_DATA_FILES.map(
        (filePath) =>
          loadGameData(filePath)
      )
    );

  loadedGames = results
    .filter(
      (result) =>
        result.status === "fulfilled"
    )
    .map(
      (result) => result.value
    );

  const failedResults = results.filter(
    (result) =>
      result.status === "rejected"
  );

  if (loadedGames.length === 0) {
    renderLoadError(failedResults);
    updateGameCount(0);
    renderUpcomingProjects(0);

    return;
  }

  renderGameLibrary(loadedGames);

  renderUpcomingProjects(
    loadedGames.length
  );

  updateGameCount(
    loadedGames.length
  );

  failedResults.forEach((result) => {
    console.error(
      "部分遊戲資料載入失敗：",
      result.reason
    );
  });
}

async function loadGameData(filePath) {
  const response = await fetch(
    filePath,
    {
      cache: "no-cache"
    }
  );

  if (!response.ok) {
    throw new Error(
      `無法載入 ${filePath}，HTTP 狀態碼：${response.status}`
    );
  }

  const gameData =
    await response.json();

  validateGameData(
    gameData,
    filePath
  );

  return gameData;
}

function validateGameData(
  gameData,
  filePath
) {
  const requiredFields = [
    "id",
    "title",
    "status",
    "genre",
    "description"
  ];

  const missingFields =
    requiredFields.filter(
      (field) => !gameData[field]
    );

  if (missingFields.length > 0) {
    throw new Error(
      `${filePath} 缺少必要欄位：${missingFields.join(", ")}`
    );
  }
}

function updateGameCount(count) {
  if (!elements.gameCount) {
    return;
  }

  elements.gameCount.textContent =
    String(count).padStart(
      2,
      "0"
    );
}

function renderGameLibrary(games) {
  elements.gameGrid.innerHTML = "";

  games.forEach(
    (game, index) => {
      const card =
        createGameCard(
          game,
          index
        );

      elements.gameGrid.appendChild(
        card
      );
    }
  );

  renderCarouselDots();
}

function createGameCard(
  game,
  index
) {
  const article =
    document.createElement(
      "article"
    );

  const theme =
    getGameTheme(game);

  const projectNumber =
    formatProjectNumber(
      index + 1
    );

  const technologies =
    normalizeStringArray(
      game.technologies
    ).slice(0, 3);

  const hasCoverImage =
    isNonEmptyString(
      game.coverImage
    );

  const hasGameUrl =
    isValidHttpUrl(
      game.gameUrl
    );

  article.className =
    "game-card reveal-item";

  article.dataset.theme =
    theme.theme;

  article.dataset.gameIndex =
    String(index);

  article.style.setProperty(
    "--reveal-delay",
    `${index * 90}ms`
  );

  if (hasGameUrl) {
    article.classList.add(
      "is-playable"
    );

    article.setAttribute(
      "role",
      "link"
    );

    article.setAttribute(
      "tabindex",
      "0"
    );

    article.setAttribute(
      "aria-label",
      `進入遊戲：${game.title}`
    );
  }

  article.innerHTML = `
    <div class="game-card__artwork">
      <div
        class="game-card__visual"
        aria-hidden="true"
      >
        <span
          class="game-card__ring game-card__ring--outer"
        ></span>

        <span
          class="game-card__ring game-card__ring--inner"
        ></span>

        <span class="game-card__monogram">
          ${escapeHTML(theme.monogram)}
        </span>
      </div>

      ${
        hasCoverImage
          ? `
            <img
              class="game-card__cover"
              src="${escapeAttribute(game.coverImage)}"
              alt="${escapeAttribute(
                game.coverImageAlt ||
                game.title
              )}"
              loading="lazy"
            >
          `
          : ""
      }

      <div class="game-card__shade"></div>

      <div class="game-card__topline">
        <span class="game-card__project-number">
          PROJECT ${projectNumber}
        </span>

        <span class="game-card__status">
          ${escapeHTML(game.status)}
        </span>
      </div>

      <div class="game-card__art-footer">
        <span>
          ${escapeHTML(theme.label)}
        </span>
      </div>

      <div class="game-card__hover-actions">
        ${createPlayLink(
          game.gameUrl,
          "立即遊玩",
          "button button--primary"
        )}

        <button
          class="button button--glass js-open-details"
          type="button"
        >
          作品資訊
        </button>
      </div>
    </div>

    <div class="game-card__content">
      <div class="game-card__heading">
        <div>
          <p class="game-card__genre">
            ${escapeHTML(game.genre)}
          </p>

          <h3>
            ${escapeHTML(game.title)}
          </h3>
        </div>

        <span class="game-card__version">
          ${escapeHTML(
            game.progress || "DEMO"
          )}
        </span>
      </div>

      <p class="game-card__description">
        ${escapeHTML(
          game.shortDescription ||
          game.description
        )}
      </p>

      <ul
        class="technology-list"
        aria-label="使用技術"
      >
        ${technologies
          .map(
            (technology) =>
              `<li>${escapeHTML(technology)}</li>`
          )
          .join("")}
      </ul>

      <div class="game-card__footer">
        <button
          class="text-link js-open-details"
          type="button"
        >
          作品資訊

          <span aria-hidden="true"></span>
        </button>

        <span class="game-card__year">
          ${escapeHTML(
            game.releaseYear || "2026"
          )}
        </span>
      </div>
    </div>
  `;

  article
    .querySelectorAll(
      ".js-open-details"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          openGameModal(
            game,
            index,
            button
          );
        }
      );
    });

  article
    .querySelectorAll(
      "a, button"
    )
    .forEach(
      (interactiveElement) => {
        interactiveElement.addEventListener(
          "pointerdown",
          (event) => {
            event.stopPropagation();
          }
        );

        interactiveElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
          }
        );
      }
    );

  article.addEventListener(
    "click",
    (event) => {
      if (!hasGameUrl) {
        return;
      }

      if (carouselMoved) {
        carouselMoved = false;
        return;
      }

      if (
        event.target.closest(
          "a, button"
        )
      ) {
        return;
      }

      if (
        isMobileCarouselMode() &&
        !article.classList.contains(
          "is-carousel-active"
        )
      ) {
        return;
      }

      window.location.href =
        game.gameUrl;
    }
  );

  article.addEventListener(
    "keydown",
    (event) => {
      if (!hasGameUrl) {
        return;
      }

      if (
        event.target !== article
      ) {
        return;
      }

      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      if (
        isMobileCarouselMode() &&
        !article.classList.contains(
          "is-carousel-active"
        )
      ) {
        return;
      }

      event.preventDefault();

      window.location.href =
        game.gameUrl;
    }
  );

  const coverImage =
    article.querySelector(
      ".game-card__cover"
    );

  coverImage?.addEventListener(
    "error",
    () => {
      coverImage.remove();
    }
  );

  requestAnimationFrame(() => {
    article.classList.add(
      "is-visible"
    );
  });

  return article;
}

function createPlayLink(
  url,
  label,
  className
) {
  if (!isValidHttpUrl(url)) {
    return `
      <button
        class="${escapeAttribute(className)}"
        type="button"
        disabled
      >
        尚未開放
      </button>
    `;
  }

  return `
    <a
      class="${escapeAttribute(className)}"
      href="${escapeAttribute(url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHTML(label)}

      <span
        class="button__arrow"
        aria-hidden="true"
      ></span>
    </a>
  `;
}

function initializeMobileCarousel() {
  if (
    !elements.gameGrid ||
    loadedGames.length === 0
  ) {
    return;
  }

  if (!carouselBound) {
    bindCarouselEvents();
    carouselBound = true;
  }

  updateCarouselLayout();

  if (
    isMobileCarouselMode()
  ) {
    startCarousel();
  }
}

function bindCarouselEvents() {
  elements.gameGrid.addEventListener(
    "pointerdown",
    handleCarouselPointerDown
  );

  elements.gameGrid.addEventListener(
    "pointermove",
    handleCarouselPointerMove
  );

  elements.gameGrid.addEventListener(
    "pointerup",
    handleCarouselPointerUp
  );

  elements.gameGrid.addEventListener(
    "pointercancel",
    handleCarouselPointerCancel
  );

  window.addEventListener(
    "resize",
    handleCarouselResize
  );

  window.addEventListener(
    "orientationchange",
    handleCarouselResize
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
}

function handleCarouselPointerDown(
  event
) {
  if (!isMobileCarouselMode()) {
    return;
  }

  carouselPointerDown = true;
  carouselMoved = false;

  carouselStartX =
    event.clientX;

  carouselStartY =
    event.clientY;

  pauseCarousel();
}

function handleCarouselPointerMove(
  event
) {
  if (
    !carouselPointerDown ||
    !isMobileCarouselMode()
  ) {
    return;
  }

  const differenceX =
    event.clientX -
    carouselStartX;

  const differenceY =
    event.clientY -
    carouselStartY;

  if (
    Math.abs(differenceX) > 8 ||
    Math.abs(differenceY) > 8
  ) {
    carouselMoved = true;
  }
}

function handleCarouselPointerUp(
  event
) {
  if (
    !carouselPointerDown ||
    !isMobileCarouselMode()
  ) {
    return;
  }

  const differenceX =
    event.clientX -
    carouselStartX;

  const differenceY =
    event.clientY -
    carouselStartY;

  carouselPointerDown = false;

  if (
    Math.abs(differenceX) >=
      MOBILE_SWIPE_THRESHOLD &&
    Math.abs(differenceX) >
      Math.abs(differenceY)
  ) {
    if (differenceX < 0) {
      moveCarousel(1);
    } else {
      moveCarousel(-1);
    }
  }

  scheduleCarouselResume();

  window.setTimeout(() => {
    carouselMoved = false;
  }, 130);
}

function handleCarouselPointerCancel() {
  carouselPointerDown = false;
  carouselMoved = false;

  scheduleCarouselResume();
}

function handleCarouselResize() {
  updateCarouselLayout();

  if (
    isMobileCarouselMode()
  ) {
    startCarousel();
  } else {
    pauseCarousel();
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    pauseCarousel();
    return;
  }

  if (
    isMobileCarouselMode()
  ) {
    scheduleCarouselResume();
  }
}

function moveCarousel(direction) {
  const total =
    loadedGames.length;

  if (total <= 1) {
    return;
  }

  carouselIndex =
    normalizeIndex(
      carouselIndex + direction,
      total
    );

  updateCarouselLayout();
}

function updateCarouselLayout() {
  const cards =
    getCarouselCards();

  if (!isMobileCarouselMode()) {
    cards.forEach((card) => {
      card.classList.remove(
        "is-carousel-active",
        "is-carousel-prev",
        "is-carousel-next",
        "is-carousel-far-left",
        "is-carousel-far-right"
      );

      card.removeAttribute(
        "aria-current"
      );

      if (
        card.classList.contains(
          "is-playable"
        )
      ) {
        card.setAttribute(
          "tabindex",
          "0"
        );
      }

      card
        .querySelectorAll(
          "a, button"
        )
        .forEach((element) => {
          element.removeAttribute(
            "tabindex"
          );

          element.removeAttribute(
            "aria-hidden"
          );
        });
    });

    updateCarouselDots();
    return;
  }

  const total =
    cards.length;

  cards.forEach(
    (card, index) => {
      const offset =
        circularOffset(
          index,
          carouselIndex,
          total
        );

      const isActive =
        offset === 0;

      card.classList.toggle(
        "is-carousel-active",
        isActive
      );

      card.classList.toggle(
        "is-carousel-prev",
        offset === -1
      );

      card.classList.toggle(
        "is-carousel-next",
        offset === 1
      );

      card.classList.toggle(
        "is-carousel-far-left",
        offset < -1
      );

      card.classList.toggle(
        "is-carousel-far-right",
        offset > 1
      );

      card.setAttribute(
        "aria-current",
        isActive
          ? "true"
          : "false"
      );

      if (
        card.classList.contains(
          "is-playable"
        )
      ) {
        card.setAttribute(
          "tabindex",
          isActive
            ? "0"
            : "-1"
        );
      }

      card
        .querySelectorAll(
          "a, button"
        )
        .forEach((element) => {
          if (isActive) {
            element.removeAttribute(
              "tabindex"
            );

            element.removeAttribute(
              "aria-hidden"
            );
          } else {
            element.setAttribute(
              "tabindex",
              "-1"
            );

            element.setAttribute(
              "aria-hidden",
              "true"
            );
          }
        });
    }
  );

  updateCarouselDots();
}

function circularOffset(
  index,
  activeIndex,
  total
) {
  let difference =
    index - activeIndex;

  const half =
    total / 2;

  if (difference > half) {
    difference -= total;
  } else if (
    difference < -half
  ) {
    difference += total;
  }

  return difference;
}

function normalizeIndex(
  index,
  total
) {
  return (
    (index % total + total) %
    total
  );
}

function getCarouselCards() {
  return Array.from(
    elements.gameGrid
      ?.querySelectorAll(
        ".game-card"
      ) || []
  );
}

function renderCarouselDots() {
  if (!elements.carouselDots) {
    return;
  }

  elements.carouselDots.innerHTML =
    "";

  loadedGames.forEach(
    (game, index) => {
      const button =
        document.createElement(
          "button"
        );

      button.className =
        "carousel-dot";

      button.type =
        "button";

      button.setAttribute(
        "aria-label",
        `切換至 ${game.title}`
      );

      button.addEventListener(
        "click",
        () => {
          carouselIndex = index;

          updateCarouselLayout();
          scheduleCarouselResume();
        }
      );

      elements.carouselDots.appendChild(
        button
      );
    }
  );

  updateCarouselDots();
}

function updateCarouselDots() {
  elements.carouselDots
    ?.querySelectorAll(
      ".carousel-dot"
    )
    .forEach((dot, index) => {
      const isActive =
        index === carouselIndex;

      dot.classList.toggle(
        "is-active",
        isActive
      );

      dot.setAttribute(
        "aria-current",
        isActive
          ? "true"
          : "false"
      );
    });
}

function startCarousel() {
  pauseCarousel();

  if (
    !loaderFinished ||
    !isMobileCarouselMode() ||
    document.hidden ||
    loadedGames.length <= 1
  ) {
    return;
  }

  carouselTimer =
    window.setInterval(() => {
      moveCarousel(1);
    }, MOBILE_CAROUSEL_INTERVAL);
}

function pauseCarousel() {
  if (carouselTimer) {
    window.clearInterval(
      carouselTimer
    );

    carouselTimer = null;
  }

  if (carouselResumeTimer) {
    window.clearTimeout(
      carouselResumeTimer
    );

    carouselResumeTimer = null;
  }
}

function scheduleCarouselResume() {
  pauseCarousel();

  if (
    !isMobileCarouselMode()
  ) {
    return;
  }

  carouselResumeTimer =
    window.setTimeout(
      startCarousel,
      MOBILE_CAROUSEL_RESUME_DELAY
    );
}

function isMobileCarouselMode() {
  return (
    window.innerWidth <=
    MOBILE_CAROUSEL_BREAKPOINT
  );
}

function renderUpcomingProjects(
  currentGameCount
) {
  if (!elements.upcomingGrid) {
    return;
  }

  elements.upcomingGrid.innerHTML =
    "";

  for (
    let index = 1;
    index <=
      UPCOMING_PROJECT_COUNT;
    index += 1
  ) {
    const projectNumber =
      currentGameCount +
      index;

    const article =
      document.createElement(
        "article"
      );

    article.className =
      "upcoming-card reveal-item is-visible";

    article.style.setProperty(
      "--reveal-delay",
      `${index * 80}ms`
    );

    article.innerHTML = `
      <div class="upcoming-card__number">
        ${formatProjectNumber(projectNumber)}
      </div>

      <div
        class="upcoming-card__visual"
        aria-hidden="true"
      >
        <span></span>
        <span></span>
      </div>

      <div class="upcoming-card__content">
        <p>
          PROJECT SLOT
        </p>

        <h3>
          尚未解鎖
        </h3>

        <span>
          下一款遊戲開發完成後加入
        </span>
      </div>

      <div
        class="upcoming-card__lock"
        aria-hidden="true"
      ></div>
    `;

    elements.upcomingGrid.appendChild(
      article
    );
  }
}

function bindModal() {
  if (
    !elements.modalBackdrop ||
    !elements.modalClose
  ) {
    return;
  }

  elements.modalClose.addEventListener(
    "click",
    closeGameModal
  );

  elements.modalBackdrop.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.modalBackdrop
      ) {
        closeGameModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        elements.modalBackdrop.hidden
      ) {
        return;
      }

      if (event.key === "Escape") {
        closeGameModal();
      }

      if (event.key === "Tab") {
        trapModalFocus(event);
      }
    }
  );
}

function openGameModal(
  game,
  index,
  triggerElement
) {
  if (
    !elements.modalBackdrop ||
    !elements.modalPanel
  ) {
    return;
  }

  pauseCarousel();

  if (modalCloseTimer) {
    window.clearTimeout(
      modalCloseTimer
    );

    modalCloseTimer = null;
  }

  const theme =
    getGameTheme(game);

  const projectNumber =
    formatProjectNumber(
      index + 1
    );

  lastFocusedElement =
    triggerElement ||
    document.activeElement;

  elements.modalPanel.dataset.theme =
    theme.theme;

  setText(
    elements.modalProjectNumber,
    `PROJECT ${projectNumber}`
  );

  setText(
    elements.modalThemeLabel,
    theme.label
  );

  setText(
    elements.modalMonogram,
    theme.monogram
  );

  setText(
    elements.modalStatus,
    game.status || "PROJECT"
  );

  setText(
    elements.modalTitle,
    game.title
  );

  setText(
    elements.modalDescription,
    game.description
  );

  setText(
    elements.modalGenre,
    game.genre || "未設定"
  );

  setText(
    elements.modalProgress,
    game.progress || "未設定"
  );

  setText(
    elements.modalYear,
    game.releaseYear || "未設定"
  );

  renderTechnologyList(
    game.technologies
  );

  renderSimpleList(
    elements.modalFeatures,
    game.features,
    "作品內容整理中"
  );

  renderControlList(
    game.controls
  );

  renderSimpleList(
    elements.modalResponsibilities,
    game.responsibilities,
    "開發內容整理中"
  );

  configureModalArtwork(game);

  configureModalLink(
    elements.modalPlayButton,
    game.gameUrl
  );

  configureModalLink(
    elements.modalRepositoryButton,
    game.repositoryUrl
  );

  elements.modalBackdrop.hidden =
    false;

  requestAnimationFrame(() => {
    elements.modalBackdrop.classList.add(
      "is-open"
    );

    elements.body.classList.add(
      "modal-open"
    );
  });

  elements.modalClose.focus();
}

function closeGameModal() {
  if (!elements.modalBackdrop) {
    return;
  }

  elements.modalBackdrop.classList.remove(
    "is-open"
  );

  elements.body.classList.remove(
    "modal-open"
  );

  modalCloseTimer =
    window.setTimeout(() => {
      elements.modalBackdrop.hidden =
        true;

      if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus ===
          "function"
      ) {
        lastFocusedElement.focus();
      }

      if (
        isMobileCarouselMode()
      ) {
        scheduleCarouselResume();
      }
    }, 280);
}

function configureModalArtwork(game) {
  if (
    !elements.modalArtwork ||
    !elements.modalCoverImage
  ) {
    return;
  }

  const hasCoverImage =
    isNonEmptyString(
      game.coverImage
    );

  elements.modalArtwork.classList.toggle(
    "has-cover",
    hasCoverImage
  );

  elements.modalCoverImage.hidden =
    !hasCoverImage;

  elements.modalCoverImage.removeAttribute(
    "src"
  );

  elements.modalCoverImage.alt = "";
  elements.modalCoverImage.onerror = null;

  if (!hasCoverImage) {
    return;
  }

  elements.modalCoverImage.src =
    game.coverImage;

  elements.modalCoverImage.alt =
    game.coverImageAlt ||
    `${game.title} 遊戲封面`;

  elements.modalCoverImage.onerror =
    () => {
      elements.modalCoverImage.hidden =
        true;

      elements.modalArtwork.classList.remove(
        "has-cover"
      );
    };
}

function configureModalLink(
  element,
  url
) {
  if (!element) {
    return;
  }

  const isAvailable =
    isValidHttpUrl(url);

  element.classList.toggle(
    "is-disabled",
    !isAvailable
  );

  element.setAttribute(
    "aria-disabled",
    String(!isAvailable)
  );

  if (isAvailable) {
    element.href = url;
    element.target = "_blank";
    element.rel =
      "noopener noreferrer";

    element.onclick = null;
    return;
  }

  element.href = "#";

  element.removeAttribute(
    "target"
  );

  element.removeAttribute(
    "rel"
  );

  element.onclick = (event) => {
    event.preventDefault();
  };
}

function trapModalFocus(event) {
  if (!elements.modalPanel) {
    return;
  }

  const focusableElements =
    Array.from(
      elements.modalPanel.querySelectorAll(
        'a[href]:not(.is-disabled), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

  if (
    focusableElements.length === 0
  ) {
    return;
  }

  const firstElement =
    focusableElements[0];

  const lastElement =
    focusableElements[
      focusableElements.length - 1
    ];

  if (
    event.shiftKey &&
    document.activeElement ===
      firstElement
  ) {
    event.preventDefault();

    lastElement.focus();
    return;
  }

  if (
    !event.shiftKey &&
    document.activeElement ===
      lastElement
  ) {
    event.preventDefault();

    firstElement.focus();
  }
}

function renderTechnologyList(
  technologies
) {
  if (!elements.modalTechnologies) {
    return;
  }

  const items =
    normalizeStringArray(
      technologies
    );

  elements.modalTechnologies.innerHTML =
    "";

  const safeItems =
    items.length > 0
      ? items
      : ["未設定"];

  safeItems.forEach(
    (technology) => {
      const item =
        document.createElement(
          "li"
        );

      item.textContent =
        technology;

      elements.modalTechnologies.appendChild(
        item
      );
    }
  );
}

function renderSimpleList(
  container,
  values,
  fallbackText
) {
  if (!container) {
    return;
  }

  const items =
    normalizeStringArray(values);

  container.innerHTML = "";

  const safeItems =
    items.length > 0
      ? items
      : [fallbackText];

  safeItems.forEach((value) => {
    const item =
      document.createElement(
        "li"
      );

    item.textContent = value;

    container.appendChild(item);
  });
}

function renderControlList(
  controls
) {
  if (!elements.modalControls) {
    return;
  }

  elements.modalControls.innerHTML =
    "";

  if (
    !Array.isArray(controls) ||
    controls.length === 0
  ) {
    const item =
      document.createElement(
        "li"
      );

    item.innerHTML =
      "<span>操作方式整理中</span>";

    elements.modalControls.appendChild(
      item
    );

    return;
  }

  controls.forEach((control) => {
    const item =
      document.createElement(
        "li"
      );

    const key =
      document.createElement(
        "kbd"
      );

    const action =
      document.createElement(
        "span"
      );

    key.textContent =
      control?.key || "—";

    action.textContent =
      control?.action ||
      "未設定";

    item.append(
      key,
      action
    );

    elements.modalControls.appendChild(
      item
    );
  });
}

function initializeRevealAnimations() {
  const revealElements =
    document.querySelectorAll(
      "[data-reveal]"
    );

  if (
    !(
      "IntersectionObserver" in
      window
    ) ||
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    revealElements.forEach(
      (element) => {
        element.classList.add(
          "is-visible"
        );
      }
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          }
        );
      },
      {
        threshold: 0.12
      }
    );

  revealElements.forEach(
    (element) => {
      observer.observe(element);
    }
  );
}

function renderLoadError(
  failedResults
) {
  const errorMessage =
    failedResults
      .map(
        (result) =>
          result.reason?.message
      )
      .filter(Boolean)
      .join("；");

  elements.gameGrid.innerHTML = `
    <article class="load-error">
      <p>
        LIBRARY ERROR
      </p>

      <h2>
        遊戲資料載入失敗
      </h2>

      <p>
        請確認 JSON 檔案名稱、
        路徑與格式。
      </p>

      <code>
        ${escapeHTML(
          errorMessage ||
          "未知錯誤"
        )}
      </code>
    </article>
  `;
}

function getGameTheme(game) {
  return (
    GAME_THEMES[game.id] || {
      theme: "default",
      label:
        "INDEPENDENT PROJECT",
      monogram:
        getMonogram(game.title)
    }
  );
}

function getMonogram(title) {
  const normalizedTitle =
    String(
      title || "GAME"
    ).trim();

  const words =
    normalizedTitle
      .split(/\s+/)
      .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return normalizedTitle
    .slice(0, 2)
    .toUpperCase();
}

function normalizeStringArray(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isNonEmptyString)
    .map(
      (item) => item.trim()
    );
}

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.trim() !== ""
  );
}

function isValidHttpUrl(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}
