// Utility functions
window.showSaveStatus = (message, type) => {
  let statusEl = document.querySelector(".save-status")

  if (!statusEl) {
    statusEl = document.createElement("div")
    statusEl.className = "save-status"
    document.body.appendChild(statusEl)
  }

  statusEl.textContent = message
  statusEl.className = `save-status ${type} show`

  setTimeout(() => {
    statusEl.classList.remove("show")
  }, 2000)
}

window.updatePageMeta = () => {
  const metaItems = document.querySelectorAll(".meta-item")
  const now = new Date().toISOString().split("T")[0]

  metaItems.forEach((item) => {
    if (item.textContent.includes("Updated")) {
      item.innerHTML = `
        <i class="fas fa-edit"></i>
        <span>Updated ${now}</span>
      `
    }
  })
}
