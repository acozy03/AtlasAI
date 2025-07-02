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

    // Overlay click (will call AtlasAI.closeAllPanels which is defined in core.js)
    if (overlay) {
      overlay.addEventListener("click", () => {
        if (window.AtlasAI && window.AtlasAI.closeAllPanels) {
          window.AtlasAI.closeAllPanels();
        }
      });
    }

    // Intercept page navigation to save changes
    document.addEventListener("click", handlePageNavigation)
  }

  function handlePageNavigation(e) {
    const pageLink = e.target.closest(".page-link")
    // Check if the click is on a page link and if there are unsaved changes and not currently saving
    // Also, explicitly check if the click target is NOT one of our interactive buttons
    const isMenuButton = e.target.closest(".page-menu-btn");
    const isToggleCollapsedButton = e.target.closest(".page-toggle");
    
    if (pageLink && !isMenuButton && !isToggleCollapsedButton && window.AtlasAI.isEditing && window.AtlasAI.hasUnsavedChanges) {
      e.preventDefault()

      // Save changes first, then navigate
      window
        .savePageChanges()
        .then(() => {
          // Only navigate if save was successful
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

    // If switching to mobile, ensure sidebar is collapsed
    if (window.AtlasAI.isMobile) {
      window.AtlasAI.sidebarOpen = false
      sidebar?.classList.add("collapsed")
      mainContent?.classList.add("expanded")
    } else {
      // If switching to desktop, ensure sidebar is open by default
      window.AtlasAI.sidebarOpen = true;
      sidebar?.classList.remove("collapsed");
      mainContent?.classList.remove("expanded");
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

  // Renamed to ensure core.js manages the global AtlasAI.closeAllPanels
  function closeSidebarOnly() {
    if (window.AtlasAI.sidebarOpen && window.AtlasAI.isMobile) {
      toggleSidebar()
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
      createBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent any default button action
        e.stopPropagation(); // Prevent propagation that might instantly close the modal
        // Use a global event to trigger the modal, so modal.js can handle it
        document.dispatchEvent(new CustomEvent('showCreatePageModalFromSidebar'));
      })

      sidebarHeader.appendChild(createBtn)
    }

    // This global function allows the welcome screen button to open the modal
    window.showCreatePageModalFromSidebar = (parentId = null, parentTitle = null) => {
        if (window.showCreatePageModal) {
            window.showCreatePageModal(parentId, parentTitle);
        }
    };


    document.querySelectorAll(".page-item").forEach((pageItem) => {
      const pageLink = pageItem.querySelector(".page-link") 
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
      // Get page title from the span inside page-link-content
      const pageTitle = pageLink.querySelector(".page-link-content span") ? pageLink.querySelector(".page-link-content span").textContent : '';


      menu.innerHTML = `
        <button class="menu-item" data-action="addChildPage">
          <i class="fas fa-plus"></i>
          <span>Add child page</span>
        </button>
        <button class="menu-item delete" data-action="deletePage">
          <i class="fas fa-trash"></i>
          <span>Delete page</span>
        </button>
      `
      // Append menu button and menu to pageLink
      pageLink.appendChild(menuBtn)
      pageLink.appendChild(menu) // Ensure menu is child of pageLink for positioning


// Enhanced menu management with pointer-events control
menuBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const sidebarBody = document.querySelector('.sidebar-body');
  
  // Close other menus and clean up
  document.querySelectorAll(".page-link").forEach((link) => {
    const otherMenu = link.querySelector(".page-menu");
    const otherPageItem = link.closest('.page-item');
    
    if (otherMenu && otherMenu !== menu) {
      otherMenu.classList.remove("show");
      link.classList.remove("menu-active");
      if (otherPageItem) {
        otherPageItem.classList.remove("menu-active-item");
      }
    }
  });

  // Toggle current menu
  const isShowing = menu.classList.toggle("show");
  const currentPageItem = pageLink.closest('.page-item');
  
  if (isShowing) {
    pageLink.classList.add('menu-active');
    if (currentPageItem) {
      currentPageItem.classList.add('menu-active-item');
    }
    if (sidebarBody) {
      sidebarBody.classList.add('menu-open');
    }
    
    // Force menu to be on top
    menu.style.zIndex = '1001';
    
    // Position adjustment logic
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      const sidebarRect = document.querySelector('.sidebar').getBoundingClientRect();
      
      if (rect.right > sidebarRect.right) {
        menu.style.right = '0';
        menu.style.left = 'auto';
      }
      
      if (rect.bottom > window.innerHeight) {
        menu.style.top = 'auto';
        menu.style.bottom = '100%';
      }
    }, 0);
    
  } else {
    pageLink.classList.remove('menu-active');
    if (currentPageItem) {
      currentPageItem.classList.remove('menu-active-item');
    }
    if (sidebarBody) {
      sidebarBody.classList.remove('menu-open');
    }
    
    // Reset positioning
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.right = '';
    menu.style.left = '';
    menu.style.zIndex = '';
  }
});

// Enhanced click outside handler
document.addEventListener("click", (e) => {
  if (!pageLink.contains(e.target)) {
    const sidebarBody = document.querySelector('.sidebar-body');
    const currentPageItem = pageLink.closest('.page-item');
    
    menu.classList.remove("show");
    pageLink.classList.remove('menu-active');
    
    if (currentPageItem) {
      currentPageItem.classList.remove('menu-active-item');
    }
    if (sidebarBody) {
      sidebarBody.classList.remove('menu-open');
    }
    
    // Reset positioning
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.right = '';
    menu.style.left = '';
    menu.style.zIndex = '';
  }
});

// Ensure menu items are properly clickable
menu.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Force the click to be processed
    setTimeout(() => {
      const action = item.dataset.action;
      if (action === "addChildPage") {
        window.addChildPage(pageSlug, pageTitle);
      } else if (action === "deletePage") {
        window.deletePage(pageSlug);
      }
    }, 0);
  });
});
    })
  }

  // Add sidebar collapsible functionality with smooth animations
  function setupSidebarCollapse() {
    // Add click handlers to parent page links that have children
    document.querySelectorAll(".page-item").forEach((pageItem) => {
      const pageLink = pageItem.querySelector(".page-link") // Select the link
      const childrenContainer = pageItem.querySelector(".page-children") // Select the children div

      if (childrenContainer && pageLink) {
        // Add toggle button ONLY if children exist
        const toggleBtn = document.createElement("button")
        toggleBtn.className = "page-toggle"
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
        
        // Determine if children should be expanded based on current page
        // Find the active page within this branch (including current page and its children)
        const currentActiveLink = document.querySelector(".page-link.active");
        let isExpandedDefault = false;
        if (currentActiveLink) {
            // Check if currentActiveLink is within this pageItem or its children
            isExpandedDefault = pageItem.contains(currentActiveLink);
        }

        if (isExpandedDefault) {
            childrenContainer.classList.add("expanded");
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleBtn.querySelector("i").className = "fas fa-chevron-down";
        } else {
            childrenContainer.classList.add("collapsed"); // Start collapsed if not active
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.querySelector("i").className = "fas fa-chevron-right";
        }

        toggleBtn.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent default button/link action
          e.stopPropagation(); // Prevent propagation that might trigger pageLink navigation
          togglePageChildren(childrenContainer, toggleBtn)
        })

        // Insert toggle button as the first child of the .page-link-content wrapper
        const pageLinkContent = pageLink.querySelector(".page-link-content");
        if (pageLinkContent) {
            pageLinkContent.insertBefore(toggleBtn, pageLinkContent.firstChild);
        }
      } else if (pageLink) {
        // If no children, ensure no toggle button exists (cleanup from previous runs/updates)
        const existingToggleBtn = pageLink.querySelector(".page-link-content .page-toggle");
        if (existingToggleBtn) {
            existingToggleBtn.remove();
        }
      }
    })
  }

  function togglePageChildren(childrenContainer, toggleBtn) {
    const icon = toggleBtn.querySelector("i")
    const isExpanded = childrenContainer.classList.contains("expanded")

    if (isExpanded) {
      // Collapse
      childrenContainer.classList.remove("expanded")
      childrenContainer.classList.add("collapsed")
      icon.className = "fas fa-chevron-right"
      toggleBtn.setAttribute("aria-expanded", "false")
    } else {
      // Expand
      childrenContainer.classList.remove("collapsed")
      childrenContainer.classList.add("expanded")
      icon.className = "fas fa-chevron-down"
      toggleBtn.setAttribute("aria-expanded", "true")
    }
  }

  // Global functions for menu actions
  window.addChildPage = (parentSlug, parentTitle) => {
    // Close menu first
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
    // Close menu first
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
  // Note: window.closeAllPanels will be managed by core.js
  window.setupResponsive = setupResponsive
}