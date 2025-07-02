// Core initialization and utilities
document.addEventListener("DOMContentLoaded", () => {
  // Import necessary libraries (ensure they are loaded before use)
  // window.marked = window.marked // If marked is loaded as a global script, no need to reassign
  // window.TurndownService = window.TurndownService
  // window.Quill = window.Quill

  // Global state
  window.AtlasAI = {
    isEditing: false,
    hasUnsavedChanges: false,
    originalTitle: "",
    originalContent: "",
    currentPageSlug: window.location.pathname.split("/").pop() || "home",
    richEditor: null,
    sidebarOpen: true,
    chatOpen: false,
    isMobile: window.innerWidth < 768,
    // Centralized function to close all panels
    closeAllPanels: () => {
      console.log("closeAllPanels called");
      if (window.AtlasAI.sidebarOpen && window.AtlasAI.isMobile && window.toggleSidebar) {
        window.toggleSidebar(); // Assumes toggleSidebar closes if open
      }
      if (window.AtlasAI.chatOpen && window.closeChat) {
        window.closeChat();
      }
      // Close all page menus
      document.querySelectorAll(".page-menu.show").forEach((m) => m.classList.remove("show"));
      // Close all link modals
      document.querySelectorAll(".link-modal").forEach((m) => m.remove());
      // Close all color picker modals
      document.querySelectorAll(".color-picker-modal").forEach((m) => m.remove());
      // Close any other open modals (e.g., create page modal)
      document.querySelectorAll(".modal-overlay:not(.link-modal):not(.color-picker-modal)").forEach((m) => m.remove());
    }
  }

  // Initialize all modules
  init()

  function init() {
    console.log("Initializing AtlasAI...")

    // Initialize authentication (optional - won't break if API doesn't exist)
    initAuth()

    // Initialize all modules
    if (window.initEditing) window.initEditing()
    if (window.initChat) window.initChat()
    if (window.initSidebar) window.initSidebar()
    if (window.initSearch) window.initSearch()
    if (window.initModals) window.initModals()
    if (window.initMarkdown) window.initMarkdown()
    if (window.initCollapsible) window.initCollapsible()

    // Auto-hide flash messages
    setTimeout(() => {
      const flashMessages = document.querySelectorAll(".flash-message")
      flashMessages.forEach((msg) => {
        msg.style.transform = "translateX(100%)"
        msg.style.opacity = "0"
        setTimeout(() => msg.remove(), 300)
      })
    }, 5000)

    // Global keyboard shortcuts (using the centralized closeAllPanels)
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        document.getElementById("globalSearch")?.focus()
      }

      // Ctrl/Cmd + / to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        if (window.toggleChat) window.toggleChat()
      }

      // Escape to close panels
      if (e.key === "Escape") {
        if (window.AtlasAI && window.AtlasAI.closeAllPanels) {
          window.AtlasAI.closeAllPanels();
        }
      }
    })

    console.log("AtlasAI initialized successfully!")
  }

  function initAuth() {
    // Check if the user is authenticated
    function checkAuthentication() {
      return fetch("/api/auth/check")
        .then((response) => {
          if (!response.ok) {
            // If API doesn't exist, assume authenticated for now
            return { isAuthenticated: true }
          }
          return response.json()
        })
        .then((data) => data.isAuthenticated)
        .catch((error) => {
          console.warn("Auth API not available, assuming authenticated:", error)
          return true // Assume authenticated if API doesn't exist
        })
    }

    // Function to update the UI based on authentication status
    function updateUI(isAuthenticated) {
      const loginButton = document.getElementById("loginButton")
      const logoutButton = document.getElementById("logoutButton")
      const editButton = document.getElementById("editButton")

      // Only update if elements exist
      if (loginButton && logoutButton && editButton) {
        if (isAuthenticated) {
          loginButton.style.display = "none"
          logoutButton.style.display = "inline-block"
          editButton.style.display = "inline-block"
        } else {
          loginButton.style.display = "inline-block"
          logoutButton.style.display = "none"
          editButton.style.display = "none"
        }
      } else {
        // If auth buttons don't exist, just show edit button if it exists
        if (editButton) {
          editButton.style.display = "inline-block"
        }
      }
    }

    // Initial check and UI update
    checkAuthentication()
      .then(updateUI)
      .catch(() => {
        // Fallback: just show edit button if it exists
        const editButton = document.getElementById("editButton")
        if (editButton) {
          editButton.style.display = "inline-block"
        }
      })

    // Logout button event listener
    const logoutButton = document.getElementById("logoutButton")
    if (logoutButton) {
      logoutButton.addEventListener("click", (event) => {
        event.preventDefault()
        fetch("/api/auth/logout", { method: "POST" })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              updateUI(false)
              window.location.href = "/"
            } else {
              console.error("Logout failed:", data.message)
            }
          })
          .catch((error) => console.error("Logout error:", error))
      })
    }

    // Login button event listener
    const loginButton = document.getElementById("loginButton")
    if (loginButton) {
      loginButton.addEventListener("click", (event) => {
        event.preventDefault()
        window.location.href = "/login"
      })
    }
  }

  // Window resize handler
  window.addEventListener("resize", () => {
    const wasMobile = window.AtlasAI.isMobile
    window.AtlasAI.isMobile = window.innerWidth < 768

    if (wasMobile !== window.AtlasAI.isMobile && window.setupResponsive) {
      window.setupResponsive()
    }
  })
})