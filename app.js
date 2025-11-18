// 🎮 GameVault NEON - FINAL CLEAN VERSION WITH FIXED FAVORITES

document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "b397d76f800a4e4eaad08a2130eec9ed";
  const baseUrl = `https://api.rawg.io/api/games?key=${apiKey}`;

  // UI Elements
  const gamesContainer = document.getElementById("games");
  const loadingDiv = document.getElementById("loading");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const closeModalBtn = document.getElementById("closeModal");

  const searchInput = document.getElementById("search");
  const genreSelect = document.getElementById("genre");
  const platformSelect = document.getElementById("platform");
  const sortSelect = document.getElementById("sort");
  const searchBtn = document.getElementById("searchBtn");
  const favoritesBtn = document.getElementById("favoritesBtn");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // App State
  let currentQuery = "";
  let currentGenre = "";
  let currentPlatform = "";
  let currentSort = "";
  let currentPage = 1;

  let showingFavorites = false;

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Start with game list
  fetchGames();

  // ===================== EVENTS ========================

  searchBtn.addEventListener("click", () => {
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    fetchGames();
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentQuery = searchInput.value.trim();
      currentPage = 1;
      fetchGames();
    }
  });

  genreSelect.addEventListener("change", () => {
    currentGenre = genreSelect.value;
    currentPage = 1;
    fetchGames();
  });

  platformSelect.addEventListener("change", () => {
    currentPlatform = platformSelect.value;
    currentPage = 1;
    fetchGames();
  });

  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    fetchGames();
  });

  // ⭐ FAVORITES MODE TOGGLE
  favoritesBtn.addEventListener("click", () => {
    showingFavorites = !showingFavorites;

    favoritesBtn.textContent = showingFavorites ? "⬅ Back" : "⭐ Favorites";

    if (showingFavorites) {
      // Show ONLY what user starred
      showGames(favorites);
    } else {
      // Return to normal browsing
      fetchGames();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchGames();
    }
  });

  nextBtn.addEventListener("click", () => {
    currentPage++;
    fetchGames();
  });

  // ===================== FETCH GAMES ========================

  function fetchGames() {
    if (showingFavorites) {
      showGames(favorites);
      return;
    }

    toggleLoading(true);

    let url = `${baseUrl}&page=${currentPage}&page_size=35`;

    if (currentQuery) url += `&search=${encodeURIComponent(currentQuery)}`;
    if (currentGenre) url += `&genres=${currentGenre}`;
    if (currentPlatform) url += `&platforms=${currentPlatform}`;
    if (currentSort) url += `&ordering=${currentSort}`;

    fetch(url)
      .then((res) => res.json())
      .then(async (data) => {
        let unique = [];
        const map = new Map();

        (data.results || []).forEach((g) => {
          if (!map.has(g.id)) {
            map.set(g.id, true);
            unique.push(g);
          }
        });

        // Remove games with no stores
        unique = unique.filter((g) => g.stores && g.stores.length > 0);

        showGames(unique);
      })
      .finally(() => toggleLoading(false));
  }

  // ===================== RENDER CARDS ========================

  async function showGames(games) {
    gamesContainer.innerHTML = "";

    if (!games.length) {
      gamesContainer.innerHTML = `<p>No games found.</p>`;
      return;
    }

    for (let game of games) {
      const cheapest = await getCheapestPrice(game.id);
      const isFavorite = favorites.some((f) => f.id === game.id);

      const card = document.createElement("div");
      card.className = "game";

      card.innerHTML = `
        <div class="favorite-btn ${isFavorite ? "active" : ""}">⭐</div>
        <img src="${game.background_image || ""}" alt="${game.name}">
        <h3>${game.name}</h3>

        ${
          cheapest
            ? `<p class="price">💲 ${cheapest}</p>`
            : `<p class="price price-na">No Price</p>`
        }

        <p>Rating: ${game.rating || "N/A"}</p>
      `;

      // ⭐ Favorite button toggle
      card.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(game);
        e.target.classList.toggle("active");
      });

      // Open modal
      card.addEventListener("click", () => openModal(game.id));

      gamesContainer.appendChild(card);
    }
  }

  // ===================== GET CHEAPEST PRICE ========================

  async function getCheapestPrice(gameId) {
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games/${gameId}/stores?key=${apiKey}`
      );
      const json = await res.json();

      if (!json.results || !json.results.length) return null;

      const prices = json.results
        .filter((s) => s.price)
        .map((s) => s.price);

      if (!prices.length) return null;

      return Math.min(...prices).toFixed(2);
    } catch {
      return null;
    }
  }

  // ===================== FAVORITE HANDLER ========================

  function toggleFavorite(game) {
    const exists = favorites.some((f) => f.id === game.id);

    if (exists) {
      favorites = favorites.filter((f) => f.id !== game.id);

      // If on Favorites tab, update list instantly
      if (showingFavorites) showGames(favorites);
    } else {
      favorites.push({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        rating: game.rating,
      });

      if (showingFavorites) showGames(favorites);
    }

    // Remove duplicates
    favorites = [...new Map(favorites.map((f) => [f.id, f])).values()];

    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  // ===================== MODAL ========================

  async function openModal(id) {
    modal.style.display = "flex";
    modalBody.innerHTML = "<p>Loading...</p>";

    const [game, screens] = await Promise.all([
      fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`).then((r) => r.json()),
      fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${apiKey}`).then((r) =>
        r.json()
      ),
    ]);

    const screenshots =
      screens.results?.map((s) => `<img src="${s.image}" />`).join("") ||
      "<p>No screenshots</p>";

    modalBody.innerHTML = `
      <h2>${game.name}</h2>
      <img src="${game.background_image}" class="modal-cover">

      <p><strong>Released:</strong> ${game.released}</p>
      <p><strong>Rating:</strong> ${game.rating}</p>

      <h3>Description</h3>
      <p>${game.description_raw}</p>

      <h3>Screenshots</h3>
      <div class="gallery">${screenshots}</div>
    `;
  }

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      modal.style.display = "none";
    }
  });
});

// ===================== LOADING ========================
function toggleLoading(show) {
  const el = document.getElementById("loading");
  el.style.display = show ? "block" : "none";
}
