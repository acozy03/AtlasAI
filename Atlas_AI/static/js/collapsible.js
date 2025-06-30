// Collapsible sections functionality
window.initCollapsible = () => {
  setupCollapsibleSections()

  function setupCollapsibleSections() {
    const collapsibles = document.querySelectorAll(".collapsible")

    collapsibles.forEach((collapsible) => {
      // Check if the collapsible has the 'open' attribute
      const isOpen = collapsible.hasAttribute("open")

      // Set initial display based on the 'open' attribute
      const content = collapsible.querySelector(".content")
      if (content) {
        content.style.display = isOpen ? "block" : "none"
      }

      collapsible.addEventListener("click", function () {
        const content = this.querySelector(".content")
        if (content) {
          const isCurrentlyOpen = content.style.display === "block"
          content.style.display = isCurrentlyOpen ? "none" : "block"
        }
      })
    })

    // Setup section headers as collapsible
    setupSectionCollapse()
  }

  function setupSectionCollapse() {
    // This would be called after markdown rendering
    // Commented out for now as it was causing issues
    /*
    const pageContent = document.getElementById("pageContent")
    if (!pageContent) return

    // Find all headers and make them collapsible
    const headers = pageContent.querySelectorAll("h1, h2, h3, h4, h5, h6")

    headers.forEach((header, index) => {
      // Skip if already has toggle button
      if (header.querySelector(".section-toggle")) return

      // Create toggle button
      const toggleBtn = document.createElement("button")
      toggleBtn.className = "section-toggle"
      toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
      toggleBtn.setAttribute("aria-expanded", "true")

      // Add click handler
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSection(header, toggleBtn)
      })

      // Insert toggle button at the beginning of the header
      header.insertBefore(toggleBtn, header.firstChild)

      // Wrap content between this header and the next header (or end)
      const nextHeader = findNextHeader(header)
      const sectionContent = document.createElement("div")
      sectionContent.className = "section-content expanded"

      let currentElement = header.nextElementSibling
      const elementsToMove = []

      while (currentElement && currentElement !== nextHeader) {
        elementsToMove.push(currentElement)
        currentElement = currentElement.nextElementSibling
      }

      // Move elements into section content
      elementsToMove.forEach((el) => {
        sectionContent.appendChild(el)
      })

      // Insert section content after header
      if (elementsToMove.length > 0) {
        header.parentNode.insertBefore(sectionContent, header.nextSibling)
      }
    })
    */
  }

  function findNextHeader(currentHeader) {
    let nextElement = currentHeader.nextElementSibling
    while (nextElement) {
      if (nextElement.tagName && /^H[1-6]$/.test(nextElement.tagName)) {
        return nextElement
      }
      nextElement = nextElement.nextElementSibling
    }
    return null
  }

  function toggleSection(header, toggleBtn) {
    const sectionContent = header.nextElementSibling
    if (!sectionContent || !sectionContent.classList.contains("section-content")) return

    const icon = toggleBtn.querySelector("i")
    const isExpanded = sectionContent.classList.contains("expanded")

    if (isExpanded) {
      // Collapse
      sectionContent.classList.remove("expanded")
      sectionContent.classList.add("collapsed")
      icon.className = "fas fa-chevron-right"
      toggleBtn.setAttribute("aria-expanded", "false")
    } else {
      // Expand
      sectionContent.classList.remove("collapsed")
      sectionContent.classList.add("expanded")
      icon.className = "fas fa-chevron-down"
      toggleBtn.setAttribute("aria-expanded", "true")
    }
  }

  // Global function
  window.setupCollapsibleSections = setupCollapsibleSections
}
