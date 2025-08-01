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


  }


  // Global function
  window.setupCollapsibleSections = setupCollapsibleSections
}
