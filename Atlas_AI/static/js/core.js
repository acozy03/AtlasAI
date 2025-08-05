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

     if (window.Quill) { // <--- ADD THIS CHECK
      if (window.initEditing) window.initEditing();
    } else {
      console.error("Quill.js not available when initEditing was attempted. Retrying...");
      // Optional: Add a retry mechanism or ensure script loading order
      // A common pattern for robust loading:
      const checkQuillReady = setInterval(() => {
        if (window.Quill) {
          clearInterval(checkQuillReady);
          if (window.initEditing) window.initEditing();
          console.log("Quill.js is now available, editing module initialized.");
        }
      }, 100); // Check every 100ms
    }
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

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        console.log("Toggling sidebar")
        toggleSidebar()
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
      const createPageButton = document.getElementById("createPageButton")
      const welcomeCreateButton = document.getElementById("welcomeCreateButton")

      // Only update if elements exist
      if (loginButton && logoutButton) {
        if (isAuthenticated) {
          loginButton.style.display = "none"
          logoutButton.style.display = "inline-block"
        } else {
          loginButton.style.display = "inline-block"
          logoutButton.style.display = "none"
        }
      }

      // Toggle edit and create buttons based on auth status
      if (editButton) {
        editButton.style.display = isAuthenticated ? "inline-block" : "none"
      }
      if (createPageButton) {
        createPageButton.style.display = isAuthenticated ? "block" : "none"
      }
      if (welcomeCreateButton) {
        welcomeCreateButton.style.display = isAuthenticated ? "block" : "none"
      }
    }

    // Initial check and UI update
    checkAuthentication()
      .then(updateUI)
      .catch(() => {
        // Fallback: just show login button if auth check fails
        const loginButton = document.getElementById("loginButton");
        if (loginButton) loginButton.style.display = "inline-block";
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