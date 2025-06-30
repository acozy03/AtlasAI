// document.addEventListener("DOMContentLoaded", () => {
//   // Import necessary libraries
//   const marked = window.marked // Assuming marked is available globally
//   const TurndownService = window.TurndownService // Assuming TurndownService is available globally
//   const Quill = window.Quill // Assuming Quill is available globally

//   // Check if the user is authenticated
//   function checkAuthentication() {
//     return fetch("/api/auth/check")
//       .then((response) => response.json())
//       .then((data) => data.isAuthenticated)
//       .catch((error) => {
//         console.error("Error checking authentication:", error)
//         return false // Assume not authenticated in case of error
//       })
//   }

//   // Function to update the UI based on authentication status
//   function updateUI(isAuthenticated) {
//     const loginButton = document.getElementById("loginButton")
//     const logoutButton = document.getElementById("logoutButton")
//     const editButton = document.getElementById("editButton")

//     if (isAuthenticated) {
//       loginButton.style.display = "none"
//       logoutButton.style.display = "inline-block"
//       editButton.style.display = "inline-block"
//     } else {
//       loginButton.style.display = "inline-block"
//       logoutButton.style.display = "none"
//       editButton.style.display = "none"
//     }
//   }

//   // Initial check and UI update
//   checkAuthentication().then(updateUI)

//   // Logout button event listener
//   const logoutButton = document.getElementById("logoutButton")
//   if (logoutButton) {
//     logoutButton.addEventListener("click", (event) => {
//       event.preventDefault()
//       fetch("/api/auth/logout", {
//         method: "POST",
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           if (data.success) {
//             updateUI(false)
//             window.location.href = "/" // Redirect to home page after logout
//           } else {
//             console.error("Logout failed:", data.message)
//           }
//         })
//         .catch((error) => console.error("Logout error:", error))
//     })
//   }

//   // Event listener for the login button
//   const loginButton = document.getElementById("loginButton")
//   if (loginButton) {
//     loginButton.addEventListener("click", (event) => {
//       event.preventDefault()
//       window.location.href = "/login" // Redirect to the login page
//     })
//   }

//   // Collapsible sections setup
//   function setupCollapsibleSections() {
//     const collapsibles = document.querySelectorAll(".collapsible")

//     collapsibles.forEach((collapsible) => {
//       // Check if the collapsible has the 'open' attribute
//       const isOpen = collapsible.hasAttribute("open")

//       // Set initial display based on the 'open' attribute
//       const content = collapsible.querySelector(".content")
//       if (content) {
//         content.style.display = isOpen ? "block" : "none"
//       }

//       collapsible.addEventListener("click", function () {
//         const content = this.querySelector(".content")
//         if (content) {
//           const isCurrentlyOpen = content.style.display === "block"
//           content.style.display = isCurrentlyOpen ? "none" : "block"
//         }
//       })
//     })
//   }

//   setupCollapsibleSections()

//   // Function to render markdown
//   function renderMarkdown() {
//     const pageContent = document.getElementById("pageContent")
//     if (pageContent) {
//       const markdownText = pageContent.getAttribute("data-original-content")
//       if (markdownText) {
//         pageContent.innerHTML = marked.parse(markdownText)
//         setupCollapsibleSections() // Call setupCollapsibleSections after rendering markdown
//       }
//     }
//   }

//   renderMarkdown()

//   // Edit mode functionality
//   let isEditing = false
//   let originalTitle = document.getElementById("pageTitle")?.textContent || ""
//   let originalContent = document.getElementById("pageContent")?.getAttribute("data-original-content") || ""
//   let hasUnsavedChanges = false
//   let richEditor = null
//   const mainContent = document.getElementById("mainContent")
//   const pageTitle = document.getElementById("pageTitle")
//   const pageContent = document.getElementById("pageContent")
//   const currentPageSlug = window.location.pathname.split("/").pop() // Extract slug from URL

//   // Function to convert HTML to Markdown
//   function convertHtmlToMarkdown(html) {
//     // Use turndown to convert HTML to Markdown
//     const turndownService = new TurndownService()
//     return turndownService.turndown(html)
//   }

//   // Function to show save status
//   function showSaveStatus(message, statusType) {
//     const statusDiv = document.getElementById("saveStatus")
//     statusDiv.textContent = message
//     statusDiv.className = `save-status ${statusType}` // Use class names for styling
//     statusDiv.style.display = "block" // Make sure the element is visible

//     // Hide the status message after a delay
//     setTimeout(() => {
//       statusDiv.style.display = "none"
//     }, 3000) // Adjust the duration as needed
//   }

//   // Function to update page meta description
//   function updatePageMeta() {
//     const metaDescription = document.querySelector('meta[name="description"]')
//     const pageContent = document.getElementById("pageContent")

//     if (metaDescription && pageContent) {
//       // Extract the first paragraph or a snippet of the content
//       const firstParagraph = pageContent.querySelector("p")
//       let contentSnippet = firstParagraph
//         ? firstParagraph.textContent.substring(0, 150)
//         : pageContent.textContent.substring(0, 150) // Fallback to the whole content

//       // Truncate and add ellipsis if the snippet is too long
//       contentSnippet = contentSnippet.length > 150 ? contentSnippet.substring(0, 147) + "..." : contentSnippet

//       metaDescription.setAttribute("content", contentSnippet)
//     }
//   }

//   // Function to exit edit mode
//   function exitEditMode() {
//     isEditing = false
//     hasUnsavedChanges = false

//     // Add fadeout animation for edit mode bar
//     mainContent?.classList.add("edit-mode-exiting")

//     setTimeout(() => {
//       mainContent?.classList.remove("edit-mode")
//       mainContent?.classList.remove("edit-mode-exiting")
//     }, 300)

//     // Remove rich editor toolbar
//     if (richEditor) {
//       richEditor.toolbar.remove()
//       richEditor = null
//     }

//     // Make sure nothing is editable and remove focus
//     if (pageTitle) {
//       pageTitle.contentEditable = "false"
//       pageTitle.blur() // Ensure title loses focus
//     }
//     if (pageContent) {
//       pageContent.contentEditable = "false"
//       pageContent.style.outline = ""
//       pageContent.blur() // Ensure content loses focus
//     }

//     // Remove focus from any active element
//     if (document.activeElement && document.activeElement.blur) {
//       document.activeElement.blur()
//     }

//     // Re-render markdown and sections after editing
//     if (pageContent) {
//       renderMarkdown()
//       setupCollapsibleSections()
//     }

//     console.log("Exited edit mode") // Debug log
//   }

//   // Function to set up inline editing
//   function setupInlineEditing() {
//     const editButton = document.getElementById("editButton")
//     if (!editButton) return

//     editButton.addEventListener("click", () => {
//       if (!isEditing) {
//         // Enter edit mode
//         isEditing = true
//         mainContent?.classList.add("edit-mode")

//         // Make title editable
//         if (pageTitle) {
//           pageTitle.contentEditable = "true"
//           pageTitle.focus() // Focus the title for immediate editing
//           originalTitle = pageTitle.textContent // Store original title
//         }

//         // Make content editable and initialize rich editor
//         if (pageContent) {
//           pageContent.contentEditable = "true"
//           pageContent.style.outline = "1px dashed #ccc"
//           pageContent.focus() // Focus the content for immediate editing
//           originalContent = pageContent.getAttribute("data-original-content") // Store original content

//           // Initialize rich editor
//           richEditor = new Quill("#pageContent", {
//             modules: {
//               toolbar: [
//                 [{ header: [1, 2, false] }],
//                 ["bold", "italic", "underline", "strike"],
//                 ["link", "image", "code-block"],
//                 [{ list: "ordered" }, { list: "bullet" }],
//                 ["clean"],
//               ],
//             },
//             placeholder: "Compose an epic...",
//             theme: "snow", // or 'bubble'
//           })

//           // Set initial content for the rich editor
//           richEditor.root.innerHTML = marked.parse(originalContent)

//           // Event listener for content changes
//           richEditor.on("text-change", () => {
//             hasUnsavedChanges = true
//           })
//         }
//       } else {
//         // Exit edit mode
//         exitEditMode()
//       }
//     })

//     // Listen for changes in title
//     pageTitle?.addEventListener("input", () => {
//       hasUnsavedChanges = true
//     })

//     // Save when pressing Ctrl/Cmd + S
//     document.addEventListener("keydown", (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === "s") {
//         e.preventDefault()
//         if (isEditing && hasUnsavedChanges) {
//           window.savePageChanges()
//         }
//       }
//     })

//     // Save when clicking outside the content area
//     document.addEventListener("click", (e) => {
//       if (
//         isEditing &&
//         !e.target.closest("#pageContent") &&
//         !e.target.closest(".rich-editor-toolbar") &&
//         !e.target.closest("#pageTitle") &&
//         !e.target.closest(".link-modal")
//       ) {
//         if (hasUnsavedChanges) {
//           window.savePageChanges().then(() => {
//             // Small delay to ensure proper state cleanup
//             setTimeout(() => {
//               isEditing = false
//               hasUnsavedChanges = false
//             }, 100)
//           })
//         } else {
//           exitEditMode()
//         }
//       }
//     })
//   }

//   // Initialize inline editing
//   setupInlineEditing()

//   // Function to handle saving page changes
//   window.savePageChanges = async () => {
//     const pageTitle = document.getElementById("pageTitle")
//     const pageContent = document.getElementById("pageContent")

//     const newTitle = pageTitle?.textContent.trim() || ""
//     let newContent = ""

//     if (pageContent) {
//       // Convert rich content back to markdown
//       newContent = convertHtmlToMarkdown(pageContent.innerHTML)
//     }

//     if (!newTitle) {
//       showSaveStatus("Title cannot be empty", "error")
//       return Promise.reject(new Error("Title cannot be empty"))
//     }

//     console.log("Saving changes:", { title: newTitle, content: newContent.substring(0, 100) + "..." })

//     showSaveStatus("Saving...", "saving")

//     return fetch(`/api/update/${currentPageSlug}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         title: newTitle,
//         content: newContent,
//       }),
//     })
//       .then((response) => {
//         console.log("Response status:", response.status)
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`)
//         }
//         return response.json()
//       })
//       .then((data) => {
//         console.log("Save response:", data)

//         if (data.error) {
//           throw new Error(data.error)
//         }

//         // Update stored original values
//         originalTitle = newTitle
//         originalContent = newContent
//         hasUnsavedChanges = false

//         // Update the data attribute for future edits
//         if (pageContent) {
//           pageContent.setAttribute("data-original-content", newContent)
//         }

//         showSaveStatus("Saved", "saved")
//         updatePageMeta()

//         // Exit edit mode after successful save with a small delay
//         setTimeout(() => {
//           exitEditMode()
//         }, 500) // Give user time to see the "Saved" status

//         return data // Return the data for promise chaining
//       })
//       .catch((error) => {
//         console.error("Save error:", error)
//         showSaveStatus("Save failed", "error")
//         throw error
//       })
//   }
// })

// // Chat functionality
// document.addEventListener("DOMContentLoaded", () => {
//   // Elements
//   const sidebar = document.getElementById("sidebar")
//   const mainContent = document.getElementById("mainContent")
//   const chatPanel = document.getElementById("chatPanel")
//   const overlay = document.getElementById("overlay")
//   const toggleSidebarBtn = document.getElementById("toggleSidebar")
//   const toggleChatBtn = document.getElementById("toggleChat")
//   const closeChatBtn = document.getElementById("closeChatPanel")
//   const chatForm = document.getElementById("chatForm")
//   const chatInput = document.getElementById("chatInput")
//   const chatMessages = document.getElementById("chatMessages")
//   const searchInput = document.getElementById("searchPages")
//   const globalSearchInput = document.getElementById("globalSearch")

//   // State
//   let sidebarOpen = true
//   let chatOpen = false
//   let isMobile = window.innerWidth < 768
//   let originalTitle = ""
//   let originalContent = ""
//   let currentPageSlug = ""
//   let richEditor = null
//   let isEditing = false
//   let hasUnsavedChanges = false

//   // Initialize
//   init()

//   function init() {
//     setupEventListeners()
//     setupResponsive()
//     setupAnimations()
//     setupInlineEditing()
//     setupSidebarCollapse()
//     setupMarkdownRendering()
//     setupCollapsibleSections()
//     setupSidebarMenus()
//     setupGlobalSearch()

//     // Auto-hide flash messages
//     setTimeout(() => {
//       const flashMessages = document.querySelectorAll(".flash-message")
//       flashMessages.forEach((msg) => {
//         msg.style.transform = "translateX(100%)"
//         msg.style.opacity = "0"
//         setTimeout(() => msg.remove(), 300)
//       })
//     }, 5000)

//     console.log("AtlasAI initialized successfully!")
//   }

//   function setupEventListeners() {
//     // Sidebar toggle
//     if (toggleSidebarBtn) {
//       toggleSidebarBtn.addEventListener("click", (e) => {
//         e.preventDefault()
//         toggleSidebar()
//       })
//     }

//     // Chat toggle
//     if (toggleChatBtn) {
//       toggleChatBtn.addEventListener("click", (e) => {
//         e.preventDefault()
//         toggleChat()
//       })
//     }

//     if (closeChatBtn) {
//       closeChatBtn.addEventListener("click", (e) => {
//         e.preventDefault()
//         closeChat()
//       })
//     }

//     // Overlay click
//     if (overlay) {
//       overlay.addEventListener("click", closeAllPanels)
//     }

//     // Chat form
//     if (chatForm) {
//       chatForm.addEventListener("submit", handleChatSubmit)
//     }

//     // Search
//     if (searchInput) {
//       searchInput.addEventListener("input", handleSearch)
//       searchInput.addEventListener("focus", () => {
//         searchInput.parentElement.style.transform = "scale(1.02)"
//       })
//       searchInput.addEventListener("blur", () => {
//         searchInput.parentElement.style.transform = "scale(1)"
//       })
//     }

//     // Keyboard shortcuts
//     document.addEventListener("keydown", handleKeyboardShortcuts)

//     // Window resize
//     window.addEventListener("resize", handleResize)

//     // Intercept page navigation to save changes
//     document.addEventListener("click", handlePageNavigation)

//     console.log("Event listeners setup complete")
//   }

//   function setupGlobalSearch() {
//     if (!globalSearchInput) return

//     let searchTimeout = null

//     globalSearchInput.addEventListener("input", (e) => {
//       clearTimeout(searchTimeout)
//       const query = e.target.value.trim()

//       if (query.length < 2) {
//         hideSearchResults()
//         return
//       }

//       searchTimeout = setTimeout(() => {
//         performGlobalSearch(query)
//       }, 300)
//     })

//     globalSearchInput.addEventListener("focus", () => {
//       if (globalSearchInput.value.trim().length >= 2) {
//         showSearchResults()
//       }
//     })

//     // Close search results when clicking outside
//     document.addEventListener("click", (e) => {
//       if (!e.target.closest(".global-search-container")) {
//         hideSearchResults()
//       }
//     })
//   }

//   async function performGlobalSearch(query) {
//     try {
//       const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
//       const results = await response.json()

//       displaySearchResults(results)
//     } catch (error) {
//       console.error("Search error:", error)
//     }
//   }

//   function displaySearchResults(results) {
//     let resultsContainer = document.querySelector(".search-results")

//     if (!resultsContainer) {
//       resultsContainer = document.createElement("div")
//       resultsContainer.className = "search-results"
//       globalSearchInput.parentElement.appendChild(resultsContainer)
//     }

//     if (results.length === 0) {
//       resultsContainer.innerHTML = `
//         <div class="search-result-item no-results">
//           <i class="fas fa-search"></i>
//           <span>No results found</span>
//         </div>
//       `
//     } else {
//       resultsContainer.innerHTML = results
//         .map(
//           (result) => `
//         <a href="/wiki/${result.slug}" class="search-result-item">
//           <div class="result-header">
//             <i class="fas fa-file-text"></i>
//             <span class="result-title">${result.title}</span>
//           </div>
//           <div class="result-snippet">${result.snippet}</div>
//         </a>
//       `,
//         )
//         .join("")
//     }

//     showSearchResults()
//   }

//   function showSearchResults() {
//     const resultsContainer = document.querySelector(".search-results")
//     if (resultsContainer) {
//       resultsContainer.classList.add("show")
//     }
//   }

//   function hideSearchResults() {
//     const resultsContainer = document.querySelector(".search-results")
//     if (resultsContainer) {
//       resultsContainer.classList.remove("show")
//     }
//   }

//   function handlePageNavigation(e) {
//     const pageLink = e.target.closest(".page-link")
//     if (pageLink && isEditing && hasUnsavedChanges) {
//       e.preventDefault()

//       // Save changes first, then navigate
//       window
//         .savePageChanges()
//         .then(() => {
//           window.location.href = pageLink.href
//         })
//         .catch(() => {
//           // If save fails, ask user what to do
//           if (confirm("Failed to save changes. Navigate anyway?")) {
//             window.location.href = pageLink.href
//           }
//         })
//     }
//   }

//   function setupResponsive() {
//     isMobile = window.innerWidth < 768

//     if (isMobile) {
//       sidebarOpen = false
//       sidebar?.classList.add("collapsed")
//       mainContent?.classList.add("expanded")
//     }
//   }

//   function setupAnimations() {
//     // Remove the fade-in animations for sidebar elements
//     // Only keep animations for chat messages
//     const chatMessages = document.querySelectorAll(".message-content")

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.style.opacity = "1"
//             entry.target.style.transform = "translateY(0)"
//           }
//         })
//       },
//       { threshold: 0.1 },
//     )

//     chatMessages.forEach((el) => {
//       el.style.opacity = "0"
//       el.style.transform = "translateY(20px)"
//       el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
//       observer.observe(el)
//     })
//   }

//   function toggleSidebar() {
//     console.log("Toggling sidebar, current state:", sidebarOpen)
//     sidebarOpen = !sidebarOpen

//     if (sidebarOpen) {
//       sidebar?.classList.remove("collapsed")
//       mainContent?.classList.remove("expanded")
//       if (isMobile) {
//         overlay?.classList.add("visible")
//         document.body.style.overflow = "hidden"
//       }
//     } else {
//       sidebar?.classList.add("collapsed")
//       mainContent?.classList.add("expanded")
//       if (isMobile) {
//         overlay?.classList.remove("visible")
//         document.body.style.overflow = "auto"
//       }
//     }

//     // Update button icon with animation
//     const icon = toggleSidebarBtn?.querySelector("i")
//     if (icon) {
//       icon.style.transform = "rotate(180deg)"
//       setTimeout(() => {
//         icon.className = sidebarOpen ? "fas fa-bars" : "fas fa-arrow-right"
//         icon.style.transform = "rotate(0deg)"
//       }, 150)
//     }

//     console.log("Sidebar toggled, new state:", sidebarOpen)
//   }

//   function toggleChat() {
//     console.log("Toggling chat, current state:", chatOpen)
//     chatOpen = !chatOpen

//     if (chatOpen) {
//       chatPanel?.classList.add("open")
//       if (isMobile) {
//         overlay?.classList.add("visible")
//         document.body.style.overflow = "hidden"
//       }
//       // Focus chat input
//       setTimeout(() => chatInput?.focus(), 300)
//     } else {
//       closeChat()
//     }

//     console.log("Chat toggled, new state:", chatOpen)
//   }

//   function closeChat() {
//     chatOpen = false
//     chatPanel?.classList.remove("open")
//     if (isMobile) {
//       overlay?.classList.remove("visible")
//       document.body.style.overflow = "auto"
//     }
//   }

//   function closeAllPanels() {
//     if (sidebarOpen && isMobile) {
//       toggleSidebar()
//     }
//     if (chatOpen) {
//       closeChat()
//     }
//   }

//   async function handleChatSubmit(e) {
//     e.preventDefault()

//     const message = chatInput?.value.trim()
//     if (!message) return

//     // Add user message
//     addMessage(message, "user")
//     chatInput.value = ""

//     // Show loading
//     const loadingDiv = addMessage("Thinking...", "bot", true)

//     try {
//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message }),
//       })

//       const data = await response.json()
//       loadingDiv.remove()

//       if (data.error) {
//         addMessage("Sorry, I encountered an error. Please try again.", "bot")
//       } else {
//         addMessage(data.response, "bot")

//         if (data.sources?.length > 0) {
//           addSourcesMessage(data.sources)
//         }
//       }
//     } catch (error) {
//       loadingDiv.remove()
//       addMessage("Sorry, I encountered an error. Please try again.", "bot")
//     }

//     scrollChatToBottom()
//   }

//   function addMessage(content, sender, isLoading = false) {
//     const messageDiv = document.createElement("div")
//     messageDiv.className = `${sender}-message animate-fade-in`

//     if (sender === "bot") {
//       messageDiv.innerHTML = `
//         <i class="fas fa-robot"></i>
//         <div class="message-content ${isLoading ? "loading" : ""}">
//           ${content}
//           ${
//             !isLoading
//               ? `
//             <div class="feedback-buttons">
//               <button onclick="sendFeedback(true)" title="Helpful">
//                 <i class="fas fa-thumbs-up"></i>
//               </button>
//               <button onclick="sendFeedback(false)" title="Not helpful">
//                 <i class="fas fa-thumbs-down"></i>
//               </button>
//             </div>
//           `
//               : ""
//           }
//         </div>
//       `
//     } else {
//       messageDiv.innerHTML = `
//         <div class="message-content">${content}</div>
//         <i class="fas fa-user"></i>
//       `
//     }

//     // Remove welcome message
//     const welcomeMessage = chatMessages?.querySelector(".welcome-message")
//     welcomeMessage?.remove()

//     chatMessages?.appendChild(messageDiv)
//     return messageDiv
//   }

//   function addSourcesMessage(sources) {
//     const sourcesDiv = document.createElement("div")
//     sourcesDiv.className = "bot-message animate-fade-in"
//     sourcesDiv.innerHTML = `
//       <i class="fas fa-link text-blue-400"></i>
//       <div class="message-content text-sm" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3);">
//         <strong>Sources:</strong> ${sources.join(", ")}
//       </div>
//     `
//     chatMessages?.appendChild(sourcesDiv)
//   }

//   function scrollChatToBottom() {
//     if (chatMessages) {
//       chatMessages.scrollTop = chatMessages.scrollHeight
//     }
//   }

//   function handleSearch() {
//     const searchTerm = searchInput?.value.toLowerCase() || ""
//     const pageItems = document.querySelectorAll(".page-item")

//     pageItems.forEach((item) => {
//       const text = item.textContent.toLowerCase()
//       const shouldShow = text.includes(searchTerm)

//       item.style.opacity = shouldShow ? "1" : "0.3"
//       item.style.transform = shouldShow ? "translateX(0)" : "translateX(-10px)"
//       item.style.transition = "opacity 0.3s ease, transform 0.3s ease"
//     })
//   }

//   function handleKeyboardShortcuts(e) {
//     // Ctrl/Cmd + K to focus search
//     if ((e.ctrlKey || e.metaKey) && e.key === "k") {
//       e.preventDefault()
//       globalSearchInput?.focus()
//     }

//     // Ctrl/Cmd + / to toggle chat
//     if ((e.ctrlKey || e.metaKey) && e.key === "/") {
//       e.preventDefault()
//       toggleChat()
//     }

//     // Escape to close panels
//     if (e.key === "Escape") {
//       closeAllPanels()
//     }
//   }

//   function handleResize() {
//     const wasMobile = isMobile
//     isMobile = window.innerWidth < 768

//     if (wasMobile !== isMobile) {
//       setupResponsive()
//     }
//   }

//   // Global functions
//   window.sendFeedback = (isHelpful) => {
//     fetch("/api/feedback", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ helpful: isHelpful }),
//     })

//     // Visual feedback
//     event.target.style.color = isHelpful ? "var(--accent-green)" : "var(--accent-red)"
//     event.target.style.transform = "scale(1.2)"
//     setTimeout(() => {
//       event.target.style.transform = "scale(1)"
//     }, 200)
//   }

//   function setupInlineEditing() {
//     const pageTitle = document.getElementById("pageTitle")
//     const pageContent = document.getElementById("pageContent")
//     const mainContent = document.getElementById("mainContent")

//     // Get current page slug from URL
//     const pathParts = window.location.pathname.split("/")
//     currentPageSlug = pathParts[pathParts.length - 1] || "home"

//     console.log("Current page slug:", currentPageSlug) // Debug log

//     // Single-click to edit title
//     if (pageTitle) {
//       pageTitle.addEventListener("click", () => {
//         enterEditMode()
//         pageTitle.contentEditable = "true"
//         pageTitle.focus()
//         selectAllText(pageTitle)
//       })

//       pageTitle.addEventListener("blur", () => {
//         pageTitle.contentEditable = "false"
//         if (hasUnsavedChanges) {
//           window.savePageChanges()
//         }
//       })

//       pageTitle.addEventListener("input", () => {
//         hasUnsavedChanges = true
//       })

//       pageTitle.addEventListener("keydown", handleEditKeydown)
//     }

//     // Single-click to edit content with rich editor
//     if (pageContent) {
//       pageContent.addEventListener("click", (e) => {
//         // Don't enter edit mode if clicking on section toggles
//         if (e.target.closest(".section-toggle")) {
//           return
//         }

//         enterRichEditMode()
//       })

//       // Save when clicking outside the content area - FIXED VERSION
//       document.addEventListener("click", (e) => {
//         if (
//           isEditing &&
//           !e.target.closest("#pageContent") &&
//           !e.target.closest(".rich-editor-toolbar") &&
//           !e.target.closest("#pageTitle") &&
//           !e.target.closest(".link-modal")
//         ) {
//           if (hasUnsavedChanges) {
//             window.savePageChanges().then(() => {
//               // Small delay to ensure proper state cleanup
//               setTimeout(() => {
//                 isEditing = false
//                 hasUnsavedChanges = false
//               }, 100)
//             })
//           } else {
//             exitEditMode()
//           }
//         }
//       })
//     }

//     // Global keyboard shortcuts
//     document.addEventListener("keydown", (e) => {
//       // Escape to exit edit mode
//       if (e.key === "Escape" && isEditing) {
//         if (hasUnsavedChanges) {
//           if (confirm("You have unsaved changes. Save before exiting?")) {
//             window.savePageChanges()
//           } else {
//             cancelEdit()
//           }
//         } else {
//           exitEditMode()
//         }
//       }

//       // Ctrl/Cmd + S to save
//       if ((e.ctrlKey || e.metaKey) && e.key === "s" && isEditing) {
//         e.preventDefault()
//         window.savePageChanges()
//       }

//       // Rich editor shortcuts
//       if (isEditing && richEditor) {
//         handleRichEditorShortcuts(e)
//       }
//     })

//     function enterEditMode() {
//       if (isEditing) return

//       isEditing = true
//       hasUnsavedChanges = false
//       mainContent?.classList.add("edit-mode")

//       // Store original content
//       if (pageTitle) originalTitle = pageTitle.textContent.trim()
//       if (pageContent) {
//         originalContent = pageContent.getAttribute("data-original-content") || pageContent.textContent
//       }

//       console.log("Entered edit mode") // Debug log
//     }

//     function enterRichEditMode() {
//       if (isEditing) return

//       enterEditMode()
//       setupRichEditor()
//     }

//     function setupRichEditor() {
//       if (!pageContent) return

//       // Create rich editor toolbar
//       const toolbar = createRichEditorToolbar()
//       pageContent.parentNode.insertBefore(toolbar, pageContent)

//       // Make content editable with better settings
//       pageContent.contentEditable = "true"
//       pageContent.style.outline = "none"
//       pageContent.style.userSelect = "text"
//       pageContent.style.webkitUserSelect = "text"
//       pageContent.focus()

//       // Store reference
//       richEditor = {
//         toolbar: toolbar,
//         content: pageContent,
//       }

//       // Add rich editor event listeners
//       pageContent.addEventListener("input", () => {
//         hasUnsavedChanges = true
//         updateToolbarState()
//       })
//       pageContent.addEventListener("keydown", handleRichEditorKeydown)
//       pageContent.addEventListener("mouseup", updateToolbarState)
//       pageContent.addEventListener("keyup", updateToolbarState)
//       pageContent.addEventListener("paste", handlePaste)

//       // Update toolbar state initially
//       updateToolbarState()
//     }

//     function createRichEditorToolbar() {
//       const toolbar = document.createElement("div")
//       toolbar.className = "rich-editor-toolbar"
//       toolbar.innerHTML = `
//         <div class="toolbar-group">
//           <button type="button" class="toolbar-btn" data-command="bold" title="Bold (Ctrl+B)">
//             <i class="fas fa-bold"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="italic" title="Italic (Ctrl+I)">
//             <i class="fas fa-italic"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="underline" title="Underline (Ctrl+U)">
//             <i class="fas fa-underline"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="strikethrough" title="Strikethrough">
//             <i class="fas fa-strikethrough"></i>
//           </button>
//         </div>
        
//         <div class="toolbar-separator"></div>
        
//         <div class="toolbar-group">
//           <button type="button" class="toolbar-btn" data-command="h1" title="Heading 1">
//             <i class="fas fa-heading"></i>
//             <span class="heading-level">1</span>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="h2" title="Heading 2">
//             <i class="fas fa-heading"></i>
//             <span class="heading-level">2</span>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="h3" title="Heading 3">
//             <i class="fas fa-heading"></i>
//             <span class="heading-level">3</span>
//           </button>
//         </div>
        
//         <div class="toolbar-separator"></div>
        
//         <div class="toolbar-group">
//           <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
//             <i class="fas fa-list-ul"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
//             <i class="fas fa-list-ol"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="blockquote" title="Quote">
//             <i class="fas fa-quote-left"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="code" title="Code">
//             <i class="fas fa-code"></i>
//           </button>
//           <button type="button" class="toolbar-btn" data-command="link" title="Add Link">
//             <i class="fas fa-link"></i>
//           </button>
//         </div>
        
//         <div class="toolbar-separator"></div>
        
//         <div class="toolbar-group">
//           <button type="button" class="toolbar-btn toolbar-btn-success" data-command="save" title="Save (Ctrl+S)">
//             <i class="fas fa-save"></i>
//             <span>Save</span>
//           </button>
//           <button type="button" class="toolbar-btn toolbar-btn-secondary" data-command="cancel" title="Cancel (Esc)">
//             <i class="fas fa-times"></i>
//             <span>Cancel</span>
//           </button>
//         </div>
//       `

//       // Add event listeners to toolbar buttons
//       toolbar.addEventListener("click", handleToolbarClick)

//       return toolbar
//     }

//     function handleToolbarClick(e) {
//       const btn = e.target.closest(".toolbar-btn")
//       if (!btn) return

//       e.preventDefault()
//       const command = btn.dataset.command

//       switch (command) {
//         case "bold":
//         case "italic":
//         case "underline":
//         case "strikethrough":
//           document.execCommand(command, false, null)
//           hasUnsavedChanges = true
//           break
//         case "h1":
//         case "h2":
//         case "h3":
//           formatAsHeading(command)
//           hasUnsavedChanges = true
//           break
//         case "insertUnorderedList":
//         case "insertOrderedList":
//           document.execCommand(command, false, null)
//           hasUnsavedChanges = true
//           break
//         case "blockquote":
//           formatAsBlockquote()
//           hasUnsavedChanges = true
//           break
//         case "code":
//           formatAsCode()
//           hasUnsavedChanges = true
//           break
//         case "link":
//           showLinkModal()
//           break
//         case "save":
//           window.savePageChanges()
//           break
//         case "cancel":
//           cancelEdit()
//           break
//       }

//       // Update toolbar state after command
//       setTimeout(updateToolbarState, 10)
//       pageContent?.focus()
//     }

//     function showLinkModal() {
//       const selection = window.getSelection()
//       const selectedText = selection.toString()

//       // Create modal
//       const modal = document.createElement("div")
//       modal.className = "modal-overlay link-modal"
//       modal.innerHTML = `
//         <div class="modal-content">
//           <div class="modal-header">
//             <div class="modal-icon">
//               <i class="fas fa-link"></i>
//             </div>
//             <div>
//               <h3>Add Link</h3>
//               <p class="modal-subtitle">Link selected text to a page or URL</p>
//             </div>
//             <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
//               <i class="fas fa-times"></i>
//             </button>
//           </div>
//           <div class="modal-body">
//             <form id="linkForm">
//               <div class="form-group">
//                 <label for="linkText">Link Text</label>
//                 <input type="text" id="linkText" value="${selectedText}" placeholder="Enter link text...">
//               </div>
//               <div class="form-group">
//                 <label for="linkType">Link Type</label>
//                 <select id="linkType" onchange="toggleLinkOptions(this.value)">
//                   <option value="url">External URL</option>
//                   <option value="page">Wiki Page</option>
//                   <option value="section">Page Section</option>
//                 </select>
//               </div>
//               <div class="form-group" id="urlGroup">
//                 <label for="linkUrl">URL</label>
//                 <input type="url" id="linkUrl" placeholder="https://example.com">
//               </div>
//               <div class="form-group" id="pageGroup" style="display: none;">
//                 <label for="linkPage">Wiki Page</label>
//                 <select id="linkPage">
//                   <option value="">Select a page...</option>
//                 </select>
//               </div>
//               <div class="form-group" id="sectionGroup" style="display: none;">
//                 <label for="linkSection">Section</label>
//                 <input type="text" id="linkSection" placeholder="Enter section name...">
//               </div>
//               <div class="modal-actions">
//                 <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
//                 <button type="submit" class="btn btn-primary">Add Link</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       `

//       document.body.appendChild(modal)

//       // Load pages for dropdown
//       loadPagesForLinkModal()

//       // Focus text input
//       setTimeout(() => modal.querySelector("#linkText").focus(), 100)

//       // Handle form submission
//       modal.querySelector("#linkForm").addEventListener("submit", (e) => {
//         e.preventDefault()
//         createLink(modal, selection)
//       })
//     }

//     async function loadPagesForLinkModal() {
//       try {
//         const response = await fetch("/api/wiki")
//         const pages = await response.json()
//         const pageSelect = document.querySelector("#linkPage")

//         if (pageSelect) {
//           pageSelect.innerHTML =
//             '<option value="">Select a page...</option>' +
//             pages.map((page) => `<option value="${page.slug}">${page.title}</option>`).join("")
//         }
//       } catch (error) {
//         console.error("Error loading pages:", error)
//       }
//     }

//     function createLink(modal, selection) {
//       const linkText = modal.querySelector("#linkText").value
//       const linkType = modal.querySelector("#linkType").value
//       let linkUrl = ""

//       switch (linkType) {
//         case "url":
//           linkUrl = modal.querySelector("#linkUrl").value
//           break
//         case "page":
//           const pageSlug = modal.querySelector("#linkPage").value
//           linkUrl = pageSlug ? `/wiki/${pageSlug}` : ""
//           break
//         case "section":
//           const sectionName = modal.querySelector("#linkSection").value
//           linkUrl = sectionName ? `#${sectionName.toLowerCase().replace(/\s+/g, "-")}` : ""
//           break
//       }

//       if (!linkText || !linkUrl) {
//         alert("Please fill in all fields")
//         return
//       }

//       // Create link element
//       const link = document.createElement("a")
//       link.href = linkUrl
//       link.textContent = linkText
//       if (linkType === "url") {
//         link.target = "_blank"
//       }

//       // Insert link
//       if (selection.rangeCount > 0) {
//         const range = selection.getRangeAt(0)
//         range.deleteContents()
//         range.insertNode(link)
//         selection.removeAllRanges()
//       }

//       hasUnsavedChanges = true
//       modal.remove()
//       pageContent?.focus()
//     }

//     // Global function for link modal
//     window.toggleLinkOptions = (type) => {
//       const urlGroup = document.querySelector("#urlGroup")
//       const pageGroup = document.querySelector("#pageGroup")
//       const sectionGroup = document.querySelector("#sectionGroup")

//       urlGroup.style.display = type === "url" ? "block" : "none"
//       pageGroup.style.display = type === "page" ? "block" : "none"
//       sectionGroup.style.display = type === "section" ? "block" : "none"
//     }

//     function formatAsHeading(level) {
//       const selection = window.getSelection()
//       if (selection.rangeCount === 0) return

//       const range = selection.getRangeAt(0)

//       // If we're in a heading, convert it
//       let parentElement = range.commonAncestorContainer
//       if (parentElement.nodeType === Node.TEXT_NODE) {
//         parentElement = parentElement.parentElement
//       }

//       if (parentElement.tagName && /^H[1-6]$/.test(parentElement.tagName)) {
//         // Change existing heading
//         const newHeading = document.createElement(level)
//         newHeading.innerHTML = parentElement.innerHTML
//         parentElement.parentNode.replaceChild(newHeading, parentElement)
//       } else {
//         // Create new heading
//         document.execCommand("formatBlock", false, level)
//       }
//     }

//     function formatAsBlockquote() {
//       document.execCommand("formatBlock", false, "blockquote")
//     }

//     function formatAsCode() {
//       const selection = window.getSelection()
//       if (selection.rangeCount === 0) return

//       const range = selection.getRangeAt(0)
//       const selectedText = range.toString()

//       if (selectedText) {
//         const code = document.createElement("code")
//         code.textContent = selectedText
//         range.deleteContents()
//         range.insertNode(code)

//         // Clear selection
//         selection.removeAllRanges()
//       }
//     }

//     function updateToolbarState() {
//       if (!richEditor) return

//       const toolbar = richEditor.toolbar
//       const commands = ["bold", "italic", "underline", "strikethrough"]

//       commands.forEach((command) => {
//         const btn = toolbar.querySelector(`[data-command="${command}"]`)
//         if (btn) {
//           const isActive = document.queryCommandState(command)
//           btn.classList.toggle("active", isActive)
//         }
//       })

//       // Update heading buttons
//       const selection = window.getSelection()
//       if (selection.rangeCount > 0) {
//         let element = selection.anchorNode
//         if (element.nodeType === Node.TEXT_NODE) {
//           element = element.parentElement
//         }

//         // Clear all heading active states
//         toolbar.querySelectorAll('[data-command^="h"]').forEach((btn) => btn.classList.remove("active"))

//         // Set active heading
//         if (element.tagName && /^H[1-6]$/.test(element.tagName)) {
//           const level = element.tagName.toLowerCase()
//           const btn = toolbar.querySelector(`[data-command="${level}"]`)
//           if (btn) btn.classList.add("active")
//         }
//       }
//     }

//     function handleRichEditorShortcuts(e) {
//       if (e.ctrlKey || e.metaKey) {
//         switch (e.key) {
//           case "b":
//             e.preventDefault()
//             document.execCommand("bold", false, null)
//             hasUnsavedChanges = true
//             break
//           case "i":
//             e.preventDefault()
//             document.execCommand("italic", false, null)
//             hasUnsavedChanges = true
//             break
//           case "u":
//             e.preventDefault()
//             document.execCommand("underline", false, null)
//             hasUnsavedChanges = true
//             break
//         }
//       }
//     }

//     function handleRichEditorKeydown(e) {
//       // Handle Enter key for better formatting
//       if (e.key === "Enter") {
//         hasUnsavedChanges = true

//         const selection = window.getSelection()
//         if (selection.rangeCount > 0) {
//           const range = selection.getRangeAt(0)
//           let element = range.commonAncestorContainer
//           if (element.nodeType === Node.TEXT_NODE) {
//             element = element.parentElement
//           }

//           // If we're in a heading, create a new paragraph
//           if (element.tagName && /^H[1-6]$/.test(element.tagName)) {
//             // Check if the cursor is at the very end of the heading.
//             // This prevents unexpected behavior if Enter is pressed in the middle of a heading.
//             if (range.collapsed && range.atEndOf(element)) {
//               e.preventDefault()
//               // Use insertParagraph to create a new <p> element after the heading.
//               // This is the most semantically correct way and avoids extraneous <br> tags.
//               document.execCommand("insertParagraph")
//             }
//           }
//         }
//       }
//     }

//     function handlePaste(e) {
//       e.preventDefault()

//       // Get plain text from clipboard
//       const text = (e.clipboardData || window.clipboardData).getData("text/plain")

//       // Insert as plain text
//       document.execCommand("insertText", false, text)
//       hasUnsavedChanges = true
//     }

//     function exitEditMode() {
//       isEditing = false
//       hasUnsavedChanges = false

//       // Add fadeout animation for edit mode bar
//       mainContent?.classList.add("edit-mode-exiting")

//       setTimeout(() => {
//         mainContent?.classList.remove("edit-mode")
//         mainContent?.classList.remove("edit-mode-exiting")
//       }, 300)

//       // Remove rich editor toolbar
//       if (richEditor) {
//         richEditor.toolbar.remove()
//         richEditor = null
//       }

//       // Make sure nothing is editable and remove focus - FIXED VERSION
//       if (pageTitle) {
//         pageTitle.contentEditable = "false"
//         pageTitle.blur() // Ensure title loses focus
//       }
//       if (pageContent) {
//         pageContent.contentEditable = "false"
//         pageContent.style.outline = ""
//         pageContent.blur() // Ensure content loses focus
//       }

//       // Remove focus from any active element
//       if (document.activeElement && document.activeElement.blur) {
//         document.activeElement.blur()
//       }

//       // Re-render markdown and sections after editing
//       if (pageContent) {
//         renderMarkdown()
//         setupCollapsibleSections()
//       }

//       console.log("Exited edit mode") // Debug log
//     }

//     function cancelEdit() {
//       // Restore original content
//       if (pageTitle && originalTitle) {
//         pageTitle.textContent = originalTitle
//       }
//       if (pageContent && originalContent) {
//         pageContent.setAttribute("data-original-content", originalContent)
//         renderMarkdown()
//       }

//       exitEditMode()
//     }

//     function handleEditKeydown(e) {
//       // Enter key behavior
//       if (e.target === pageTitle && e.key === "Enter") {
//         e.preventDefault()
//         if (pageContent) {
//           enterRichEditMode()
//         }
//       }
//     }

//     function selectAllText(element) {
//       const range = document.createRange()
//       range.selectNodeContents(element)
//       const selection = window.getSelection()
//       selection.removeAllRanges()
//       selection.addRange(range)
//     }
//   }

//   // Setup sidebar menus with 3-dot options and create button
//   function setupSidebarMenus() {
//     // Add create page button to sidebar header
//     const sidebarHeader = document.querySelector(".sidebar-header")
//     if (sidebarHeader) {
//       const createBtn = document.createElement("button")
//       createBtn.className = "create-page-btn"
//       createBtn.innerHTML = '<i class="fas fa-plus"></i>'
//       createBtn.title = "Create new page"
//       createBtn.addEventListener("click", () => showCreatePageModal())

//       sidebarHeader.appendChild(createBtn)
//     }

//     document.querySelectorAll(".page-item").forEach((pageItem) => {
//       const pageLink = pageItem.querySelector(".page-link:not(.child)")
//       if (!pageLink) return

//       // Create menu button
//       const menuBtn = document.createElement("button")
//       menuBtn.className = "page-menu-btn"
//       menuBtn.innerHTML = '<i class="fas fa-ellipsis-h"></i>'
//       menuBtn.title = "Page options"

//       // Create menu dropdown
//       const menu = document.createElement("div")
//       menu.className = "page-menu"

//       const pageSlug = pageLink.href.split("/").pop()
//       const pageTitle = pageLink.querySelector("span").textContent

//       menu.innerHTML = `
//         <button class="menu-item" onclick="addChildPage('${pageSlug}', '${pageTitle}')">
//           <i class="fas fa-plus"></i>
//           <span>Add child page</span>
//         </button>
//         <button class="menu-item delete" onclick="deletePage('${pageSlug}')">
//           <i class="fas fa-trash"></i>
//           <span>Delete page</span>
//         </button>
//       `

//       // Add menu to page item
//       pageLink.appendChild(menuBtn)
//       pageItem.appendChild(menu)

//       // Toggle menu on button click
//       menuBtn.addEventListener("click", (e) => {
//         e.preventDefault()
//         e.stopPropagation()

//         // Close other menus
//         document.querySelectorAll(".page-menu.show").forEach((m) => {
//           if (m !== menu) m.classList.remove("show")
//         })

//         menu.classList.toggle("show")
//       })

//       // Close menu when clicking outside
//       document.addEventListener("click", (e) => {
//         if (!pageItem.contains(e.target)) {
//           menu.classList.remove("show")
//         }
//       })
//     })
//   }

//   // Show create page modal
//   function showCreatePageModal(parentId = null, parentTitle = null) {
//     const modal = document.createElement("div")
//     modal.className = "modal-overlay"
//     modal.innerHTML = `
//       <div class="modal-content">
//         <div class="modal-header">
//           <div class="modal-icon">
//             <i class="fas fa-plus"></i>
//           </div>
//           <div>
//             <h3>Create New Page</h3>
//             <p class="modal-subtitle">${parentTitle ? `Creating a child page under: ${parentTitle}` : "Add a new page to your knowledge base"}</p>
//           </div>
//           <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
//             <i class="fas fa-times"></i>
//           </button>
//         </div>
//         <div class="modal-body">
//           <form id="createPageForm">
//             <div class="form-group">
//               <label for="pageTitle">Page Title</label>
//               <input type="text" id="pageTitle" name="title" required placeholder="Enter page title...">
//             </div>
//             ${
//               !parentId
//                 ? `
//             <div class="form-group">
//               <label for="parentPage">Parent Page (Optional)</label>
//               <select id="parentPage" name="parent_id">
//                 <option value="">No parent (root level)</option>
//               </select>
//             </div>
//             `
//                 : `<input type="hidden" name="parent_id" value="${parentId}">`
//             }
//             <div class="form-group">
//               <label for="pageContent">Initial Content (Optional)</label>
//               <textarea id="pageContent" name="content" rows="6" placeholder="Write some initial content..."></textarea>
//             </div>
//             <div class="modal-actions">
//               <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
//               <button type="submit" class="btn btn-primary">Create Page</button>
//             </div>
//           </form>
//         </div>
//       </div>
//     `

//     document.body.appendChild(modal)

//     // Load pages for parent dropdown if not creating child page
//     if (!parentId) {
//       loadPagesForParentSelect()
//     }

//     // Focus title input
//     setTimeout(() => modal.querySelector("#pageTitle").focus(), 100)

//     // Handle form submission
//     modal.querySelector("#createPageForm").addEventListener("submit", async (e) => {
//       e.preventDefault()

//       const formData = new FormData(e.target)
//       const title = formData.get("title")
//       const content = formData.get("content")
//       const parent_id = formData.get("parent_id") || null

//       try {
//         const response = await fetch("/api/wiki", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             title,
//             content,
//             parent_id,
//           }),
//         })

//         if (response.ok) {
//           const newPage = await response.json()
//           modal.remove()
//           window.location.href = `/wiki/${newPage.slug}`
//         } else {
//           throw new Error("Failed to create page")
//         }
//       } catch (error) {
//         alert("Failed to create page. Please try again.")
//       }
//     })
//   }

//   async function loadPagesForParentSelect() {
//     try {
//       const response = await fetch("/api/wiki")
//       const pages = await response.json()
//       const parentSelect = document.querySelector("#parentPage")

//       if (parentSelect) {
//         parentSelect.innerHTML =
//           '<option value="">No parent (root level)</option>' +
//           pages.map((page) => `<option value="${page.id}">${page.title}</option>`).join("")
//       }
//     } catch (error) {
//       console.error("Error loading pages:", error)
//     }
//   }

//   // Global functions for menu actions
//   window.addChildPage = (parentSlug, parentTitle) => {
//     // Close menu
//     document.querySelectorAll(".page-menu.show").forEach((m) => m.classList.remove("show"))

//     // Get parent page ID and show modal
//     fetch(`/api/page-by-slug/${parentSlug}`)
//       .then((response) => response.json())
//       .then((parentPage) => {
//         showCreatePageModal(parentPage.id, parentTitle)
//       })
//       .catch(() => {
//         alert("Error loading parent page information")
//       })
//   }

//   window.deletePage = (slug) => {
//     // Close menu
//     document.querySelectorAll(".page-menu.show").forEach((m) => m.classList.remove("show"))

//     // Create custom confirmation dialog
//     const confirmDialog = document.createElement("div")
//     confirmDialog.className = "modal-overlay"
//     confirmDialog.innerHTML = `
//       <div class="modal-content">
//         <div class="modal-header">
//           <div class="modal-icon delete">
//             <i class="fas fa-exclamation-triangle"></i>
//           </div>
//           <div>
//             <h3>Delete Page</h3>
//             <p class="modal-subtitle">This action cannot be undone</p>
//           </div>
//         </div>
//         <div class="modal-body">
//           <p>Are you sure you want to delete this page? All child pages will also be deleted.</p>
//           <div class="modal-actions">
//             <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
//             <button class="btn btn-danger" onclick="confirmDelete('${slug}')">Delete Page</button>
//           </div>
//         </div>
//       </div>
//     `
//     document.body.appendChild(confirmDialog)
//   }

//   window.confirmDelete = (slug) => {
//     fetch(`/delete/${slug}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     }).then(() => {
//       window.location.href = "/"
//     })
//   }

//   // Add sidebar collapsible functionality with smooth animations
//   function setupSidebarCollapse() {
//     // Add click handlers to parent page links that have children
//     document.querySelectorAll(".page-item").forEach((pageItem) => {
//       const pageLink = pageItem.querySelector(".page-link:not(.child)")
//       const children = pageItem.querySelector(".page-children")

//       if (children && pageLink) {
//         // Set initial state - expanded by default
//         children.classList.add("expanded")

//         // Add toggle button
//         const toggleBtn = document.createElement("button")
//         toggleBtn.className = "page-toggle"
//         toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
//         toggleBtn.setAttribute("aria-expanded", "true")

//         toggleBtn.addEventListener("click", (e) => {
//           e.preventDefault()
//           e.stopPropagation()
//           togglePageChildren(children, toggleBtn)
//         })

//         // Insert toggle button before menu button
//         const menuBtn = pageLink.querySelector(".page-menu-btn")
//         if (menuBtn) {
//           pageLink.insertBefore(toggleBtn, menuBtn)
//         } else {
//           pageLink.appendChild(toggleBtn)
//         }
//       }
//     })
//   }

//   function togglePageChildren(children, toggleBtn) {
//     const icon = toggleBtn.querySelector("i")
//     const isExpanded = children.classList.contains("expanded")

//     if (isExpanded) {
//       // Collapse
//       children.classList.remove("expanded")
//       children.classList.add("collapsed")
//       icon.className = "fas fa-chevron-right"
//       toggleBtn.setAttribute("aria-expanded", "false")
//     } else {
//       // Expand
//       children.classList.remove("collapsed")
//       children.classList.add("expanded")
//       icon.className = "fas fa-chevron-down"
//       toggleBtn.setAttribute("aria-expanded", "true")
//     }
//   }

//   // Markdown rendering functionality
//   function setupMarkdownRendering() {
//     renderMarkdown()
//   }

//   function renderMarkdown() {
//     const pageContent = document.getElementById("pageContent")
//     if (!pageContent) return

//     const rawContent = pageContent.getAttribute("data-original-content") || pageContent.textContent
//     if (!rawContent) return

//     // Simple markdown parser
//     const html = parseMarkdown(rawContent)
//     pageContent.innerHTML = html
//   }

//   function parseMarkdown(text) {
//     // Basic markdown parsing - avoid creating duplicate headers
//     let html = text

//     // Headers (must be at start of line) - only if not already in HTML
//     if (!html.includes("<h1>") && !html.includes("<h2>") && !html.includes("<h3>")) {
//       html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>")
//       html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>")
//       html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>")
//     }

//     // Bold and italic
//     html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
//     html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//     html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

//     // Code blocks
//     html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
//     html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

//     // Links
//     html = html.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank">$1</a>')

//     // Lists
//     html = html.replace(/^\* (.+$)/gm, "<li>$1</li>")
//     html = html.replace(/^- (.+$)/gm, "<li>$1</li>")
//     html = html.replace(/^(\d+)\. (.+$)/gm, "<li>$1. $2</li>")

//     // Wrap consecutive list items in ul/ol
//     html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
//       if (match.includes("<li>1.") || /\d+\./.test(match)) {
//         return "<ol>" + match + "</ol>"
//       } else {
//         return "<ul>" + match + "</ul>"
//       }
//     })

//     // Blockquotes
//     html = html.replace(/^> (.+$)/gm, "<blockquote>$1</blockquote>")

//     // Line breaks
//     html = html.replace(/\n/g, "<br>")

//     // Clean up multiple br tags
//     html = html.replace(/(<br>\s*){3,}/g, "<br><br>")

//     return html
//   }

//   // // Collapsible sections functionality
//   function setupCollapsibleSections() {
//     //   const pageContent = document.getElementById("pageContent")
//     //   if (!pageContent) return
//     //   // Find all headers and make them collapsible
//     //   const headers = pageContent.querySelectorAll("h1, h2, h3, h4, h5, h6")
//     //   headers.forEach((header, index) => {
//     //     // Skip if already has toggle button
//     //     if (header.querySelector(".section-toggle")) return
//     //     // Create toggle button
//     //     const toggleBtn = document.createElement("button")
//     //     toggleBtn.className = "section-toggle"
//     //     toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
//     //     toggleBtn.setAttribute("aria-expanded", "true")
//     //     // Add click handler
//     //     toggleBtn.addEventListener("click", (e) => {
//     //       e.preventDefault()
//     //       e.stopPropagation()
//     //       toggleSection(header, toggleBtn)
//     //     })
//     //     // Insert toggle button at the beginning of the header
//     //     header.insertBefore(toggleBtn, header.firstChild)
//     //     // Wrap content between this header and the next header (or end)
//     //     const nextHeader = findNextHeader(header)
//     //     const sectionContent = document.createElement("div")
//     //     sectionContent.className = "section-content expanded"
//     //     let currentElement = header.nextElementSibling
//     //     const elementsToMove = []
//     //     while (currentElement && currentElement !== nextHeader) {
//     //       elementsToMove.push(currentElement)
//     //       currentElement = currentElement.nextElementSibling
//     //     }
//     //     // Move elements into section content
//     //     elementsToMove.forEach((el) => {
//     //       sectionContent.appendChild(el)
//     //     })
//     //     // Insert section content after header
//     //     if (elementsToMove.length > 0) {
//     //       header.parentNode.insertBefore(sectionContent, header.nextSibling)
//     //     }
//     //   })
//   }

//   function findNextHeader(currentHeader) {
//     let nextElement = currentHeader.nextElementSibling
//     while (nextElement) {
//       if (nextElement.tagName && /^H[1-6]$/.test(nextElement.tagName)) {
//         return nextElement
//       }
//       nextElement = nextElement.nextElementSibling
//     }
//     return null
//   }

//   function toggleSection(header, toggleBtn) {
//     const sectionContent = header.nextElementSibling
//     if (!sectionContent || !sectionContent.classList.contains("section-content")) return

//     const icon = toggleBtn.querySelector("i")
//     const isExpanded = sectionContent.classList.contains("expanded")

//     if (isExpanded) {
//       // Collapse
//       sectionContent.classList.remove("expanded")
//       sectionContent.classList.add("collapsed")
//       icon.className = "fas fa-chevron-right"
//       toggleBtn.setAttribute("aria-expanded", "false")
//     } else {
//       // Expand
//       sectionContent.classList.remove("collapsed")
//       sectionContent.classList.add("expanded")
//       icon.className = "fas fa-chevron-down"
//       toggleBtn.setAttribute("aria-expanded", "true")
//     }
//   }

//   // Global function for saving page changes
//   window.savePageChanges = async () => {
//     const pageTitle = document.getElementById("pageTitle")
//     const pageContent = document.getElementById("pageContent")
//     const mainContent = document.getElementById("mainContent")

//     const newTitle = pageTitle?.textContent.trim() || ""
//     let newContent = ""

//     if (pageContent) {
//       // Convert rich content back to markdown
//       newContent = convertHtmlToMarkdown(pageContent.innerHTML)
//     }

//     if (!newTitle) {
//       showSaveStatus("Title cannot be empty", "error")
//       return Promise.reject(new Error("Title cannot be empty"))
//     }

//     console.log("Saving changes:", { title: newTitle, content: newContent.substring(0, 100) + "..." }) // Debug log

//     showSaveStatus("Saving...", "saving")

//     return fetch(`/api/update/${currentPageSlug}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         title: newTitle,
//         content: newContent,
//       }),
//     })
//       .then((response) => {
//         console.log("Response status:", response.status) // Debug log
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`)
//         }
//         return response.json()
//       })
//       .then((data) => {
//         console.log("Save response:", data) // Debug log

//         if (data.error) {
//           throw new Error(data.error)
//         }

//         // Update stored original values
//         originalTitle = newTitle
//         originalContent = newContent
//         hasUnsavedChanges = false

//         // Update the data attribute for future edits
//         if (pageContent) {
//           pageContent.setAttribute("data-original-content", newContent)
//         }

//         showSaveStatus("Saved", "saved")
//         updatePageMeta()

//         // Exit edit mode after successful save with a small delay
//         setTimeout(() => {
//           window.exitEditMode()
//         }, 500) // Give user time to see the "Saved" status

//         return data // Return the data for promise chaining
//       })
//       .catch((error) => {
//         console.error("Save error:", error)
//         showSaveStatus("Save failed", "error")
//         throw error
//       })
//   }

//   function convertHtmlToMarkdown(html) {
//     // Create a temporary div to parse HTML
//     const temp = document.createElement("div")
//     temp.innerHTML = html

//     let markdown = ""

//     // Process each child node
//     temp.childNodes.forEach((node) => {
//       markdown += processNodeToMarkdown(node)
//     })

//     return markdown.trim()
//   }

//   function processNodeToMarkdown(node) {
//     if (node.nodeType === Node.TEXT_NODE) {
//       return node.textContent
//     }

//     if (node.nodeType === Node.ELEMENT_NODE) {
//       const tagName = node.tagName.toLowerCase()
//       const content = Array.from(node.childNodes)
//         .map((child) => processNodeToMarkdown(child))
//         .join("")

//       switch (tagName) {
//         case "h1":
//           return `# ${content}\n\n`
//         case "h2":
//           return `## ${content}\n\n`
//         case "h3":
//           return `### ${content}\n\n`
//         case "h4":
//           return `#### ${content}\n\n`
//         case "h5":
//           return `##### ${content}\n\n`
//         case "h6":
//           return `###### ${content}\n\n`
//         case "strong":
//         case "b":
//           return `**${content}**`
//         case "em":
//         case "i":
//           return `*${content}*`
//         case "u":
//           return `<u>${content}</u>`
//         case "strike":
//         case "s":
//           return `~~${content}~~`
//         case "code":
//           return `\`${content}\``
//         case "pre":
//           return `\`\`\`\n${content}\n\`\`\`\n\n`
//         case "blockquote":
//           return `> ${content}\n\n`
//         case "ul":
//           return processListToMarkdown(node, "-") + "\n"
//         case "ol":
//           return processListToMarkdown(node, "1.") + "\n"
//         case "li":
//           return content
//         case "br":
//           return "\n"
//         case "p":
//           return `${content}\n\n`
//         case "div":
//           return `${content}\n`
//         case "a":
//           const href = node.getAttribute("href")
//           return `[${content}](${href})`
//         default:
//           return content
//       }
//     }

//     return ""
//   }

//   function processListToMarkdown(listNode, marker) {
//     let markdown = ""
//     let counter = 1

//     Array.from(listNode.children).forEach((li) => {
//       if (li.tagName.toLowerCase() === "li") {
//         const content = Array.from(li.childNodes)
//           .map((child) => processNodeToMarkdown(child))
//           .join("")
//         const currentMarker = marker === "1." ? `${counter}.` : marker
//         markdown += `${currentMarker} ${content}\n`
//         counter++
//       }
//     })

//     return markdown
//   }

//   function showSaveStatus(message, type) {
//     let statusEl = document.querySelector(".save-status")

//     if (!statusEl) {
//       statusEl = document.createElement("div")
//       statusEl.className = "save-status"
//       document.body.appendChild(statusEl)
//     }

//     statusEl.textContent = message
//     statusEl.className = `save-status ${type} show`

//     // Hide after 2 seconds
//     setTimeout(() => {
//       statusEl.classList.remove("show")
//     }, 2000)
//   }

//   function updatePageMeta() {
//     const metaItems = document.querySelectorAll(".meta-item")
//     const now = new Date().toISOString().split("T")[0]

//     metaItems.forEach((item) => {
//       if (item.textContent.includes("Updated")) {
//         item.innerHTML = `
//         <i class="fas fa-edit"></i>
//         <span>Updated ${now}</span>
//       `
//       }
//     })
//   }

//   // Declare exitEditMode function globally
//   window.exitEditMode = () => {
//     const mainContent = document.getElementById("mainContent")
//     const pageTitle = document.getElementById("pageTitle")
//     const pageContent = document.getElementById("pageContent")
//     const richEditorToolbar = document.querySelector(".rich-editor-toolbar")

//     isEditing = false
//     hasUnsavedChanges = false

//     if (richEditorToolbar) {
//       richEditorToolbar.remove()
//     }

//     if (pageContent) {
//       pageContent.contentEditable = "false"
//       pageContent.style.outline = ""
//       pageContent.blur() // Ensure content loses focus
//     }

//     if (pageTitle) {
//       pageTitle.contentEditable = "false"
//       pageTitle.blur() // Ensure title loses focus
//     }

//     // Remove focus from any active element
//     if (document.activeElement && document.activeElement.blur) {
//       document.activeElement.blur()
//     }

//     mainContent?.classList.remove("edit-mode")

//     // Re-render markdown and sections after editing
//     if (pageContent) {
//       renderMarkdown()
//       setupCollapsibleSections()
//     }

//     console.log("Exited edit mode") // Debug log
//   }
// })
