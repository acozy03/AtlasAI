// Inline editing functionality - COMPLETE RESTORED VERSION
window.initEditing = () => {
  console.log("Initializing editing module...")

  const pageTitle = document.getElementById("pageTitle")
  const pageContent = document.getElementById("pageContent")
  const mainContent = document.getElementById("mainContent")

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

  setupInlineEditing()

  function setupInlineEditing() {
    console.log("Setting up inline editing...")

    // Edit button functionality
    const editButton = document.getElementById("editButton")
    if (editButton) {
      editButton.addEventListener("click", (e) => {
        e.preventDefault()
        if (!window.AtlasAI.isEditing) {
          enterEditMode()
        } else {
          exitEditMode()
        }
      })
    }

    // Single-click to edit title
    if (pageTitle) {
      pageTitle.addEventListener("click", () => {
        if (!window.AtlasAI.isEditing) {
          enterEditMode()
        }
        pageTitle.contentEditable = "true"
        pageTitle.focus()
        selectAllText(pageTitle)
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

    // Single-click to edit content with rich editor
    if (pageContent) {
      pageContent.addEventListener("click", (e) => {
        if (e.target.closest(".section-toggle")) {
          return
        }

        console.log("Content clicked, entering rich edit mode")
        enterRichEditMode()
      })

      // Save when clicking outside the content area
      document.addEventListener("click", (e) => {
        if (
          window.AtlasAI.isEditing &&
          !e.target.closest("#pageContent") &&
          !e.target.closest(".rich-editor-toolbar") &&
          !e.target.closest("#pageTitle") &&
          !e.target.closest(".link-modal") &&
          !e.target.closest(".color-picker-modal") // Added to ignore color picker
        ) {
          console.log("Clicked outside, saving...")
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
    }

    // Global keyboard shortcuts for editing
    document.addEventListener("keydown", (e) => {
      // Escape to exit edit mode
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

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && window.AtlasAI.isEditing) {
        e.preventDefault()
        window.savePageChanges()
      }

      // Rich editor shortcuts
      if (window.AtlasAI.isEditing && window.AtlasAI.richEditor) {
        handleRichEditorShortcuts(e)
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

    // Store original content
    if (pageTitle) window.AtlasAI.originalTitle = pageTitle.textContent.trim()
    if (pageContent) {
      window.AtlasAI.originalContent = pageContent.getAttribute("data-original-content") || pageContent.textContent
    }

    console.log("Edit mode entered successfully")
  }

  function enterRichEditMode() {
    if (window.AtlasAI.isEditing) {
      console.log("Already in edit mode, focusing content")
      pageContent?.focus()
      return
    }

    console.log("Entering rich edit mode...")
    enterEditMode()
    setupRichEditor()
  }

  function setupRichEditor() {
    if (!pageContent) {
      console.error("No pageContent element for rich editor")
      return
    }

    console.log("Setting up rich editor...")

    // Remove any existing toolbar
    const existingToolbar = document.querySelector(".rich-editor-toolbar")
    if (existingToolbar) {
      existingToolbar.remove()
    }

    const toolbar = createRichEditorToolbar()
    pageContent.parentNode.insertBefore(toolbar, pageContent)

    pageContent.contentEditable = "true"
    pageContent.style.outline = "1px dashed #ccc"
    pageContent.style.userSelect = "text"
    pageContent.style.webkitUserSelect = "text"

    // Focus with a small delay to ensure everything is set up
    setTimeout(() => {
      pageContent.focus()
      console.log("Rich editor focused")
    }, 100)

    window.AtlasAI.richEditor = {
      toolbar: toolbar,
      content: pageContent,
    }

    // Add rich editor event listeners
    pageContent.addEventListener("input", () => {
      window.AtlasAI.hasUnsavedChanges = true
      updateToolbarState()
      // Fix DOM corruption after input
      setTimeout(normalizeDOMStructure, 10)
    })
    pageContent.addEventListener("keydown", handleRichEditorKeydown)
    pageContent.addEventListener("mouseup", updateToolbarState)
    pageContent.addEventListener("keyup", updateToolbarState)
    pageContent.addEventListener("paste", handlePaste)

    updateToolbarState()
    console.log("Rich editor setup complete")
  }

  // NEW: Fix DOM corruption from backspacing between elements
  function normalizeDOMStructure() {
    if (!pageContent) return

    // Find any headers that have been corrupted by backspacing
    const headers = pageContent.querySelectorAll("h1, h2, h3, h4, h5, h6")

    headers.forEach((header) => {
      // Check if header contains mixed content (text nodes + elements)
      const hasTextNodes = Array.from(header.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "",
      )
      const hasElements = Array.from(header.childNodes).some((node) => node.nodeType === Node.ELEMENT_NODE)

      if (hasTextNodes && hasElements) {
        console.log("Found corrupted header, fixing...")

        // Extract all text content
        const textContent = header.textContent

        // Clear the header and set clean text
        header.innerHTML = ""
        header.textContent = textContent

        console.log("Fixed corrupted header")
      }
    })
  }

  function createRichEditorToolbar() {
    const toolbar = document.createElement("div")
    toolbar.className = "rich-editor-toolbar"
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-command="bold" title="Bold (Ctrl+B)">
          <i class="fas fa-bold"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="italic" title="Italic (Ctrl+I)">
          <i class="fas fa-italic"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="underline" title="Underline (Ctrl+U)">
          <i class="fas fa-underline"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="strikethrough" title="Strikethrough">
          <i class="fas fa-strikethrough"></i>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-command="h1" title="Heading 1">
          <i class="fas fa-heading"></i>
          <span class="heading-level">1</span>
        </button>
        <button type="button" class="toolbar-btn" data-command="h2" title="Heading 2">
          <i class="fas fa-heading"></i>
          <span class="heading-level">2</span>
        </button>
        <button type="button" class="toolbar-btn" data-command="h3" title="Heading 3">
          <i class="fas fa-heading"></i>
          <span class="heading-level">3</span>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
          <i class="fas fa-list-ul"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
          <i class="fas fa-list-ol"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="blockquote" title="Quote">
          <i class="fas fa-quote-left"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="code" title="Code">
          <i class="fas fa-code"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="link" title="Add Link">
          <i class="fas fa-link"></i>
        </button>
        <button type="button" class="toolbar-btn" data-command="foreColor" title="Font Color">
          <i class="fas fa-palette"></i>
        </button>
      </div>
      
      <div class="toolbar-separator"></div>
      
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn toolbar-btn-success" data-command="save" title="Save (Ctrl+S)">
          <i class="fas fa-save"></i>
          <span>Save</span>
        </button>
        <button type="button" class="toolbar-btn toolbar-btn-secondary" data-command="cancel" title="Cancel (Esc)">
          <i class="fas fa-times"></i>
          <span>Cancel</span>
        </button>
      </div>
    `

    toolbar.addEventListener("click", handleToolbarClick)
    return toolbar
  }

  function handleToolbarClick(e) {
    const btn = e.target.closest(".toolbar-btn")
    if (!btn) return

    e.preventDefault()
    e.stopPropagation()
    const command = btn.dataset.command

    console.log("Toolbar command:", command)

    switch (command) {
      case "bold":
      case "italic":
      case "underline":
      case "strikethrough":
        document.execCommand(command, false, null)
        window.AtlasAI.hasUnsavedChanges = true
        break
      case "h1":
      case "h2":
      case "h3":
        formatAsHeading(command)
        window.AtlasAI.hasUnsavedChanges = true
        break
      case "insertUnorderedList":
      case "insertOrderedList":
        document.execCommand(command, false, null)
        window.AtlasAI.hasUnsavedChanges = true
        break
      case "blockquote":
        formatAsBlockquote()
        window.AtlasAI.hasUnsavedChanges = true
        break
      case "code":
        formatAsCode()
        window.AtlasAI.hasUnsavedChanges = true
        break
      case "link":
        showLinkModal()
        break
      case "foreColor":
        showColorPicker()
        break
      case "save":
        window.savePageChanges()
        break
      case "cancel":
        cancelEdit()
        break
    }

    setTimeout(updateToolbarState, 10)
    pageContent?.focus()
  }

  // TOGGLE: Header formatting function - toggles headers on/off
  function formatAsHeading(level) {
    console.log("Formatting as heading:", level)

    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let element = range.commonAncestorContainer

    // Get the actual element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement
    }

    // Find the block element (heading or paragraph)
    while (element && element !== pageContent) {
      if (element.tagName && /^(H[1-6]|P|DIV)$/.test(element.tagName)) {
        break
      }
      element = element.parentElement
    }

    if (!element || element === pageContent) {
      // No block element found, just use formatBlock
      document.execCommand("formatBlock", false, level)
      return
    }

    // Check if we're already the target heading level
    const currentTag = element.tagName.toLowerCase()
    const targetTag = level.toLowerCase()

    let newTag
    if (currentTag === targetTag) {
      // Already this heading level - toggle it off (convert to paragraph)
      newTag = "p"
      console.log(`Toggling ${targetTag} OFF - converting to paragraph`)
    } else {
      // Different level or not a heading - convert to target heading
      newTag = targetTag
      console.log(`Converting ${currentTag} to ${targetTag}`)
    }

    // Create new element with the target tag
    const newElement = document.createElement(newTag)

    // Copy the exact content
    newElement.innerHTML = element.innerHTML

    // Copy any classes
    if (element.className) {
      newElement.className = element.className
    }

    // Replace the element
    element.parentNode.replaceChild(newElement, element)

    // Put cursor at the end of the new element
    const newRange = document.createRange()
    newRange.selectNodeContents(newElement)
    newRange.collapse(false) // Collapse to end
    selection.removeAllRanges()
    selection.addRange(newRange)

    console.log(`Header formatting complete - now ${newTag.toUpperCase()}`)
  }

  function formatAsBlockquote() {
    document.execCommand("formatBlock", false, "blockquote")
  }

  function formatAsCode() {
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (selectedText) {
      const code = document.createElement("code")
      code.textContent = selectedText
      range.deleteContents()
      range.insertNode(code)
      selection.removeAllRanges()
    }
  }

  function showLinkModal() {
    if (window.showLinkModal) {
      window.showLinkModal()
    }
  }

  // NEW: Function to show color picker
  function showColorPicker() {
    const toolbar = window.AtlasAI.richEditor.toolbar
    const colorButton = toolbar.querySelector('[data-command="foreColor"]')
    const rect = colorButton.getBoundingClientRect()

    const modal = document.createElement("div")
    modal.className = "modal-overlay color-picker-modal"
    modal.style.position = "absolute"; // Make it absolute for positioning relative to the button
    modal.style.top = `${rect.bottom + window.scrollY + 5}px`; // Position below the button
    modal.style.left = `${rect.left + window.scrollX}px`;
    modal.style.background = "var(--bg-secondary)";
    modal.style.border = "1px solid var(--border-primary)";
    modal.style.borderRadius = "0.5rem";
    modal.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
    modal.style.padding = "1rem";
    modal.style.maxWidth = "200px";
    modal.style.zIndex = "101"; // Higher than other modals

    modal.innerHTML = `
      <div class="form-group">
        <label for="colorInput" style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Select Color</label>
        <input type="color" id="colorInput" value="#3b82f6" style="width: 100%; height: 40px; border: none; padding: 0; background: none;">
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button type="button" class="btn btn-secondary" id="cancelColor">Cancel</button>
        <button type="button" class="btn btn-primary" id="applyColor">Apply</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#applyColor").addEventListener("click", () => {
        const color = modal.querySelector("#colorInput").value;
        document.execCommand('foreColor', false, color);
        window.AtlasAI.hasUnsavedChanges = true;
        modal.remove();
        pageContent?.focus();
        updateToolbarState();
    });

    modal.querySelector("#cancelColor").addEventListener("click", () => {
        modal.remove();
        pageContent?.focus();
    });

    // Close on click outside the modal itself (but not the toolbar button that opened it)
    document.addEventListener("click", function closeColorPickerOnOutsideClick(event) {
        if (!modal.contains(event.target) && !colorButton.contains(event.target)) {
            modal.remove();
            document.removeEventListener("click", closeColorPickerOnOutsideClick);
        }
    });
  }


  function updateToolbarState() {
    if (!window.AtlasAI.richEditor) return

    const toolbar = window.AtlasAI.richEditor.toolbar
    const commands = ["bold", "italic", "underline", "strikethrough"]

    commands.forEach((command) => {
      const btn = toolbar.querySelector(`[data-command="${command}"]`)
      if (btn) {
        const isActive = document.queryCommandState(command)
        btn.classList.toggle("active", isActive)
      }
    })

    // Update heading buttons
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      let element = selection.anchorNode
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement
      }

      // Clear all heading active states
      toolbar.querySelectorAll('[data-command^="h"]').forEach((btn) => btn.classList.remove("active"))

      // Set active heading - walk up the DOM to find heading
      let currentElement = element
      while (currentElement && currentElement !== pageContent) {
        if (currentElement.tagName && /^H[1-6]$/.test(currentElement.tagName)) {
          const level = currentElement.tagName.toLowerCase()
          const btn = toolbar.querySelector(`[data-command="${level}"]`)
          if (btn) btn.classList.add("active")
          break
        }
        currentElement = currentElement.parentElement
      }
    }
  }

  function handleRichEditorShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          document.execCommand("bold", false, null)
          window.AtlasAI.hasUnsavedChanges = true
          break
        case "i":
          e.preventDefault()
          document.execCommand("italic", false, null)
          window.AtlasAI.hasUnsavedChanges = true
          break
        case "u":
          e.preventDefault()
          document.execCommand("underline", false, null)
          window.AtlasAI.hasUnsavedChanges = true
          break
      }
    }
  }

  function handleRichEditorKeydown(e) {
    window.AtlasAI.hasUnsavedChanges = true; // Any keydown implies changes

    // NEW: Automatic bullet point on '-' followed by space
    if (e.key === ' ' && e.target === pageContent) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textBeforeCursor = range.startContainer.textContent.substring(0, range.startOffset);

            // Check if it's the start of a line and the last non-whitespace characters are '-'
            // This is a simple check, more robust parsing for indentation might be needed for perfect nested list creation.
            const lineStartMatch = textBeforeCursor.match(/(\s*)-$/);
            
            if (lineStartMatch) {
                // Prevent the space from being typed
                e.preventDefault();

                // Remove the '-'
                const startOfLine = range.startOffset - (lineStartMatch[0].length);
                range.setStart(range.startContainer, startOfLine);
                range.deleteContents();

                // Insert a list item
                document.execCommand('insertUnorderedList');
                
                window.AtlasAI.hasUnsavedChanges = true;
                return; // Stop further processing to avoid default space insertion
            }
        }
    }

    if (e.key === "Enter") {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let element = range.commonAncestorContainer
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement
        }

        // If we're in a heading, create a new paragraph
        if (element.tagName && /^H[1-6]$/.test(element.tagName)) {
          if (range.collapsed && range.endOffset === element.textContent.length) {
            e.preventDefault()
            document.execCommand("insertParagraph")
          }
        }
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData("text/plain")
    document.execCommand("insertText", false, text)
    window.AtlasAI.hasUnsavedChanges = true
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
      window.AtlasAI.richEditor.toolbar.remove()
      window.AtlasAI.richEditor = null
    }

    if (pageTitle) {
      pageTitle.contentEditable = "false"
      pageTitle.blur()
    }
    if (pageContent) {
      pageContent.contentEditable = "false"
      pageContent.style.outline = ""
      pageContent.blur()
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur()
    }

    if (pageContent && window.renderMarkdown) {
      window.renderMarkdown()
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
        enterRichEditMode()
      }
    }
  }

  function selectAllText(element) {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  // Global functions
  window.exitEditMode = exitEditMode

  // Save page changes function
  window.savePageChanges = async () => {
    console.log("Saving page changes...")

    const newTitle = pageTitle?.textContent.trim() || ""
    let newContent = ""

    if (pageContent) {
      newContent = window.convertHtmlToMarkdown
        ? window.convertHtmlToMarkdown(pageContent.innerHTML)
        : pageContent.innerHTML
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