// Search functionality
window.initSearch = () => {
  const searchInput = document.getElementById("searchPages")
  const globalSearchInput = document.getElementById("globalSearch")

  setupLocalSearch()
  setupGlobalSearch()

  function setupLocalSearch() {
    if (!searchInput) return

    searchInput.addEventListener("input", handleSearch)
    searchInput.addEventListener("focus", () => {
      searchInput.parentElement.style.transform = "scale(1.02)"
    })
    searchInput.addEventListener("blur", () => {
      searchInput.parentElement.style.transform = "scale(1)"
    })
  }

  function setupGlobalSearch() {
    if (!globalSearchInput) return

    let searchTimeout = null

    globalSearchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      const query = e.target.value.trim()
  
      if (query.length < 2) {
        hideSearchResults()
        return
      }

      searchTimeout = setTimeout(() => {
        performGlobalSearch(query)
      }, 300)
    })

    globalSearchInput.addEventListener("focus", () => {
      if (globalSearchInput.value.trim().length >= 2) {
        showSearchResults()
      }
    })
  
    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".global-search-container")) {
        hideSearchResults()
      }
    })
  }

  async function performGlobalSearch(query) {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const results = await response.json()

      displaySearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    }
  }

  function displaySearchResults(results) {
    let resultsContainer = document.querySelector(".search-results")

    if (!resultsContainer) {
      resultsContainer = document.createElement("div")
      resultsContainer.className = "search-results"
      globalSearchInput.parentElement.appendChild(resultsContainer)
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-result-item no-results">
          <i class="fas fa-search"></i>
          <span>No results found</span>
        </div>
      `
    } else {
      resultsContainer.innerHTML = results
        .map(
          (result) => `
        <a href="/wiki/${result.slug}" class="search-result-item">
          <div class="result-header">
            <i class="fas fa-file-text"></i>
            <span class="result-title">${result.title}</span>
          </div>
          <div class="result-snippet">${result.snippet}</div>
        </a>
      `,
        )
        .join("")
    }

    showSearchResults()
  }

  function showSearchResults() {
    const resultsContainer = document.querySelector(".search-results")
    if (resultsContainer) {
      resultsContainer.classList.add("show")
    }
  }

  function hideSearchResults() {
    const resultsContainer = document.querySelector(".search-results")
    if (resultsContainer) {
      resultsContainer.classList.remove("show")
    }
  }

  function handleSearch() {
    const searchTerm = searchInput?.value.toLowerCase() || ""
    const pageItems = document.querySelectorAll(".page-item")

    pageItems.forEach((item) => {
      const text = item.textContent.toLowerCase()
      const shouldShow = text.includes(searchTerm)

      item.style.opacity = shouldShow ? "1" : "0.3"
      item.style.transform = shouldShow ? "translateX(0)" : "translateX(-10px)"
      item.style.transition = "opacity 0.3s ease, transform 0.3s ease"
    })
  }
}
