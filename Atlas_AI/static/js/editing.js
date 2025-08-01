// Inline editing functionality
window.initEditing = () => {
  console.log("Initializing editing module...")

  const pageTitle = document.getElementById("pageTitle")
  const pageContent = document.getElementById("pageContent")
  const mainContent = document.getElementById("mainContent")

  // Ensure Quill is available globally
  const Quill = window.Quill
  if (!Quill) {
    console.error("Quill.js not found. Make sure it's loaded before editing.js.")
    return
  }
 
  // Declare the marked variable
  const marked = window.marked

  if (!marked) {
    console.error("marked.js not found. Make sure it's loaded before editing.js.")
    return
  }

  if (!pageContent) {
    console.warn("No pageContent element found, skipping editing initialization")
    return
  }

  if (pageTitle) {
    window.AtlasAI.originalTitle = pageTitle.textContent || ""
  }
  if (pageContent) {
    window.AtlasAI.originalContent = pageContent.getAttribute("data-original-content") || ""
  }

  // Initialize flags
  if (typeof window.AtlasAI.isEnteringEditMode === "undefined") {
    window.AtlasAI.isEnteringEditMode = false
  }

  setupInlineEditing()

  function setupInlineEditing() {

    // Title editing
    if (pageTitle) {
      pageTitle.addEventListener("click", () => {
        if (!window.AtlasAI.isEditing) {
          enterEditMode()
        }
        pageTitle.contentEditable = "true"
        pageTitle.focus()
      })

      pageTitle.addEventListener("blur", () => {
        pageTitle.contentEditable = "false"
        if (window.AtlasAI.hasUnsavedChanges) {
          window.savePageChanges()
        }
      })

      pageTitle.addEventListener("input", () => {
        window.AtlasAI.hasUnsavedChanges = true
      })

      pageTitle.addEventListener("keydown", handleEditKeydown)
    }

    // Content editing
    if (pageContent) {
      console.log("Setting up content editing...")
      pageContent.addEventListener("click", (e) => {
        if (e.target.closest(".section-toggle")) {
          return
        }
        if (!window.AtlasAI.isEditing) {
          enterEditMode()
        }
      })
    }

    // Global click handler for saving/exiting
    document.addEventListener("click", (e) => {
      if (window.AtlasAI.isEnteringEditMode) {
        return
      }

      const clickedOutsideEditor = !e.target.closest(".ql-editor")
      const clickedOutsideToolbar = !e.target.closest(".ql-toolbar")
      const clickedOutsideTitle = !e.target.closest("#pageTitle")
      const clickedOutsideLinkModal = !e.target.closest(".link-modal")
      const clickedOutsideColorModal = !e.target.closest(".color-picker-modal")

      if (
        window.AtlasAI.isEditing &&
        clickedOutsideEditor &&
        clickedOutsideToolbar &&
        clickedOutsideTitle &&
        clickedOutsideLinkModal &&
        clickedOutsideColorModal
      ) {
        if (window.AtlasAI.hasUnsavedChanges) {
          window.savePageChanges().then(() => {
            setTimeout(() => {
              window.AtlasAI.isEditing = false
              window.AtlasAI.hasUnsavedChanges = false
            }, 100)
          })
        } else {
          exitEditMode()
        }
      }
    })

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && window.AtlasAI.isEditing) {
        if (window.AtlasAI.hasUnsavedChanges) {
          if (confirm("You have unsaved changes. Save before exiting?")) {
            window.savePageChanges()
          } else {
            cancelEdit()
          }
        } else {
          exitEditMode()
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s" && window.AtlasAI.isEditing) {
        e.preventDefault()
        window.savePageChanges()
      }
    })

    console.log("Inline editing setup complete")
  }

  function enterEditMode() {
    if (window.AtlasAI.isEditing) return

    console.log("Entering edit mode...")
    window.AtlasAI.isEditing = true
    window.AtlasAI.hasUnsavedChanges = false
    mainContent?.classList.add("edit-mode")

    window.AtlasAI.isEnteringEditMode = true

    // Store original content
    if (pageTitle) window.AtlasAI.originalTitle = pageTitle.textContent.trim()
    if (pageContent) {
      window.AtlasAI.originalContent = pageContent.getAttribute("data-original-content") || ""
    }

    setupRichEditor()
    console.log("Edit mode entered successfully")
  }

  function setupRichEditor() {
    if (!pageContent) {
      console.error("No pageContent element for rich editor")
      return
    }

    if (window.AtlasAI.richEditor && window.AtlasAI.richEditor.container === pageContent) {
      console.log("Quill already initialized, enabling and focusing.")
      if (window.AtlasAI.richEditor) {
        window.AtlasAI.richEditor.enable(true)
        window.AtlasAI.richEditor.focus()
      }
      return
    }

    console.log("Setting up rich editor (Quill)...")

    // Create enhanced toolbar
    const toolbarContainer = document.createElement("div")
    toolbarContainer.id = "quill-toolbar"
    toolbarContainer.className = "rich-editor-toolbar"

    toolbarContainer.innerHTML = `
      <span class="ql-formats">
        <button class="ql-bold" title="Bold"></button>
        <button class="ql-italic" title="Italic"></button>
        <button class="ql-underline" title="Underline"></button>
        <button class="ql-strike" title="Strikethrough"></button>
      </span>
      <span class="ql-formats">
        <select class="ql-header" title="Heading">
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option selected>Normal</option>
        </select>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered" title="Numbered List"></button>
        <button class="ql-list" value="bullet" title="Bullet List"></button>
        <button class="ql-indent" value="-1" title="Decrease Indent"></button>
        <button class="ql-indent" value="+1" title="Increase Indent"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-blockquote" title="Quote"></button>
        <button class="ql-code-block" title="Code Block"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-link" title="Add Link"></button>
        <select class="ql-color" title="Font Color">
          <option selected></option>
          <option value="#e60000"></option>
          <option value="#ff9900"></option>
          <option value="#ffcc00"></option>
          <option value="#008a00"></option>
          <option value="#0066cc"></option>
          <option value="#9933ff"></option>
          <option value="#ffffff"></option>
          <option value="#facccc"></option>
          <option value="#ffebcc"></option>
          <option value="#ffffcc"></option>
          <option value="#cce8cc"></option>
          <option value="#cce0f5"></option>
          <option value="#ebd6ff"></option>
          <option value="#bbbbbb"></option>
          <option value="#f06666"></option>
          <option value="#ffc266"></option>
          <option value="#ffff66"></option>
          <option value="#66b266"></option>
          <option value="#66a3e0"></option>
          <option value="#c285ff"></option>
          <option value="#888888"></option>
          <option value="#a10000"></option>
          <option value="#b26b00"></option>
          <option value="#b2b200"></option>
          <option value="#006100"></option>
          <option value="#0047b2"></option>
          <option value="#6b24b2"></option>
          <option value="#444444"></option>
          <option value="#5c0000"></option>
          <option value="#663d00"></option>
          <option value="#666600"></option>
          <option value="#003700"></option>
          <option value="#002966"></option>
          <option value="#3d1466"></option>
          <option value="#000000"></option>
        </select>
        <select class="ql-background" title="Background Color">
          <option selected></option>
          <option value="#e60000"></option>
          <option value="#ff9900"></option>
          <option value="#ffcc00"></option>
          <option value="#008a00"></option>
          <option value="#0066cc"></option>
          <option value="#9933ff"></option>
          <option value="#ffffff"></option>
          <option value="#facccc"></option>
          <option value="#ffebcc"></option>
          <option value="#ffffcc"></option>
          <option value="#cce8cc"></option>
          <option value="#cce0f5"></option>
          <option value="#ebd6ff"></option>
          <option value="#bbbbbb"></option>
          <option value="#f06666"></option>
          <option value="#ffc266"></option>
          <option value="#ffff66"></option>
          <option value="#66b266"></option>
          <option value="#66a3e0"></option>
          <option value="#c285ff"></option>
          <option value="#888888"></option>
          <option value="#a10000"></option>
          <option value="#b26b00"></option>
          <option value="#b2b200"></option>
          <option value="#006100"></option>
          <option value="#0047b2"></option>
          <option value="#6b24b2"></option>
          <option value="#444444"></option>
          <option value="#5c0000"></option>
          <option value="#663d00"></option>
          <option value="#666600"></option>
          <option value="#003700"></option>
          <option value="#002966"></option>
          <option value="#3d1466"></option>
        </select>
      </span>
      <span class="ql-formats">
        <button class="ql-clean" title="Remove Formatting"></button>
      </span>
    `

    pageContent.parentNode.insertBefore(toolbarContainer, pageContent)

    const initialMarkdownContent = pageContent.getAttribute("data-original-content") || ""

    // Initialize Quill with enhanced configuration
    window.AtlasAI.richEditor = new Quill(pageContent, {
      modules: {
        toolbar: {
          container: toolbarContainer,
          handlers: {
            link: function (value) {
              if (value) {
                const href = prompt("Enter the URL:")
                if (href) {
                  this.quill.format("link", href)
                }
              } else {
                this.quill.format("link", false)
              }
            },
          },
        },
      },
      placeholder: "",
      theme: "snow",
      formats: [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "code-block",
        "list",
        "script",
        "indent",
        "direction",
        "link",
        "image",
        "color",
        "background",
        "align",
        "font",
        "size",
      ],
    })

    window.AtlasAI.richEditor.on("text-change", () => {
      window.AtlasAI.hasUnsavedChanges = true
    })

    if (!window.AtlasAI.richEditor) {
      console.error("Failed to initialize Quill editor.")
      return
    }

    // Convert markdown to HTML and populate editor
    if (initialMarkdownContent) {
      const htmlContent = marked.parse(initialMarkdownContent)
      window.AtlasAI.richEditor.clipboard.dangerouslyPasteHTML(htmlContent)
    }

    window.AtlasAI.richEditor.enable(true)

    setTimeout(() => {
      if (window.AtlasAI.richEditor) {
        window.AtlasAI.richEditor.focus()
      }
      window.AtlasAI.isEnteringEditMode = false
    }, 100)

    console.log("Rich editor (Quill) setup complete")
  }

  function exitEditMode() {
    console.log("Exiting edit mode...")

    window.AtlasAI.isEditing = false
    window.AtlasAI.hasUnsavedChanges = false
    mainContent?.classList.add("edit-mode-exiting")

    setTimeout(() => {
      mainContent?.classList.remove("edit-mode")
      mainContent?.classList.remove("edit-mode-exiting")
    }, 300)

    if (window.AtlasAI.richEditor) {
      const currentHtml = window.AtlasAI.richEditor.root.innerHTML
      const currentMarkdown = window.convertHtmlToMarkdown(currentHtml)

      if (pageContent) {
        pageContent.setAttribute("data-original-content", currentMarkdown)
      }

      window.AtlasAI.richEditor.enable(false)
      document.getElementById("quill-toolbar")?.remove()
      window.AtlasAI.richEditor = null
    }

    if (window.setQuillActive) window.setQuillActive(false)

    if (pageTitle) {
      pageTitle.contentEditable = "false"
      pageTitle.blur() 
    }

    if (pageContent && window.renderMarkdown) {
      window.renderMarkdown()
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur()
    }

    console.log("Edit mode exited")
  }

  function cancelEdit() {
    if (pageTitle && window.AtlasAI.originalTitle) {
      pageTitle.textContent = window.AtlasAI.originalTitle
    }
    if (pageContent && window.AtlasAI.originalContent) {
      pageContent.setAttribute("data-original-content", window.AtlasAI.originalContent)
      if (window.renderMarkdown) window.renderMarkdown()
    }
    exitEditMode()
  }

  function handleEditKeydown(e) {
    if (e.target === pageTitle && e.key === "Enter") {
      e.preventDefault()
      if (pageContent) {
        enterEditMode()
      }
    }
  }

  // Global functions
  window.exitEditMode = exitEditMode

  // Enhanced save function
  window.savePageChanges = async () => {
    console.log("Saving page changes...")
    console.log(window.TurndownService.VERSION);
    const newTitle = pageTitle?.textContent.trim() || ""
    let newContent = ""

    if (window.AtlasAI.richEditor) {
      const quillHtmlContent = window.AtlasAI.richEditor.root.innerHTML
      newContent = window.convertHtmlToMarkdown(quillHtmlContent)
    } else if (pageContent) {
      newContent = window.convertHtmlToMarkdown(pageContent.innerHTML)
    }

    if (!newTitle) {
      if (window.showSaveStatus) window.showSaveStatus("Title cannot be empty", "error")
      return Promise.reject(new Error("Title cannot be empty"))
    }

    console.log("Saving changes:", { title: newTitle, content: newContent.substring(0, 100) + "..." })

    if (window.showSaveStatus) window.showSaveStatus("Saving...", "saving")

    return fetch(`/api/update/${window.AtlasAI.currentPageSlug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error)
        }
        
        window.AtlasAI.originalTitle = newTitle
        window.AtlasAI.originalContent = newContent
        window.AtlasAI.hasUnsavedChanges = false

        if (pageContent) {
          pageContent.setAttribute("data-original-content", newContent)
        }

        if (window.showSaveStatus) window.showSaveStatus("Saved", "saved")
        if (window.updatePageMeta) window.updatePageMeta()
          
        setTimeout(() => {
          exitEditMode()
        }, 500)

        return data
      })
      .catch((error) => {
        console.error("Save error:", error)
        if (window.showSaveStatus) window.showSaveStatus("Save failed", "error")
        throw error
      })
  }

  console.log("Editing module initialized successfully")
}
