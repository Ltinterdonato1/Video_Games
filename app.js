// 🎮 GameVault NEON - Clean version with favorites + store logos + direct links

document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "b397d76f800a4e4eaad08a2130eec9ed";
  const baseUrl = `https://api.rawg.io/api/games?key=${apiKey}`;

  // UI elements
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

  // State
  let currentQuery = "";
  let currentGenre = "";
  let currentPlatform = "";
  let currentSort = "";
  let currentPage = 1;

  let showingFavorites = false;
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Store logos
const storeLogos = {
    3: {
        name: "PlayStation Store",
        logo: "https://logo.clearbit.com/playstation.com"
    },
    2: {
        name: "Xbox Store",
        logo: "https://logo.clearbit.com/xbox.com"
    },
    6: {
        name: "Nintendo Store",
        logo: "https://logo.clearbit.com/nintendo.com"
    },
    1: {
        name: "Steam",
        logo: "https://logo.clearbit.com/steampowered.com"
    },
    5: {
        name: "GOG",
        logo: "https://logo.clearbit.com/gog.com"
    }
};


  // ---------- INITIAL LOAD ----------
  fetchGames();

  // ---------- EVENTS ----------

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

  favoritesBtn.addEventListener("click", () => {
    showingFavorites = !showingFavorites;
    favoritesBtn.textContent = showingFavorites ? "⬅ Back" : "⭐ Favorites";

    if (showingFavorites) {
      showGames(favorites);
    } else {
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

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      modal.style.display = "none";
    }
  });

  // ---------- FETCH GAMES ----------

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
      .then((data) => {
        let unique = [];
        const map = new Map();

        (data.results || []).forEach((g) => {
          if (!map.has(g.id)) {
            map.set(g.id, true);
            unique.push(g);
          }
        });

        // Keep only games that have at least some store info
        unique = unique.filter((g) => g.stores && g.stores.length > 0);

        showGames(unique);
      })
      .finally(() => toggleLoading(false));
  }

  // ---------- RENDER GAME CARDS ----------

  function showGames(games) {
    gamesContainer.innerHTML = "";

    if (!games.length) {
      gamesContainer.innerHTML = `<p>No games found.</p>`;
      return;
    }

    for (let game of games) {
      const isFavorite = favorites.some((f) => f.id === game.id);

      const card = document.createElement("div");
      card.className = "game";

      card.innerHTML = `
        <div class="favorite-btn ${isFavorite ? "active" : ""}">⭐</div>
        <img src="${game.background_image || ""}" alt="${game.name}">
        <h3>${game.name}</h3>
        <p>Rating: ${game.rating || "N/A"}</p>
      `;

      card.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(game);
        e.target.classList.toggle("active");
      });

      card.addEventListener("click", () => openModal(game.id));

      gamesContainer.appendChild(card);
    }
  }

  // ---------- FAVORITES ----------

  function toggleFavorite(game) {
    const exists = favorites.some((f) => f.id === game.id);

    if (exists) {
      favorites = favorites.filter((f) => f.id !== game.id);
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

    favorites = [...new Map(favorites.map((f) => [f.id, f])).values()];
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  // ---------- STORE ROWS (LOGOS + NAMES ONLY, CLICKABLE) ----------

  function buildDefaultStoresForGame(game) {
    const q = encodeURIComponent(game.name || "");

    return [
      {
        store: { id: 3, name: "PlayStation Store" },
        url: `https://store.playstation.com/en-us/search/${q}`,
      },
      {
        store: { id: 2, name: "Xbox Store" },
        url: `https://www.xbox.com/en-US/search?q=${q}`,
      },
      {
        store: { id: 6, name: "Nintendo Store" },
        url: `https://www.nintendo.com/search/?q=${q}`,
      },
      {
        store: { id: 1, name: "Steam" },
        url: `https://store.steampowered.com/search/?term=${q}`,
      },
      {
        store: { id: 5, name: "GOG" },
        url: `https://www.gog.com/en/games?query=${q}`,
      },
    ];
  }

  function renderStoreRows(stores) {
    return stores
      .map((s) => {
        const info = storeLogos[s.store.id];
        if (!info) return "";

        return `
          <a href="${s.url}" target="_blank" class="store-link">
            <div class="store-left">
              <img src="${info.logo}" class="store-icon" alt="${info.name}">
              <span>${info.name}</span>
            </div>
          </a>
        `;
      })
      .join("");
  }

  // ---------- MODAL ----------

  async function openModal(id) {
    modal.style.display = "flex";
    modalBody.innerHTML = "<p>Loading...</p>";

    const [game, screens] = await Promise.all([
      fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`).then((r) =>
        r.json()
      ),
      fetch(
        `https://api.rawg.io/api/games/${id}/screenshots?key=${apiKey}`
      ).then((r) => r.json()),
    ]);

    const screenshots =
      screens.results?.map((s) => `<img src="${s.image}" />`).join("") ||
      "<p>No screenshots</p>";

    const defaultStores = buildDefaultStoresForGame(game);
    const storeRowsHTML = renderStoreRows(defaultStores);

    modalBody.innerHTML = `
      <h2>${game.name}</h2>
      <img class="gallery-img" src="${game.background_image}" class="modal-cover">

      <p><strong>Released:</strong> ${game.released}</p>
      <p><strong>Rating:</strong> ${game.rating}</p>

      <h3>Description</h3>
      <p>${game.description_raw}</p>

      <h3>Where to Buy</h3>
      <div class="store-links">
        ${storeRowsHTML}
      </div>

      <h3>Screenshots</h3>
      <div class="gallery">${screenshots}</div>
    `;
  }
});

// ---------- LOADING SPINNER ----------

function toggleLoading(show) {
  const el = document.getElementById("loading");
  el.style.display = show ? "block" : "none";
}
