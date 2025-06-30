// Chat functionality
window.initChat = () => {
  const chatPanel = document.getElementById("chatPanel")
  const overlay = document.getElementById("overlay")
  const toggleChatBtn = document.getElementById("toggleChat")
  const closeChatBtn = document.getElementById("closeChatPanel")
  const chatForm = document.getElementById("chatForm")
  const chatInput = document.getElementById("chatInput")
  const chatMessages = document.getElementById("chatMessages")

  setupChatEventListeners()
  setupChatAnimations()

  function setupChatEventListeners() {
    // Chat toggle
    if (toggleChatBtn) {
      toggleChatBtn.addEventListener("click", (e) => {
        e.preventDefault()
        toggleChat()
      })
    }

    if (closeChatBtn) {
      closeChatBtn.addEventListener("click", (e) => {
        e.preventDefault()
        closeChat()
      })
    }

    // Chat form
    if (chatForm) {
      chatForm.addEventListener("submit", handleChatSubmit)
    }
  }

  function setupChatAnimations() {
    const chatMessages = document.querySelectorAll(".message-content")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1"
            entry.target.style.transform = "translateY(0)"
          }
        })
      },
      { threshold: 0.1 },
    )

    chatMessages.forEach((el) => {
      el.style.opacity = "0"
      el.style.transform = "translateY(20px)"
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
      observer.observe(el)
    })
  }

  function toggleChat() {
    console.log("Toggling chat, current state:", window.AtlasAI.chatOpen)
    window.AtlasAI.chatOpen = !window.AtlasAI.chatOpen

    if (window.AtlasAI.chatOpen) {
      chatPanel?.classList.add("open")
      if (window.AtlasAI.isMobile) {
        overlay?.classList.add("visible")
        document.body.style.overflow = "hidden"
      }
      // Focus chat input
      setTimeout(() => chatInput?.focus(), 300)
    } else {
      closeChat()
    }

    console.log("Chat toggled, new state:", window.AtlasAI.chatOpen)
  }

  function closeChat() {
    window.AtlasAI.chatOpen = false
    chatPanel?.classList.remove("open")
    if (window.AtlasAI.isMobile) {
      overlay?.classList.remove("visible")
      document.body.style.overflow = "auto"
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault()

    const message = chatInput?.value.trim()
    if (!message) return

    // Add user message
    addMessage(message, "user")
    chatInput.value = ""

    // Show loading
    const loadingDiv = addMessage("Thinking...", "bot", true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()
      loadingDiv.remove()

      if (data.error) {
        addMessage("Sorry, I encountered an error. Please try again.", "bot")
      } else {
        addMessage(data.response, "bot")

        if (data.sources?.length > 0) {
          addSourcesMessage(data.sources)
        }
      }
    } catch (error) {
      loadingDiv.remove()
      addMessage("Sorry, I encountered an error. Please try again.", "bot")
    }

    scrollChatToBottom()
  }

  function addMessage(content, sender, isLoading = false) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `${sender}-message animate-fade-in`

    if (sender === "bot") {
      messageDiv.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content ${isLoading ? "loading" : ""}">
          ${content}
          ${
            !isLoading
              ? `
            <div class="feedback-buttons">
              <button onclick="sendFeedback(true)" title="Helpful">
                <i class="fas fa-thumbs-up"></i>
              </button>
              <button onclick="sendFeedback(false)" title="Not helpful">
                <i class="fas fa-thumbs-down"></i>
              </button>
            </div>
          `
              : ""
          }
        </div>
      `
    } else {
      messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <i class="fas fa-user"></i>
      `
    }

    // Remove welcome message
    const welcomeMessage = chatMessages?.querySelector(".welcome-message")
    welcomeMessage?.remove()

    chatMessages?.appendChild(messageDiv)
    return messageDiv
  }

  function addSourcesMessage(sources) {
    const sourcesDiv = document.createElement("div")
    sourcesDiv.className = "bot-message animate-fade-in"
    sourcesDiv.innerHTML = `
      <i class="fas fa-link text-blue-400"></i>
      <div class="message-content text-sm" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3);">
        <strong>Sources:</strong> ${sources.join(", ")}
      </div>
    `
    chatMessages?.appendChild(sourcesDiv)
  }

  function scrollChatToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }

  // Global functions
  window.toggleChat = toggleChat
  window.closeChat = closeChat

  // Global feedback function
  window.sendFeedback = (isHelpful) => {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful: isHelpful }),
    })

    // Visual feedback
    event.target.style.color = isHelpful ? "var(--accent-green)" : "var(--accent-red)"
    event.target.style.transform = "scale(1.2)"
    setTimeout(() => {
      event.target.style.transform = "scale(1)"
    }, 200)
  }
}
