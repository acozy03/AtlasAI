// Sidebar functionality
window.initSidebar = () => {
  const sidebar = document.getElementById("sidebar")
  const mainContent = document.getElementById("mainContent")
  const overlay = document.getElementById("overlay")
  const toggleSidebarBtn = document.getElementById("toggleSidebar")

  setupSidebarEventListeners()
  setupSidebarMenus()
  setupSidebarCollapse()
  setupResponsive()

  function setupSidebarEventListeners() {
    // Sidebar toggle
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener("click", (e) => {
        e.preventDefault()
        toggleSidebar()
      })
    }

    // Overlay click
    if (overlay) {
      overlay.addEventListener("click", closeAllPanels)
    }

    // Intercept page navigation to save changes
    document.addEventListener("click", handlePageNavigation)
  }

  function handlePageNavigation(e) {
    const pageLink = e.target.closest(".page-link")
    if (pageLink && window.AtlasAI.isEditing && window.AtlasAI.hasUnsavedChanges) {
      e.preventDefault()

      // Save changes first, then navigate
      window
        .savePageChanges()
        .then(() => {
          window.location.href = pageLink.href
        })
        .catch(() => {
          // If save fails, ask user what to do
          if (confirm("Failed to save changes. Navigate anyway?")) {
            window.location.href = pageLink.href
          }
        })
    }
  }

  function setupResponsive() {
    window.AtlasAI.isMobile = window.innerWidth < 768

    if (window.AtlasAI.isMobile) {
      window.AtlasAI.sidebarOpen = false
      sidebar?.classList.add("collapsed")
      mainContent?.classList.add("expanded")
    }
  }

  function toggleSidebar() {
    console.log("Toggling sidebar, current state:", window.AtlasAI.sidebarOpen)
    window.AtlasAI.sidebarOpen = !window.AtlasAI.sidebarOpen

    if (window.AtlasAI.sidebarOpen) {
      sidebar?.classList.remove("collapsed")
      mainContent?.classList.remove("expanded")
      if (window.AtlasAI.isMobile) {
        overlay?.classList.add("visible")
        document.body.style.overflow = "hidden"
      }
    } else {
      sidebar?.classList.add("collapsed")
      mainContent?.classList.add("expanded")
      if (window.AtlasAI.isMobile) {
        overlay?.classList.remove("visible")
        document.body.style.overflow = "auto"
      }
    }

    // Update button icon with animation
    const icon = toggleSidebarBtn?.querySelector("i")
    if (icon) {
      icon.style.transform = "rotate(180deg)"
      setTimeout(() => {
        icon.className = window.AtlasAI.sidebarOpen ? "fas fa-bars" : "fas fa-arrow-right"
        icon.style.transform = "rotate(0deg)"
      }, 150)
    }

    console.log("Sidebar toggled, new state:", window.AtlasAI.sidebarOpen)
  }

  function closeAllPanels() {
    if (window.AtlasAI.sidebarOpen && window.AtlasAI.isMobile) {
      toggleSidebar()
    }
    if (window.AtlasAI.chatOpen && window.closeChat) {
      window.closeChat()
    }
  }

  // Setup sidebar menus with 3-dot options and create button
  function setupSidebarMenus() {
    // Add create page button to sidebar header
    const sidebarHeader = document.querySelector(".sidebar-header")
    if (sidebarHeader) {
      const createBtn = document.createElement("button")
      createBtn.className = "create-page-btn"
      createBtn.innerHTML = '<i class="fas fa-plus"></i>'
      createBtn.title = "Create new page"
      createBtn.addEventListener("click", () => {
        if (window.showCreatePageModal) window.showCreatePageModal()
      })

      sidebarHeader.appendChild(createBtn)
    }

    document.querySelectorAll(".page-item").forEach((pageItem) => {
      const pageLink = pageItem.querySelector(".page-link:not(.child)")
      if (!pageLink) return

      // Create menu button
      const menuBtn = document.createElement("button")
      menuBtn.className = "page-menu-btn"
      menuBtn.innerHTML = '<i class="fas fa-ellipsis-h"></i>'
      menuBtn.title = "Page options"

      // Create menu dropdown
      const menu = document.createElement("div")
      menu.className = "page-menu"

      const pageSlug = pageLink.href.split("/").pop()
      const pageTitle = pageLink.querySelector("span").textContent

      menu.innerHTML = `
        <button class="menu-item" onclick="addChildPage('${pageSlug}', '${pageTitle}')">
          <i class="fas fa-plus"></i>
          <span>Add child page</span>
        </button>
        <button class="menu-item delete" onclick="deletePage('${pageSlug}')">
          <i class="fas fa-trash"></i>
          <span>Delete page</span>
        </button>
      `

      // Add menu to page item
      pageLink.appendChild(menuBtn)
      pageItem.appendChild(menu)

      // Toggle menu on button click
      menuBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Close other menus
        document.querySelectorAll(".page-menu.show").forEach((m) => {
          if (m !== menu) m.classList.remove("show")
        })

        menu.classList.toggle("show")
      })

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!pageItem.contains(e.target)) {
          menu.classList.remove("show")
        }
      })
    })
  }

  // Add sidebar collapsible functionality with smooth animations
  function setupSidebarCollapse() {
    // Add click handlers to parent page links that have children
    document.querySelectorAll(".page-item").forEach((pageItem) => {
      const pageLink = pageItem.querySelector(".page-link:not(.child)")
      const children = pageItem.querySelector(".page-children")

      if (children && pageLink) {
        // Set initial state - expanded by default
        children.classList.add("expanded")

        // Add toggle button
        const toggleBtn = document.createElement("button")
        toggleBtn.className = "page-toggle"
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
        toggleBtn.setAttribute("aria-expanded", "true")

        toggleBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          togglePageChildren(children, toggleBtn)
        })

        // Insert toggle button before menu button
        const menuBtn = pageLink.querySelector(".page-menu-btn")
        if (menuBtn) {
          pageLink.insertBefore(toggleBtn, menuBtn)
        } else {
          pageLink.appendChild(toggleBtn)
        }
      }
    })
  }

  function togglePageChildren(children, toggleBtn) {
    const icon = toggleBtn.querySelector("i")
    const isExpanded = children.classList.contains("expanded")

    if (isExpanded) {
      // Collapse
      children.classList.remove("expanded")
      children.classList.add("collapsed")
      icon.className = "fas fa-chevron-right"
      toggleBtn.setAttribute("aria-expanded", "false")
    } else {
      // Expand
      children.classList.remove("collapsed")
      children.classList.add("expanded")
      icon.className = "fas fa-chevron-down"
      toggleBtn.setAttribute("aria-expanded", "true")
    }
  }

  // Global functions for menu actions
  window.addChildPage = (parentSlug, parentTitle) => {
    // Close menu
    document.querySelectorAll(".page-menu.show").forEach((m) => m.classList.remove("show"))

    // Get parent page ID and show modal
    fetch(`/api/page-by-slug/${parentSlug}`)
      .then((response) => response.json())
      .then((parentPage) => {
        if (window.showCreatePageModal) {
          window.showCreatePageModal(parentPage.id, parentTitle)
        }
      })
      .catch(() => {
        alert("Error loading parent page information")
      })
  }

  window.deletePage = (slug) => {
    // Close menu
    document.querySelectorAll(".page-menu.show").forEach((m) => m.classList.remove("show"))

    // Create custom confirmation dialog
    const confirmDialog = document.createElement("div")
    confirmDialog.className = "modal-overlay"
    confirmDialog.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-icon delete">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3>Delete Page</h3>
            <p class="modal-subtitle">This action cannot be undone</p>
          </div>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this page? All child pages will also be deleted.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-danger" onclick="confirmDelete('${slug}')">Delete Page</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(confirmDialog)
  }

  window.confirmDelete = (slug) => {
    fetch(`/delete/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(() => {
      window.location.href = "/"
    })
  }

  // Global functions
  window.toggleSidebar = toggleSidebar
  window.closeAllPanels = closeAllPanels
  window.setupResponsive = setupResponsive
}
