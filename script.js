"use strict";

const GAME_DATA_FILES = [
  "./games/hooded-escape.json",
  "./games/Gomoku-Magic.json"
];

const UPCOMING_PROJECT_COUNT = 2;

const gameGrid = document.getElementById("gameGrid");
const gameCount = document.getElementById("gameCount");

const menuButton = document.getElementById("menuButton");
const mainNavigation = document.getElementById("mainNavigation");

const gameModal = document.getElementById("gameModal");
const modalClose = document.getElementById("modalClose");

const modalImage = document.getElementById("modalImage");
const modalStatus = document.getElementById("modalStatus");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalGenre = document.getElementById("modalGenre");
const modalTechnology = document.getElementById("modalTechnology");
const modalProgress = document.getElementById("modalProgress");
const modalFeatures = document.getElementById("modalFeatures");
const modalPlayButton = document.getElementById("modalPlayButton");
const modalRepositoryButton = document.getElementById(
  "modalRepositoryButton"
);

let loadedGames = [];
let lastFocusedElement = null;

document.addEventListener("DOMContentLoaded", initializeStudio);

async function initializeStudio() {
  setCurrentYear();
  bindNavigationEvents();
  bindModalEvents();

  await loadGames();
}

function setCurrentYear() {
  const yearElement = document.getElementById("currentYear");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

function bindNavigationEvents() {
  if (!menuButton || !mainNavigation) {
    return;
  }

  menuButton.addEventListener("click", () => {
    const isOpen = mainNavigation.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  mainNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNavigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideNavigation =
      mainNavigation.contains(event.target);

    const clickedMenuButton =
      menuButton.contains(event.target);

    if (!clickedInsideNavigation && !clickedMenuButton) {
      mainNavigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

function bindModalEvents() {
  if (!gameModal || !modalClose) {
    return;
  }

  modalClose.addEventListener("click", closeGameModal);

  gameModal.addEventListener("click", (event) => {
    if (event.target === gameModal) {
      closeGameModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !gameModal.hidden) {
      closeGameModal();
    }
  });
}

async function loadGames() {
  try {
    const results = await Promise.all(
      GAME_DATA_FILES.map(loadGameData)
    );

    loadedGames = results.filter(Boolean);

    renderGameLobby(loadedGames);
    updateGameCount(loadedGames.length);
  } catch (error) {
    console.error("遊戲資料載入失敗：", error);
    renderLoadError(error);
  }
}

async function loadGameData(filePath) {
  const response = await fetch(filePath);

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
    "description",
    "genre",
    "status"
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

function renderGameLobby(games) {
  if (!gameGrid) {
    return;
  }

  gameGrid.innerHTML = "";

  games.forEach((game, index) => {
    const gameCard = createGameCard(game, index);
    gameGrid.appendChild(gameCard);
  });

  for (
    let projectNumber = 1;
    projectNumber <= UPCOMING_PROJECT_COUNT;
    projectNumber += 1
  ) {
    gameGrid.appendChild(
      createLockedCard(projectNumber)
    );
  }
}

function createGameCard(game, index) {
  const article = document.createElement("article");

  article.className =
    index === 0
      ? "game-card featured"
      : "game-card";

  const hasCoverImage =
    typeof game.coverImage === "string" &&
    game.coverImage.trim() !== "";

  const technologies = Array.isArray(game.technologies)
    ? game.technologies.slice(0, 3).join(" / ")
    : "Game Project";

  const coverContent = hasCoverImage
    ? `
      <img
        src="${escapeAttribute(game.coverImage)}"
        alt="${escapeAttribute(
          game.coverImageAlt || game.title
        )}"
        loading="lazy"
      >
    `
    : `
      <div class="game-cover-placeholder">
        <span>${escapeHTML(game.title)}</span>
      </div>
    `;

  article.innerHTML = `
    <div class="game-cover">
      <span class="game-status">
        ${escapeHTML(game.status)}
      </span>

      ${coverContent}
    </div>

    <div class="game-content">
      <div class="game-meta">
        <span>${escapeHTML(game.genre)}</span>
        <span>•</span>
        <span>${escapeHTML(technologies)}</span>
      </div>

      <h3>${escapeHTML(game.title)}</h3>

      <p>
        ${escapeHTML(
          game.shortDescription || game.description
        )}
      </p>

      <div class="card-actions">
        ${createGameButton(game.gameUrl)}

        <button
          class="details-button"
          type="button"
          data-game-id="${escapeAttribute(game.id)}"
        >
          作品介紹
        </button>
      </div>
    </div>
  `;

  const detailsButton = article.querySelector(
    `[data-game-id="${CSS.escape(game.id)}"]`
  );

  if (detailsButton) {
    detailsButton.addEventListener("click", () => {
      openGameModal(game, detailsButton);
    });
  }

  const image = article.querySelector("img");

  if (image) {
    image.addEventListener("error", () => {
      replaceBrokenImage(image, game.title);
    });
  }

  return article;
}

function createGameButton(gameUrl) {
  if (!isValidUrl(gameUrl)) {
    return `
      <button
        class="primary-button disabled"
        type="button"
        disabled
      >
        尚未開放
      </button>
    `;
  }

  return `
    <a
      class="primary-button"
      href="${escapeAttribute(gameUrl)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      開始遊戲
    </a>
  `;
}

function createLockedCard(projectNumber) {
  const article = document.createElement("article");

  const projectIndex =
    loadedGames.length + projectNumber;

  article.className = "game-card locked-card";

  article.innerHTML = `
    <div class="locked-content">
      <div class="lock-icon" aria-hidden="true">
        ◆
      </div>

      <p class="eyebrow">
        PROJECT ${String(projectIndex).padStart(2, "0")}
      </p>

      <h3>尚未解鎖</h3>

      <p>
        下一款遊戲 Demo 完成後將會加入這個位置。
      </p>
    </div>
  `;

  return article;
}

function updateGameCount(count) {
  if (!gameCount) {
    return;
  }

  gameCount.textContent = String(count).padStart(2, "0");
}

function openGameModal(game, triggerElement) {
  if (!gameModal) {
    return;
  }

  lastFocusedElement =
    triggerElement || document.activeElement;

  configureModalImage(game);

  modalStatus.textContent =
    game.status || "DEVELOPMENT PROJECT";

  modalTitle.textContent = game.title;
  modalDescription.textContent = game.description;

  modalGenre.textContent =
    game.genre || "未設定";

  modalTechnology.textContent =
    Array.isArray(game.technologies)
      ? game.technologies.join(" / ")
      : "未設定";

  modalProgress.textContent =
    game.progress || "未設定";

  renderFeatureList(game.features);

  configureModalLink(
    modalPlayButton,
    game.gameUrl,
    "開始遊戲"
  );

  configureModalLink(
    modalRepositoryButton,
    game.repositoryUrl,
    "查看原始碼"
  );

  gameModal.hidden = false;
  document.body.classList.add("modal-open");

  if (modalClose) {
    modalClose.focus();
  }
}

function configureModalImage(game) {
  if (!modalImage) {
    return;
  }

  const hasCoverImage =
    typeof game.coverImage === "string" &&
    game.coverImage.trim() !== "";

  if (!hasCoverImage) {
    modalImage.removeAttribute("src");
    modalImage.alt = "";
    modalImage.style.display = "none";
    return;
  }

  modalImage.src = game.coverImage;
  modalImage.alt =
    game.coverImageAlt || `${game.title} 遊戲封面`;

  modalImage.style.display = "block";

  modalImage.onerror = () => {
    modalImage.removeAttribute("src");
    modalImage.alt = "";
    modalImage.style.display = "none";
  };
}

function closeGameModal() {
  if (!gameModal) {
    return;
  }

  gameModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus === "function"
  ) {
    lastFocusedElement.focus();
  }
}

function renderFeatureList(features) {
  if (!modalFeatures) {
    return;
  }

  modalFeatures.innerHTML = "";

  const safeFeatures =
    Array.isArray(features) && features.length > 0
      ? features
      : ["作品內容整理中"];

  safeFeatures.forEach((feature) => {
    const listItem = document.createElement("li");
    listItem.textContent = feature;

    modalFeatures.appendChild(listItem);
  });
}

function configureModalLink(element, url, label) {
  if (!element) {
    return;
  }

  element.textContent = label;

  const newElement = element.cloneNode(true);
  element.replaceWith(newElement);

  if (element === modalPlayButton) {
    window.modalPlayButton = newElement;
  }

  if (element === modalRepositoryButton) {
    window.modalRepositoryButton = newElement;
  }

  if (isValidUrl(url)) {
    newElement.href = url;
    newElement.target = "_blank";
    newElement.rel = "noopener noreferrer";

    newElement.removeAttribute("aria-disabled");
    newElement.classList.remove("disabled");

    return;
  }

  newElement.href = "#";
  newElement.setAttribute("aria-disabled", "true");
  newElement.classList.add("disabled");

  newElement.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

function replaceBrokenImage(image, title) {
  const placeholder = document.createElement("div");

  placeholder.className = "game-cover-placeholder";
  placeholder.innerHTML = `
    <span>${escapeHTML(title)}</span>
  `;

  image.replaceWith(placeholder);
}

function renderLoadError(error) {
  if (!gameGrid) {
    return;
  }

  gameGrid.innerHTML = `
    <article class="error-card">
      <h3>遊戲資料載入失敗</h3>

      <p>
        請確認以下 JSON 檔案存在，並檢查檔名大小寫：
      </p>

      <p>
        games/hooded-escape.json<br>
        games/Gomoku-Magic.json
      </p>

      <p>
        ${escapeHTML(error?.message || "未知錯誤")}
      </p>
    </article>
  `;
}

function isValidUrl(value) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
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
