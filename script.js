"use strict";

/* =========================================================
   Bryce Game Studio
   Game Lobby V0.3
   ========================================================= */

const GAME_DATA_FILES = [
  "./games/hooded-escape.json",
  "./games/Gomoku-Magic.json",
  "./games/game-cook.json"
];

const UPCOMING_PROJECT_COUNT = 3;

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
  modalProjectNumber: document.getElementById("modalProjectNumber"),
  modalThemeLabel: document.getElementById("modalThemeLabel"),

  modalStatus: document.getElementById("modalStatus"),
  modalTitle: document.getElementById("modalTitle"),
  modalDescription: document.getElementById("modalDescription"),

  modalGenre: document.getElementById("modalGenre"),
  modalProgress: document.getElementById("modalProgress"),
  modalYear: document.getElementById("modalYear"),

  modalTechnologies: document.getElementById("modalTechnologies"),
  modalFeatures: document.getElementById("modalFeatures"),
  modalControls: document.getElementById("modalControls"),
  modalResponsibilities: document.getElementById(
    "modalResponsibilities"
  ),

  modalPlayButton: document.getElementById("modalPlayButton"),
  modalRepositoryButton: document.getElementById(
    "modalRepositoryButton"
  )
};

let loadedGames = [];
let lastFocusedElement = null;
let modalCloseTimer = null;

window.addEventListener("DOMContentLoaded", initializeStudio);

async function initializeStudio() {
  setCurrentYear();
  bindNavigation();
  bindModal();
  initializeRevealAnimations();

  await loadGames();
}

/* =========================================================
   基本設定
   ========================================================= */

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

/* =========================================================
   導覽選單
   ========================================================= */

function bindNavigation() {
  if (!elements.menuButton || !elements.navigation) {
    return;
  }

  elements.menuButton.addEventListener("click", () => {
    const isOpen = elements.navigation.classList.toggle(
      "is-open"
    );

    elements.menuButton.classList.toggle("is-open", isOpen);

    elements.menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  elements.navigation
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener("click", closeNavigation);
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

/* =========================================================
   遊戲資料
   ========================================================= */

async function loadGames() {
  if (!elements.gameGrid) {
    return;
  }

  const results = await Promise.allSettled(
    GAME_DATA_FILES.map((filePath) => loadGameData(filePath))
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

/* =========================================================
   遊戲卡片
   ========================================================= */

function renderGameLibrary(games) {
  elements.gameGrid.innerHTML = "";

  games.forEach((game, index) => {
    const gameCard = createGameCard(game, index);

    elements.gameGrid.appendChild(gameCard);
  });
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

  article.className = "game-card reveal-item";
  article.dataset.theme = theme.theme;

  article.style.setProperty(
    "--reveal-delay",
    `${index * 90}ms`
  );

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
          查看詳情
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
      button.addEventListener("click", () => {
        openGameModal(game, index, button);
      });
    });

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
      <span class="button__arrow" aria-hidden="true"></span>
    </a>
  `;
}

/* =========================================================
   後續作品
   ========================================================= */

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

    const article = document.createElement("article");

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

/* =========================================================
   Modal
   ========================================================= */

function bindModal() {
  if (!elements.modalBackdrop || !elements.modalClose) {
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

function openGameModal(game, index, triggerElement) {
  if (
    !elements.modalBackdrop ||
    !elements.modalPanel
  ) {
    return;
  }

  if (modalCloseTimer) {
    window.clearTimeout(modalCloseTimer);
    modalCloseTimer = null;
  }

  const theme = getGameTheme(game);
  const projectNumber = formatProjectNumber(index + 1);

  lastFocusedElement =
    triggerElement || document.activeElement;

  elements.modalPanel.dataset.theme = theme.theme;

  setText(
    elements.modalProjectNumber,
    `PROJECT ${projectNumber}`
  );

  setText(elements.modalThemeLabel, theme.label);
  setText(elements.modalMonogram, theme.monogram);

  setText(
    elements.modalStatus,
    game.status || "PROJECT"
  );

  setText(elements.modalTitle, game.title);

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

  renderTechnologyList(game.technologies);
  renderSimpleList(
    elements.modalFeatures,
    game.features,
    "作品內容整理中"
  );

  renderControlList(game.controls);

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
    elements.modalBackdrop.classList.add("is-open");
    elements.body.classList.add("modal-open");
  });

  elements.modalClose.focus();
}

function closeGameModal() {
  if (!elements.modalBackdrop) {
    return;
  }

  elements.modalBackdrop.classList.remove("is-open");
  elements.body.classList.remove("modal-open");

  modalCloseTimer = window.setTimeout(() => {
    elements.modalBackdrop.hidden = true;

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === "function"
    ) {
      lastFocusedElement.focus();
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

  elements.modalCoverImage.hidden = !hasCoverImage;
  elements.modalCoverImage.removeAttribute("src");
  elements.modalCoverImage.alt = "";
  elements.modalCoverImage.onerror = null;

  if (!hasCoverImage) {
    return;
  }

  elements.modalCoverImage.src = game.coverImage;

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

  const isAvailable = isValidHttpUrl(url);

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

  const firstElement = focusableElements[0];

  const lastElement =
    focusableElements[focusableElements.length - 1];

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

/* =========================================================
   Modal 清單
   ========================================================= */

function renderTechnologyList(technologies) {
  if (!elements.modalTechnologies) {
    return;
  }

  const items = normalizeStringArray(technologies);

  elements.modalTechnologies.innerHTML = "";

  const safeItems =
    items.length > 0 ? items : ["未設定"];

  safeItems.forEach((technology) => {
    const item = document.createElement("li");

    item.textContent = technology;

    elements.modalTechnologies.appendChild(item);
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

  const items = normalizeStringArray(values);

  container.innerHTML = "";

  const safeItems =
    items.length > 0 ? items : [fallbackText];

  safeItems.forEach((value) => {
    const item = document.createElement("li");

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
    const item = document.createElement("li");

    item.innerHTML =
      "<span>操作方式整理中</span>";

    elements.modalControls.appendChild(item);

    return;
  }

  controls.forEach((control) => {
    const item = document.createElement("li");
    const key = document.createElement("kbd");
    const action = document.createElement("span");

    key.textContent = control?.key || "—";
    action.textContent = control?.action || "未設定";

    item.append(key, action);

    elements.modalControls.appendChild(item);
  });
}

/* =========================================================
   進場動畫
   ========================================================= */

function initializeRevealAnimations() {
  const revealElements = document.querySelectorAll(
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

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
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

/* =========================================================
   錯誤畫面
   ========================================================= */

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

/* =========================================================
   工具函式
   ========================================================= */

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

  return normalizedTitle.slice(0, 2).toUpperCase();
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
