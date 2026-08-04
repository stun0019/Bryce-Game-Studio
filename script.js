"use strict";

const GAME_DATA_FILES = [
  "./games/hooded-escape.json",
  "./games/Gomoku-Magic.json"
];

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
  }
};

const elements = {
  gameGrid:
    document.getElementById("gameGrid"),

  gameCount:
    document.getElementById("gameCount"),

  currentYear:
    document.getElementById("currentYear"),

  menuButton:
    document.getElementById("menuButton"),

  navigation:
    document.getElementById("mainNavigation"),

  modalBackdrop:
    document.getElementById("gameModal"),

  modalPanel:
    document.querySelector(".project-modal"),

  modalClose:
    document.getElementById("modalClose"),

  modalArtwork:
    document.getElementById("modalArtwork"),

  modalCoverImage:
    document.getElementById("modalCoverImage"),

  modalProjectNumber:
    document.getElementById(
      "modalProjectNumber"
    ),

  modalThemeLabel:
    document.getElementById(
      "modalThemeLabel"
    ),

  modalMonogram:
    document.getElementById("modalMonogram"),

  modalStatus:
    document.getElementById("modalStatus"),

  modalTitle:
    document.getElementById("modalTitle"),

  modalDescription:
    document.getElementById(
      "modalDescription"
    ),

  modalGenre:
    document.getElementById("modalGenre"),

  modalProgress:
    document.getElementById("modalProgress"),

  modalYear:
    document.getElementById("modalYear"),

  modalTechnologies:
    document.getElementById(
      "modalTechnologies"
    ),

  modalFeatures:
    document.getElementById(
      "modalFeatures"
    ),

  modalControls:
    document.getElementById(
      "modalControls"
    ),

  modalResponsibilities:
    document.getElementById(
      "modalResponsibilities"
    ),

  modalPlayButton:
    document.getElementById(
      "modalPlayButton"
    ),

  modalRepositoryButton:
    document.getElementById(
      "modalRepositoryButton"
    )
};

let loadedGames = [];
let lastFocusedElement = null;

window.addEventListener(
  "DOMContentLoaded",
  initializeStudio
);

async function initializeStudio() {
  setCurrentYear();
  bindNavigation();
  bindModal();

  await loadGames();
}

function setCurrentYear() {
  if (elements.currentYear) {
    elements.currentYear.textContent =
      String(new Date().getFullYear());
  }
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

      const clickedButton =
        elements.menuButton.contains(
          event.target
        );

      if (
        !clickedNavigation &&
        !clickedButton
      ) {
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
      if (elements.modalBackdrop.hidden) {
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

  const failedResults =
    results.filter(
      (result) =>
        result.status === "rejected"
    );

  if (loadedGames.length === 0) {
    renderLoadError(failedResults);
    updateGameCount(0);

    return;
  }

  renderGameLibrary(loadedGames);
  updateGameCount(loadedGames.length);

  failedResults.forEach((result) => {
    console.error(
      "遊戲資料載入失敗：",
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

  const game = await response.json();

  validateGameData(game, filePath);

  return game;
}

function validateGameData(
  game,
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
      (field) => !game[field]
    );

  if (missingFields.length > 0) {
    throw new Error(
      `${filePath} 缺少必要欄位：${missingFields.join(", ")}`
    );
  }
}

function renderGameLibrary(games) {
  elements.gameGrid.innerHTML = "";

  games.forEach(
    (game, index) => {
      elements.gameGrid.appendChild(
        createGameCard(game, index)
      );
    }
  );
}

function createGameCard(
  game,
  index
) {
  const article =
    document.createElement("article");

  const theme =
    getGameTheme(game);

  const projectNumber =
    formatProjectNumber(index + 1);

  const technologies =
    normalizeStringArray(
      game.technologies
    ).slice(0, 3);

  const hasCoverImage =
    isNonEmptyString(
      game.coverImage
    );

  article.className = "game-card";

  article.dataset.theme =
    theme.theme;

  article.innerHTML = `
    <div class="game-card__artwork">
      <div
        class="game-card__visual"
        aria-hidden="true"
      >
        <span class="game-card__orbit"></span>

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

      <div class="game-card__topline">
        <span>
          PROJECT ${projectNumber}
        </span>

        <span class="status-badge">
          ${escapeHTML(game.status)}
        </span>
      </div>

      <div class="game-card__art-label">
        ${escapeHTML(theme.label)}
      </div>
    </div>

    <div class="game-card__content">
      <div class="game-card__heading">
        <div>
          <p>
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
              `<li>${escapeHTML(
                technology
              )}</li>`
          )
          .join("")}
      </ul>

      <div class="game-card__actions">
        ${createPlayLink(
          game.gameUrl
        )}

        <button
          class="button button--secondary js-project-details"
          type="button"
        >
          作品資訊
        </button>
      </div>
    </div>
  `;

  const detailsButton =
    article.querySelector(
      ".js-project-details"
    );

  detailsButton.addEventListener(
    "click",
    () => {
      openGameModal(
        game,
        index,
        detailsButton
      );
    }
  );

  const coverImage =
    article.querySelector(
      ".game-card__cover"
    );

  if (coverImage) {
    coverImage.addEventListener(
      "error",
      () => {
        coverImage.remove();
      }
    );
  }

  return article;
}

function createPlayLink(gameUrl) {
  if (!isValidHttpUrl(gameUrl)) {
    return `
      <button
        class="button button--primary"
        type="button"
        disabled
      >
        尚未開放
      </button>
    `;
  }

  return `
    <a
      class="button button--primary"
      href="${escapeAttribute(gameUrl)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      開始遊戲
      <span aria-hidden="true">↗</span>
    </a>
  `;
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

  const theme =
    getGameTheme(game);

  const projectNumber =
    formatProjectNumber(index + 1);

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

  renderFeatureList(
    game.features
  );

  renderControlList(
    game.controls
  );

  renderResponsibilityList(
    game.responsibilities
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

  document.body.classList.add(
    "modal-open"
  );

  elements.modalClose.focus();
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

  elements.modalArtwork
    .classList
    .toggle(
      "has-cover",
      hasCoverImage
    );

  elements.modalCoverImage.hidden =
    !hasCoverImage;

  elements.modalCoverImage
    .removeAttribute("src");

  elements.modalCoverImage.alt = "";

  elements.modalCoverImage.onerror =
    null;

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

      elements.modalArtwork
        .classList
        .remove("has-cover");
    };
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

  if (items.length === 0) {
    elements.modalTechnologies.innerHTML =
      "<li>未設定</li>";

    return;
  }

  items.forEach((technology) => {
    const item =
      document.createElement("li");

    item.textContent =
      technology;

    elements.modalTechnologies
      .appendChild(item);
  });
}

function renderFeatureList(features) {
  renderSimpleList(
    elements.modalFeatures,
    features,
    "作品內容整理中"
  );
}

function renderResponsibilityList(
  responsibilities
) {
  renderSimpleList(
    elements.modalResponsibilities,
    responsibilities,
    "開發內容整理中"
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
      document.createElement("li");

    item.textContent = value;

    container.appendChild(item);
  });
}

function renderControlList(controls) {
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
      document.createElement("li");

    item.innerHTML =
      "<span>操作方式整理中</span>";

    elements.modalControls
      .appendChild(item);

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

    item.append(
      key,
      action
    );

    elements.modalControls
      .appendChild(item);
  });
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

  element.removeAttribute("target");
  element.removeAttribute("rel");

  element.onclick =
    (event) => {
      event.preventDefault();
    };
}

function closeGameModal() {
  if (!elements.modalBackdrop) {
    return;
  }

  elements.modalBackdrop.hidden =
    true;

  document.body.classList.remove(
    "modal-open"
  );

  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus ===
      "function"
  ) {
    lastFocusedElement.focus();
  }
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
  } else if (
    !event.shiftKey &&
    document.activeElement ===
      lastElement
  ) {
    event.preventDefault();

    firstElement.focus();
  }
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
      <p class="load-error__label">
        LIBRARY ERROR
      </p>

      <h2>
        遊戲資料載入失敗
      </h2>

      <p>
        請確認 JSON 檔案名稱、
        路徑與格式是否正確。
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

function updateGameCount(count) {
  if (elements.gameCount) {
    elements.gameCount.textContent =
      String(count).padStart(2, "0");
  }
}

function getGameTheme(game) {
  return (
    GAME_THEMES[game.id] || {
      theme: "default",
      label: "INDEPENDENT PROJECT",
      monogram:
        getMonogram(game.title)
    }
  );
}

function getMonogram(title) {
  const normalizedTitle =
    String(title || "GAME").trim();

  const words =
    normalizedTitle
      .split(/\s+/)
      .filter(Boolean);

  if (words.length >= 2) {
    return (
      `${words[0][0]}${words[1][0]}`
    ).toUpperCase();
  }

  return normalizedTitle
    .slice(0, 2)
    .toUpperCase();
}

function formatProjectNumber(
  number
) {
  return String(number).padStart(
    2,
    "0"
  );
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
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function setText(
  element,
  value
) {
  if (element) {
    element.textContent =
      String(value ?? "");
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
