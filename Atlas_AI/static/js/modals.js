// Modal functionality
window.initModals = () => {
  setupLinkModal()
  setupCreatePageModal()

  function setupLinkModal() {
    // Link modal functionality
    window.showLinkModal = () => {
      const selection = window.getSelection()
      const selectedText = selection.toString()

      // Create modal
      const modal = document.createElement("div")
      modal.className = "modal-overlay link-modal"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-icon">
              <i class="fas fa-link"></i>
            </div>
            <div>
              <h3>Add Link</h3>
              <p class="modal-subtitle">Link selected text to a page or URL</p>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="linkForm">
              <div class="form-group">
                <label for="linkText">Link Text</label>
                <input type="text" id="linkText" value="${selectedText}" placeholder="Enter link text...">
              </div>
              <div class="form-group">
                <label for="linkType">Link Type</label>
                <select id="linkType" onchange="toggleLinkOptions(this.value)">
                  <option value="url">External URL</option>
                  <option value="page">Wiki Page</option>
                  <option value="section">Page Section</option>
                </select>
              </div>
              <div class="form-group" id="urlGroup">
                <label for="linkUrl">URL</label>
                <input type="url" id="linkUrl" placeholder="https://example.com">
              </div>
              <div class="form-group" id="pageGroup" style="display: none;">
                <label for="linkPage">Wiki Page</label>
                <select id="linkPage">
                  <option value="">Select a page...</option>
                </select>
              </div>
              <div class="form-group" id="sectionGroup" style="display: none;">
                <label for="linkSection">Section</label>
                <input type="text" id="linkSection" placeholder="Enter section name...">
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Link</button>
              </div>
            </form>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Load pages for dropdown
      loadPagesForLinkModal()

      // Focus text input
      setTimeout(() => modal.querySelector("#linkText").focus(), 100)

      // Handle form submission
      modal.querySelector("#linkForm").addEventListener("submit", (e) => {
        e.preventDefault()
        createLink(modal, selection)
      })
    }

    async function loadPagesForLinkModal() {
      try {
        const response = await fetch("/api/wiki")
        const pages = await response.json()
        const pageSelect = document.querySelector("#linkPage")

        if (pageSelect) {
          pageSelect.innerHTML =
            '<option value="">Select a page...</option>' +
            pages.map((page) => `<option value="${page.slug}">${page.title}</option>`).join("")
        }
      } catch (error) {
        console.error("Error loading pages:", error)
      }
    }

    function createLink(modal, selection) {
      const linkText = modal.querySelector("#linkText").value
      const linkType = modal.querySelector("#linkType").value
      let linkUrl = ""

      switch (linkType) {
        case "url":
          linkUrl = modal.querySelector("#linkUrl").value
          break
        case "page":
          const pageSlug = modal.querySelector("#linkPage").value
          linkUrl = pageSlug ? `/wiki/${pageSlug}` : ""
          break
        case "section":
          const sectionName = modal.querySelector("#linkSection").value
          linkUrl = sectionName ? `#${sectionName.toLowerCase().replace(/\s+/g, "-")}` : ""
          break
      }

      if (!linkText || !linkUrl) {
        alert("Please fill in all fields")
        return
      }

      // Create link element
      const link = document.createElement("a")
      link.href = linkUrl
      link.textContent = linkText
      if (linkType === "url") {
        link.target = "_blank"
      }

      // Insert link
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(link)
        selection.removeAllRanges()
      }

      window.AtlasAI.hasUnsavedChanges = true
      modal.remove()
      document.getElementById("pageContent")?.focus()
    }

    // Global function for link modal
    window.toggleLinkOptions = (type) => {
      const urlGroup = document.querySelector("#urlGroup")
      const pageGroup = document.querySelector("#pageGroup")
      const sectionGroup = document.querySelector("#sectionGroup")

      urlGroup.style.display = type === "url" ? "block" : "none"
      pageGroup.style.display = type === "page" ? "block" : "none"
      sectionGroup.style.display = type === "section" ? "block" : "none"
    }
  }

  function setupCreatePageModal() {
    // Show create page modal
    window.showCreatePageModal = (parentId = null, parentTitle = null) => {
      const modal = document.createElement("div")
      modal.className = "modal-overlay"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
       
            <div>
              <h3>Create New Page</h3>
              <p class="modal-subtitle">${parentTitle ? `Creating a child page under: ${parentTitle}` : ""}</p>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="createPageForm">
              <div class="form-group">
                <label for="pageTitle">Page Title</label>
                <input type="text" id="pageTitle" name="title" required placeholder="Enter page title...">
              </div>
              ${
                !parentId
                  ? `
              <div class="form-group">
                <label for="parentPage">Parent Page (Optional)</label>
                <select id="parentPage" name="parent_id">
                  <option value="">No parent (root level)</option>
                </select>
              </div>
              `
                  : `<input type="hidden" name="parent_id" value="${parentId}">`
              }
             
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Page</button>
              </div>
            </form>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })

      // Load pages for parent dropdown if not creating child page
      if (!parentId) {
        loadPagesForParentSelect()
      }

      // Focus title input
      setTimeout(() => modal.querySelector("#pageTitle").focus(), 100)

      // Handle form submission
      modal.querySelector("#createPageForm").addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target)
        const title = formData.get("title")
        const content = formData.get("content")
        const parent_id = formData.get("parent_id") || null

        try {
          const response = await fetch("/api/wiki", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              content,
              parent_id,
            }),
          })

          if (response.ok) {
            const newPage = await response.json()
            modal.remove()
            window.location.href = `/wiki/${newPage.slug}`
          } else {
            throw new Error("Failed to create page")
          }
        } catch (error) {
          alert("Failed to create page. Please try again.")
        }
      })
    }

    async function loadPagesForParentSelect() {
      try {
        const response = await fetch("/api/wiki")
        const pages = await response.json()
        const parentSelect = document.querySelector("#parentPage")

        if (parentSelect) {
          parentSelect.innerHTML =
            '<option value="">No parent (root level)</option>' +
            pages.map((page) => `<option value="${page.id}">${page.title}</option>`).join("")
        }
      } catch (error) {
        console.error("Error loading pages:", error)
      }
    }
  }
}
