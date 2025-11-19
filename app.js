// 🎮 GameVault NEON - FINAL CLEAN VERSION WITH FIXED FAVORITES

// Wait for DOM to fully load before initializing app
document.addEventListener("DOMContentLoaded", () => {
    // API configuration for RAWG video game database
    const apiKey = "b397d76f800a4e4eaad08a2130eec9ed";
    const baseUrl = `https://api.rawg.io/api/games?key=${apiKey}`;

    // ===================== UI ELEMENTS ========================
    // Main content containers
    const gamesContainer = document.getElementById("games");
    const loadingDiv = document.getElementById("loading");
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtn = document.getElementById("closeModal");

    // Filter and search controls
    const searchInput = document.getElementById("search");
    const genreSelect = document.getElementById("genre");
    const platformSelect = document.getElementById("platform");
    const sortSelect = document.getElementById("sort");
    const searchBtn = document.getElementById("searchBtn");
    const favoritesBtn = document.getElementById("favoritesBtn");

    // Pagination controls
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // ===================== APP STATE ========================
    // Current filter values
    let currentQuery = "";      // Search term
    let currentGenre = "";       // Selected genre filter
    let currentPlatform = "";    // Selected platform filter
    let currentSort = "";        // Selected sort order
    let currentPage = 1;         // Current page number

    // Favorites mode toggle
    let showingFavorites = false;

    // Load favorites from localStorage or initialize empty array
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    // Initial load - fetch and display games
    fetchGames();

    // ===================== EVENT LISTENERS ========================

    // Search button click handler
    searchBtn.addEventListener("click", () => {
        currentQuery = searchInput.value.trim();
        currentPage = 1; // Reset to first page on new search
        fetchGames();
    });

    // Search on Enter key press
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            currentQuery = searchInput.value.trim();
            currentPage = 1;
            fetchGames();
        }
    });

    // Genre filter change handler
    genreSelect.addEventListener("change", () => {
        currentGenre = genreSelect.value;
        currentPage = 1; // Reset to first page on filter change
        fetchGames();
    });

    // Platform filter change handler
    platformSelect.addEventListener("change", () => {
        currentPlatform = platformSelect.value;
        currentPage = 1;
        fetchGames();
    });

    // Sort order change handler
    sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value;
        currentPage = 1;
        fetchGames();
    });

    // ⭐ Toggle between favorites view and normal browse mode
    favoritesBtn.addEventListener("click", () => {
        showingFavorites = !showingFavorites;

        // Update button text based on current mode
        favoritesBtn.textContent = showingFavorites ? "⬅ Back" : "⭐ Favorites";

        if (showingFavorites) {
            // Display only favorited games
            showGames(favorites);
        } else {
            // Return to normal browsing with API results
            fetchGames();
        }
    });

    // Previous page button handler
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchGames();
        }
    });

    // Next page button handler
    nextBtn.addEventListener("click", () => {
        currentPage++;
        fetchGames();
    });

    // ===================== FETCH GAMES FROM API ========================

    function fetchGames() {
        // If in favorites mode, don't fetch from API
        if (showingFavorites) {
            showGames(favorites);
            return;
        }

        // Show loading indicator
        toggleLoading(true);

        // Build API URL with current filters and pagination
        let url = `${baseUrl}&page=${currentPage}&page_size=35`;

        // Add optional query parameters if set
        if (currentQuery) url += `&search=${encodeURIComponent(currentQuery)}`;
        if (currentGenre) url += `&genres=${currentGenre}`;
        if (currentPlatform) url += `&platforms=${currentPlatform}`;
        if (currentSort) url += `&ordering=${currentSort}`;

        // Fetch games from API
        fetch(url)
            .then((res) => res.json())
            .then(async (data) => {
                // Remove duplicate games using Map
                let unique = [];
                const map = new Map();

                (data.results || []).forEach((g) => {
                    if (!map.has(g.id)) {
                        map.set(g.id, true);
                        unique.push(g);
                    }
                });

                // Filter out games without store information
                unique = unique.filter((g) => g.stores && g.stores.length > 0);

                // Render the game cards
                showGames(unique);
            })
            .finally(() => toggleLoading(false)); // Hide loading indicator
    }

    // ===================== RENDER GAME CARDS ========================

    async function showGames(games) {
        // Clear existing content
        gamesContainer.innerHTML = "";

        // Handle empty results
        if (!games.length) {
            gamesContainer.innerHTML = `<p>No games found.</p>`;
            return;
        }

        // Create and render card for each game
        for (let game of games) {
            // Fetch cheapest price for this game
            const cheapest = await getCheapestPrice(game.id);
            
            // Check if game is in favorites
            const isFavorite = favorites.some((f) => f.id === game.id);

            // Create game card element
            const card = document.createElement("div");
            card.className = "game";

            // Build card HTML with game data
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

            // ⭐ Add favorite button click handler
            card.querySelector(".favorite-btn").addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent card click from triggering
                toggleFavorite(game);
                e.target.classList.toggle("active");
            });

            // Add click handler to open game detail modal
            card.addEventListener("click", () => openModal(game.id));

            // Add card to container
            gamesContainer.appendChild(card);
        }
    }

    // ===================== GET CHEAPEST PRICE ========================

    async function getCheapestPrice(gameId) {
        try {
            // Fetch store information for game
            const res = await fetch(
                `https://api.rawg.io/api/games/${gameId}/stores?key=${apiKey}`
            );
            const json = await res.json();

            // Return null if no store data
            if (!json.results || !json.results.length) return null;

            // Extract prices from stores that have pricing
            const prices = json.results
                .filter((s) => s.price)
                .map((s) => s.price);

            // Return null if no prices found
            if (!prices.length) return null;

            // Return the minimum price formatted to 2 decimals
            return Math.min(...prices).toFixed(2);
        } catch {
            // Return null on any error
            return null;
        }
    }

    // ===================== FAVORITE HANDLER ========================

    function toggleFavorite(game) {
        // Check if game is already in favorites
        const exists = favorites.some((f) => f.id === game.id);

        if (exists) {
            // Remove from favorites
            favorites = favorites.filter((f) => f.id !== game.id);

            // Refresh display if currently showing favorites
            if (showingFavorites) showGames(favorites);
        } else {
            // Add to favorites with essential data
            favorites.push({
                id: game.id,
                name: game.name,
                background_image: game.background_image,
                rating: game.rating,
            });

            // Refresh display if currently showing favorites
            if (showingFavorites) showGames(favorites);
        }

        // Remove any duplicate entries using Map
        favorites = [...new Map(favorites.map((f) => [f.id, f])).values()];

        // Persist favorites to localStorage
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }

    // ===================== MODAL FOR GAME DETAILS ========================

    async function openModal(id) {
        // Show modal and display loading message
        modal.style.display = "flex";
        modalBody.innerHTML = "<p>Loading...</p>";

        // Fetch game details and screenshots in parallel
        const [game, screens] = await Promise.all([
            fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`).then((r) => r.json()),
            fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${apiKey}`).then((r) =>
                r.json()
            ),
        ]);

        // Build screenshot gallery HTML
        const screenshots =
            screens.results?.map((s) => `<img src="${s.image}" />`).join("") ||
            "<p>No screenshots</p>";

        // Populate modal with game details
        modalBody.innerHTML = `
            <h2>${game.name}</h2>
            <img class="gallery-img" src="${game.background_image}" class="modal-cover">

            <p><strong>Released:</strong> ${game.released}</p>
            <p><strong>Rating:</strong> ${game.rating}</p>

            <h3>Description</h3>
            <p>${game.description_raw}</p>

            <h3>Screenshots</h3>
            <div class="gallery">${screenshots}</div>
        `;
    }

    // Close modal when close button is clicked
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close modal when clicking outside modal content
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            modal.style.display = "none";
        }
    });
});

// ===================== LOADING INDICATOR ========================
/**
 * Toggle loading indicator visibility
 * @param {boolean} show - Whether to show or hide loading indicator
 */
function toggleLoading(show) {
    const el = document.getElementById("loading");
    el.style.display = show ? "block" : "none";
}
