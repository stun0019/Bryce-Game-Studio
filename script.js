"use strict";

/* =========================================================
   Bryce Game Studio
   Game Lobby V0.5
   Infinite Mobile Coverflow
   ========================================================= */

const GAME_DATA_FILES = [
  "./games/hooded-escape.json",
  "./games/Gomoku-Magic.json",
  "./games/game-cook.json"
];

const UPCOMING_PROJECT_COUNT = 3;

const MOBILE_CAROUSEL_BREAKPOINT = 650;
const MOBILE_CAROUSEL_INTERVAL = 4200;
const MOBILE_CAROUSEL_RESUME_DELAY = 5500;
const MOBILE_CAROUSEL_SETTLE_DELAY = 150;
const MOBILE_CAROUSEL_ANIMATION_TIME = 520;

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
  }
};

const elements = {
  body: document.body,

  gameGrid: document.getElementById("gameGrid"),
  gameCount: document.getElementById("gameCount"),
  currentYear: document.getElementById("currentYear"),

  upcomingGrid: document.getElementById("upcomingGrid"),

  menuButton: document.getElementById("menuButton"),
  navigation: document.getElementById("mainNavigation"),

  modalBackdrop: document.getElementById("gameModal"),
  modalPanel: document.querySelector(".project-modal"),
  modalClose: document.getElementById("modalClose"),

  modalArtwork: document.getElementById("modalArtwork"),
  modalCoverImage: document.getElementById("modalCoverImage"),
  modalMonogram: document.getElementById("modalMonogram"),

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
  modalProgress: document.getElementById("modalProgress"),
  modalYear: document.getElementById("modalYear"),

  modalTechnologies: document.getElementById(
    "modalTechnologies"
  ),

  modalFeatures: document.getElementById("modalFeatures"),
  modalControls: document.getElementById("modalControls"),

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

let mobileCarouselTimer = null;
let mobileCarouselResumeTimer = null;
let mobileCarouselScrollTimer = null;
let mobileCarouselAnimationTimer = null;

let mobileCarouselBound = false;
let mobileCarouselPointerDown = false;
let mobileCarouselDragging = false;
let mobileCarouselIsAnimating = false;
let mobileCarouselPrepared = false;

let mobileCarouselPointerStartX = 0;
let mobileCarouselPointerStartY = 0;

window.addEventListener(
  "DOMContentLoaded",
  initializeStudio
);

async function initializeStudio() {
  setCurrentYear();
  bindNavigation();
  bindModal();
  initializeRevealAnimations();

  await loadGames();
}

function setCurrentYear() {
  if (!elements.currentYear) {
    return;
  }

  elements.currentYear.textContent = String(
    new Date().getFullYear()
  );
}

function formatProjectNumber(number) {
  return String(number).padStart(2, "0");
}

function setText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = String(value ?? "");
}

function bindNavigation() {
  if (!elements.menuButton || !elements.navigation) {
    return;
  }

  elements.menuButton.addEventListener("click", () => {
    const isOpen = elements.navigation.classList.toggle(
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
  });

  elements.navigation
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeNavigation
      );
    });

  document.addEventListener("click", (event) => {
    const clickedNavigation =
      elements.navigation.contains(event.target);

    const clickedMenuButton =
      elements.menuButton.contains(event.target);

    if (!clickedNavigation && !clickedMenuButton) {
      closeNavigation();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 840) {
      closeNavigation();
    }
  });
}

function closeNavigation() {
  if (!elements.menuButton || !elements.navigation) {
    return;
  }

  elements.navigation.classList.remove("is-open");
  elements.menuButton.classList.remove("is-open");

  elements.menuButton.setAttribute(
    "aria-expanded",
    "false"
  );
}

async function loadGames() {
  if (!elements.gameGrid) {
    return;
  }

  const results = await Promise.allSettled(
    GAME_DATA_FILES.map((filePath) =>
      loadGameData(filePath)
    )
  );

  loadedGames = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (loadedGames.length === 0) {
    renderLoadError(failedResults);
    updateGameCount(0);
    renderUpcomingProjects(0);

    return;
  }

  renderGameLibrary(loadedGames);
  renderUpcomingProjects(loadedGames.length);
  updateGameCount(loadedGames.length);

  failedResults.forEach((result) => {
    console.error(
      "部分遊戲資料載入失敗：",
      result.reason
    );
  });
}

async function loadGameData(filePath) {
  const response = await fetch(filePath, {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(
      `無法載入 ${filePath}，HTTP 狀態碼：${response.status}`
    );
  }

  const gameData = await response.json();

  validateGameData(gameData, filePath);

  return gameData;
}

function validateGameData(gameData, filePath) {
  const requiredFields = [
    "id",
    "title",
    "status",
    "genre",
    "description"
  ];

  const missingFields = requiredFields.filter(
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

  elements.gameCount.textContent = String(count).padStart(
    2,
    "0"
  );
}

function renderGameLibrary(games) {
  elements.gameGrid.innerHTML = "";

  games.forEach((game, index) => {
    const gameCard = createGameCard(game, index);

    elements.gameGrid.appendChild(gameCard);
  });

  initializeMobileCarousel();
}

function createGameCard(game, index) {
  const article = document.createElement("article");

  const theme = getGameTheme(game);
  const projectNumber = formatProjectNumber(index + 1);

  const technologies = normalizeStringArray(
    game.technologies
  ).slice(0, 3);

  const hasCoverImage = isNonEmptyString(
    game.coverImage
  );

  const hasGameUrl = isValidHttpUrl(
    game.gameUrl
  );

  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerMoved = false;

  article.className = "game-card reveal-item";
  article.dataset.theme = theme.theme;
  article.dataset.gameIndex = String(index);

  article.style.setProperty(
    "--reveal-delay",
    `${index * 90}ms`
  );

  if (hasGameUrl) {
    article.classList.add("is-playable");

    article.setAttribute("role", "link");
    article.setAttribute("tabindex", "0");

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
        <span class="game-card__ring game-card__ring--outer"></span>
        <span class="game-card__ring game-card__ring--inner"></span>

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
                game.coverImageAlt || game.title
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
          ${escapeHTML(game.progress || "DEMO")}
        </span>
      </div>

      <p class="game-card__description">
        ${escapeHTML(
          game.shortDescription || game.description
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
          ${escapeHTML(game.releaseYear || "2026")}
        </span>
      </div>
    </div>
  `;

  article
    .querySelectorAll(".js-open-details")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        openGameModal(game, index, button);
      });
    });

  article
    .querySelectorAll("a, button")
    .forEach((interactiveElement) => {
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
    });

  article.addEventListener(
    "pointerdown",
    (event) => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
    }
  );

  article.addEventListener(
    "pointermove",
    (event) => {
      const movementX = Math.abs(
        event.clientX - pointerStartX
      );

      const movementY = Math.abs(
        event.clientY - pointerStartY
      );

      if (movementX > 10 || movementY > 10) {
        pointerMoved = true;
      }
    }
  );

  article.addEventListener("click", (event) => {
    if (!hasGameUrl) {
      return;
    }

    if (pointerMoved || mobileCarouselDragging) {
      pointerMoved = false;

      return;
    }

    if (event.target.closest("a, button")) {
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

    window.location.href = game.gameUrl;
  });

  article.addEventListener(
    "keydown",
    (event) => {
      if (!hasGameUrl) {
        return;
      }

      if (event.target !== article) {
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

      window.location.href = game.gameUrl;
    }
  );

  const coverImage = article.querySelector(
    ".game-card__cover"
  );

  if (coverImage) {
    coverImage.addEventListener("error", () => {
      coverImage.remove();
    });
  }

  requestAnimationFrame(() => {
    article.classList.add("is-visible");
  });

  return article;
}

function createPlayLink(url, label, className) {
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
  if (!elements.gameGrid) {
    return;
  }

  clearMobileCarouselTimers();

  if (!mobileCarouselBound) {
    bindMobileCarouselEvents();
    mobileCarouselBound = true;
  }

  if (!isMobileCarouselMode()) {
    restoreOriginalCardOrder();
    resetMobileCarouselState();

    mobileCarouselPrepared = false;

    return;
  }

  prepareInfiniteCarousel();

  requestAnimationFrame(() => {
    centerMiddleCarouselCard(false);
    updateMobileCarouselState();
    startMobileCarousel();
  });
}

function bindMobileCarouselEvents() {
  elements.gameGrid.addEventListener(
    "scroll",
    handleMobileCarouselScroll,
    {
      passive: true
    }
  );

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
    handleCarouselPointerEnd
  );

  elements.gameGrid.addEventListener(
    "pointercancel",
    handleCarouselPointerEnd
  );

  elements.gameGrid.addEventListener(
    "touchstart",
    pauseMobileCarousel,
    {
      passive: true
    }
  );

  elements.gameGrid.addEventListener(
    "touchend",
    scheduleCarouselSettle,
    {
      passive: true
    }
  );

  elements.gameGrid.addEventListener(
    "focusin",
    pauseMobileCarousel
  );

  elements.gameGrid.addEventListener(
    "focusout",
    () => {
      if (isMobileCarouselMode()) {
        scheduleMobileCarouselResume();
      }
    }
  );

  window.addEventListener(
    "resize",
    handleMobileCarouselResize
  );

  window.addEventListener(
    "orientationchange",
    handleMobileCarouselResize
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        pauseMobileCarousel();

        return;
      }

      if (isMobileCarouselMode()) {
        scheduleMobileCarouselResume();
      }
    }
  );
}

function prepareInfiniteCarousel() {
  const cards = getMobileCarouselCards();

  if (cards.length <= 1) {
    mobileCarouselPrepared = true;
    updateMobileCarouselState();

    return;
  }

  if (mobileCarouselPrepared) {
    centerMiddleCarouselCard(false);

    return;
  }

  restoreOriginalCardOrder();

  const orderedCards = getMobileCarouselCards();

  const lastCard =
    orderedCards[orderedCards.length - 1];

  elements.gameGrid.insertBefore(
    lastCard,
    orderedCards[0]
  );

  mobileCarouselPrepared = true;
}

function restoreOriginalCardOrder() {
  const cards = getMobileCarouselCards();

  cards
    .sort(
      (firstCard, secondCard) =>
        Number(firstCard.dataset.gameIndex) -
        Number(secondCard.dataset.gameIndex)
    )
    .forEach((card) => {
      elements.gameGrid.appendChild(card);
    });
}

function handleCarouselPointerDown(event) {
  if (!isMobileCarouselMode()) {
    return;
  }

  mobileCarouselPointerDown = true;
  mobileCarouselDragging = false;

  mobileCarouselPointerStartX = event.clientX;
  mobileCarouselPointerStartY = event.clientY;

  pauseMobileCarousel();
}

function handleCarouselPointerMove(event) {
  if (
    !isMobileCarouselMode() ||
    !mobileCarouselPointerDown
  ) {
    return;
  }

  const movementX = Math.abs(
    event.clientX - mobileCarouselPointerStartX
  );

  const movementY = Math.abs(
    event.clientY - mobileCarouselPointerStartY
  );

  if (movementX > 8 || movementY > 8) {
    mobileCarouselDragging = true;
  }
}

function handleCarouselPointerEnd() {
  if (!isMobileCarouselMode()) {
    return;
  }

  mobileCarouselPointerDown = false;

  scheduleCarouselSettle();

  window.setTimeout(() => {
    mobileCarouselDragging = false;
  }, 120);
}

function handleMobileCarouselScroll() {
  if (!isMobileCarouselMode()) {
    return;
  }

  updateMobileCarouselState();

  window.clearTimeout(
    mobileCarouselScrollTimer
  );

  mobileCarouselScrollTimer =
    window.setTimeout(() => {
      if (
        !mobileCarouselPointerDown &&
        !mobileCarouselIsAnimating
      ) {
        settleInfiniteCarousel();
      }
    }, MOBILE_CAROUSEL_SETTLE_DELAY);
}

function scheduleCarouselSettle() {
  if (!isMobileCarouselMode()) {
    return;
  }

  window.clearTimeout(
    mobileCarouselScrollTimer
  );

  mobileCarouselScrollTimer =
    window.setTimeout(() => {
      settleInfiniteCarousel();
      scheduleMobileCarouselResume();
    }, MOBILE_CAROUSEL_SETTLE_DELAY);
}

function settleInfiniteCarousel() {
  const cards = getMobileCarouselCards();

  if (
    !isMobileCarouselMode() ||
    cards.length <= 1 ||
    mobileCarouselIsAnimating
  ) {
    return;
  }

  const closestIndex =
    getClosestCarouselDomIndex();

  if (closestIndex === 0) {
    rotateCarouselBackward();
    centerMiddleCarouselCard(false);
    updateMobileCarouselState();

    return;
  }

  if (closestIndex >= 2) {
    rotateCarouselForward();
    centerMiddleCarouselCard(false);
    updateMobileCarouselState();

    return;
  }

  centerMiddleCarouselCard(true);
}

function rotateCarouselForward() {
  const firstCard =
    elements.gameGrid.firstElementChild;

  if (!firstCard) {
    return;
  }

  elements.gameGrid.appendChild(firstCard);
}

function rotateCarouselBackward() {
  const lastCard =
    elements.gameGrid.lastElementChild;

  const firstCard =
    elements.gameGrid.firstElementChild;

  if (!lastCard || !firstCard) {
    return;
  }

  elements.gameGrid.insertBefore(
    lastCard,
    firstCard
  );
}

function centerMiddleCarouselCard(smooth = false) {
  const cards = getMobileCarouselCards();

  if (cards.length === 0) {
    return;
  }

  const middleIndex =
    cards.length > 1 ? 1 : 0;

  scrollToCarouselCard(
    cards[middleIndex],
    smooth
  );
}

function scrollToCarouselCard(
  card,
  smooth = true
) {
  if (
    !card ||
    !isMobileCarouselMode()
  ) {
    return;
  }

  const gridRect =
    elements.gameGrid.getBoundingClientRect();

  const cardRect =
    card.getBoundingClientRect();

  const targetScrollLeft =
    elements.gameGrid.scrollLeft +
    cardRect.left -
    gridRect.left -
    (gridRect.width - cardRect.width) / 2;

  if (!smooth) {
    elements.gameGrid.scrollLeft =
      targetScrollLeft;

    requestAnimationFrame(
      updateMobileCarouselState
    );

    return;
  }

  mobileCarouselIsAnimating = true;

  elements.gameGrid.scrollTo({
    left: targetScrollLeft,
    behavior: "smooth"
  });

  window.clearTimeout(
    mobileCarouselAnimationTimer
  );

  mobileCarouselAnimationTimer =
    window.setTimeout(() => {
      mobileCarouselIsAnimating = false;

      settleInfiniteCarousel();
    }, MOBILE_CAROUSEL_ANIMATION_TIME);
}

function advanceMobileCarousel() {
  const cards = getMobileCarouselCards();

  if (
    !isMobileCarouselMode() ||
    cards.length <= 1 ||
    mobileCarouselPointerDown ||
    mobileCarouselIsAnimating
  ) {
    return;
  }

  const nextCard = cards[2];

  if (!nextCard) {
    return;
  }

  mobileCarouselIsAnimating = true;

  const gridRect =
    elements.gameGrid.getBoundingClientRect();

  const cardRect =
    nextCard.getBoundingClientRect();

  const targetScrollLeft =
    elements.gameGrid.scrollLeft +
    cardRect.left -
    gridRect.left -
    (gridRect.width - cardRect.width) / 2;

  elements.gameGrid.scrollTo({
    left: targetScrollLeft,
    behavior: "smooth"
  });

  window.clearTimeout(
    mobileCarouselAnimationTimer
  );

  mobileCarouselAnimationTimer =
    window.setTimeout(() => {
      rotateCarouselForward();
      centerMiddleCarouselCard(false);

      mobileCarouselIsAnimating = false;

      updateMobileCarouselState();
    }, MOBILE_CAROUSEL_ANIMATION_TIME);
}

function getClosestCarouselDomIndex() {
  const cards = getMobileCarouselCards();

  if (cards.length === 0) {
    return 0;
  }

  const gridRect =
    elements.gameGrid.getBoundingClientRect();

  const gridCenter =
    gridRect.left + gridRect.width / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  cards.forEach((card, index) => {
    const cardRect =
      card.getBoundingClientRect();

    const cardCenter =
      cardRect.left + cardRect.width / 2;

    const distance = Math.abs(
      gridCenter - cardCenter
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function updateMobileCarouselState() {
  const cards = getMobileCarouselCards();

  if (!isMobileCarouselMode()) {
    resetMobileCarouselState();

    return;
  }

  if (cards.length === 0) {
    return;
  }

  const gridRect =
    elements.gameGrid.getBoundingClientRect();

  const gridCenter =
    gridRect.left + gridRect.width / 2;

  let closestCard = cards[0];
  let closestDistance = Infinity;

  cards.forEach((card) => {
    const cardRect =
      card.getBoundingClientRect();

    const cardCenter =
      cardRect.left + cardRect.width / 2;

    const signedDistance =
      cardCenter - gridCenter;

    const absoluteDistance =
      Math.abs(signedDistance);

    const normalizedDistance = Math.min(
      absoluteDistance /
        Math.max(cardRect.width, 1),
      1.4
    );

    card.style.setProperty(
      "--carousel-distance",
      String(normalizedDistance)
    );

    card.classList.toggle(
      "is-carousel-left",
      signedDistance < -2
    );

    card.classList.toggle(
      "is-carousel-right",
      signedDistance > 2
    );

    if (absoluteDistance < closestDistance) {
      closestDistance = absoluteDistance;
      closestCard = card;
    }
  });

  cards.forEach((card) => {
    const isActive =
      card === closestCard;

    card.classList.toggle(
      "is-carousel-active",
      isActive
    );

    card.setAttribute(
      "aria-current",
      isActive ? "true" : "false"
    );

    setCardInteractiveState(
      card,
      isActive
    );
  });
}

function setCardInteractiveState(card, isActive) {
  const interactiveElements =
    card.querySelectorAll(
      "a, button"
    );

  interactiveElements.forEach((element) => {
    if (isActive) {
      element.removeAttribute("tabindex");
      element.removeAttribute("aria-hidden");

      return;
    }

    element.setAttribute("tabindex", "-1");
    element.setAttribute("aria-hidden", "true");
  });

  if (card.classList.contains("is-playable")) {
    card.setAttribute(
      "tabindex",
      isActive ? "0" : "-1"
    );
  }
}

function resetMobileCarouselState() {
  getMobileCarouselCards().forEach((card) => {
    card.classList.remove(
      "is-carousel-active",
      "is-carousel-left",
      "is-carousel-right"
    );

    card.style.removeProperty(
      "--carousel-distance"
    );

    card.removeAttribute(
      "aria-current"
    );

    if (card.classList.contains("is-playable")) {
      card.setAttribute(
        "tabindex",
        "0"
      );
    }

    card
      .querySelectorAll("a, button")
      .forEach((element) => {
        element.removeAttribute("tabindex");
        element.removeAttribute("aria-hidden");
      });
  });
}

function getMobileCarouselCards() {
  if (!elements.gameGrid) {
    return [];
  }

  return Array.from(
    elements.gameGrid.querySelectorAll(
      ".game-card"
    )
  );
}

function isMobileCarouselMode() {
  return (
    window.innerWidth <=
    MOBILE_CAROUSEL_BREAKPOINT
  );
}

function startMobileCarousel() {
  pauseMobileCarousel();

  if (
    !isMobileCarouselMode() ||
    document.hidden ||
    getMobileCarouselCards().length <= 1
  ) {
    return;
  }

  mobileCarouselTimer =
    window.setInterval(
      advanceMobileCarousel,
      MOBILE_CAROUSEL_INTERVAL
    );
}

function pauseMobileCarousel() {
  if (mobileCarouselTimer) {
    window.clearInterval(
      mobileCarouselTimer
    );

    mobileCarouselTimer = null;
  }

  if (mobileCarouselResumeTimer) {
    window.clearTimeout(
      mobileCarouselResumeTimer
    );

    mobileCarouselResumeTimer = null;
  }
}

function scheduleMobileCarouselResume() {
  pauseMobileCarousel();

  if (!isMobileCarouselMode()) {
    return;
  }

  mobileCarouselResumeTimer =
    window.setTimeout(
      startMobileCarousel,
      MOBILE_CAROUSEL_RESUME_DELAY
    );
}

function clearMobileCarouselTimers() {
  pauseMobileCarousel();

  window.clearTimeout(
    mobileCarouselScrollTimer
  );

  window.clearTimeout(
    mobileCarouselAnimationTimer
  );

  mobileCarouselScrollTimer = null;
  mobileCarouselAnimationTimer = null;

  mobileCarouselIsAnimating = false;
}

function handleMobileCarouselResize() {
  window.clearTimeout(
    mobileCarouselScrollTimer
  );

  mobileCarouselScrollTimer =
    window.setTimeout(() => {
      clearMobileCarouselTimers();

      if (!isMobileCarouselMode()) {
        restoreOriginalCardOrder();
        resetMobileCarouselState();

        mobileCarouselPrepared = false;

        return;
      }

      mobileCarouselPrepared = false;

      prepareInfiniteCarousel();
      centerMiddleCarouselCard(false);
      updateMobileCarouselState();
      startMobileCarousel();
    }, 180);
}

function renderUpcomingProjects(currentGameCount) {
  if (!elements.upcomingGrid) {
    return;
  }

  elements.upcomingGrid.innerHTML = "";

  for (
    let index = 1;
    index <= UPCOMING_PROJECT_COUNT;
    index += 1
  ) {
    const projectNumber =
      currentGameCount + index;

    const article =
      document.createElement("article");

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
        <p>PROJECT SLOT</p>
        <h3>尚未解鎖</h3>
        <span>下一款遊戲開發完成後加入</span>
      </div>

      <div
        class="upcoming-card__lock"
        aria-hidden="true"
      ></div>
    `;

    elements.upcomingGrid.appendChild(article);
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
      if (event.target === elements.modalBackdrop) {
        closeGameModal();
      }
    }
  );

  document.addEventListener("keydown", (event) => {
    if (elements.modalBackdrop.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeGameModal();
    }

    if (event.key === "Tab") {
      trapModalFocus(event);
    }
  });
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

  pauseMobileCarousel();

  if (modalCloseTimer) {
    window.clearTimeout(modalCloseTimer);
    modalCloseTimer = null;
  }

  const theme = getGameTheme(game);

  const projectNumber =
    formatProjectNumber(index + 1);

  lastFocusedElement =
    triggerElement || document.activeElement;

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

  elements.modalBackdrop.hidden = false;

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

  modalCloseTimer = window.setTimeout(() => {
    elements.modalBackdrop.hidden = true;

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === "function"
    ) {
      lastFocusedElement.focus();
    }

    if (isMobileCarouselMode()) {
      scheduleMobileCarouselResume();
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

  const hasCoverImage = isNonEmptyString(
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

  elements.modalCoverImage.onerror = () => {
    elements.modalCoverImage.hidden = true;

    elements.modalArtwork.classList.remove(
      "has-cover"
    );
  };
}

function configureModalLink(element, url) {
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
    element.rel = "noopener noreferrer";
    element.onclick = null;

    return;
  }

  element.href = "#";
  element.removeAttribute("target");
  element.removeAttribute("rel");

  element.onclick = (event) => {
    event.preventDefault();
  };
}

function trapModalFocus(event) {
  if (!elements.modalPanel) {
    return;
  }

  const focusableElements = Array.from(
    elements.modalPanel.querySelectorAll(
      'a[href]:not(.is-disabled), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

  if (focusableElements.length === 0) {
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
    document.activeElement === firstElement
  ) {
    event.preventDefault();
    lastElement.focus();

    return;
  }

  if (
    !event.shiftKey &&
    document.activeElement === lastElement
  ) {
    event.preventDefault();
    firstElement.focus();
  }
}

function renderTechnologyList(technologies) {
  if (!elements.modalTechnologies) {
    return;
  }

  const items =
    normalizeStringArray(technologies);

  elements.modalTechnologies.innerHTML = "";

  const safeItems =
    items.length > 0
      ? items
      : ["未設定"];

  safeItems.forEach((technology) => {
    const item =
      document.createElement("li");

    item.textContent = technology;

    elements.modalTechnologies.appendChild(
      item
    );
  });
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
      document.createElement("li");

    item.textContent = value;

    container.appendChild(item);
  });
}

function renderControlList(controls) {
  if (!elements.modalControls) {
    return;
  }

  elements.modalControls.innerHTML = "";

  if (
    !Array.isArray(controls) ||
    controls.length === 0
  ) {
    const item =
      document.createElement("li");

    item.innerHTML =
      "<span>操作方式整理中</span>";

    elements.modalControls.appendChild(
      item
    );

    return;
  }

  controls.forEach((control) => {
    const item =
      document.createElement("li");

    const key =
      document.createElement("kbd");

    const action =
      document.createElement("span");

    key.textContent =
      control?.key || "—";

    action.textContent =
      control?.action || "未設定";

    item.append(key, action);

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
    !("IntersectionObserver" in window) ||
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add(
          "is-visible"
        );

        observer.unobserve(
          entry.target
        );
      });
    },
    {
      threshold: 0.12
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

function renderLoadError(failedResults) {
  const errorMessage = failedResults
    .map((result) => result.reason?.message)
    .filter(Boolean)
    .join("；");

  elements.gameGrid.innerHTML = `
    <article class="load-error">
      <p class="load-error__label">
        LIBRARY ERROR
      </p>

      <h2>
        遊戲資料載入失敗
      </h2>

      <p>
        請確認 JSON 檔案名稱、路徑與格式。
      </p>

      <code>
        ${escapeHTML(errorMessage || "未知錯誤")}
      </code>
    </article>
  `;
}

function getGameTheme(game) {
  return (
    GAME_THEMES[game.id] || {
      theme: "default",
      label: "INDEPENDENT PROJECT",
      monogram: getMonogram(game.title)
    }
  );
}

function getMonogram(title) {
  const normalizedTitle = String(
    title || "GAME"
  ).trim();

  const words = normalizedTitle
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return normalizedTitle
    .slice(0, 2)
    .toUpperCase();
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isNonEmptyString)
    .map((item) => item.trim());
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
    const url = new URL(value);

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
