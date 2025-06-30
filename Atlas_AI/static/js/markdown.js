// Markdown rendering and conversion utilities
window.initMarkdown = () => {
  renderMarkdown()

  function renderMarkdown() {
    const pageContent = document.getElementById("pageContent")
    if (!pageContent) return

    const rawContent = pageContent.getAttribute("data-original-content") || pageContent.textContent
    if (!rawContent) return

    const html = parseMarkdown(rawContent)
    pageContent.innerHTML = html
  }

  function parseMarkdown(text) {
    let html = text

    // Headers (must be at start of line) - only if not already in HTML
    if (!html.includes("<h1>") && !html.includes("<h2>") && !html.includes("<h3>")) {
      html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>")
      html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>")
      html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>")
    }

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

    // Links
    html = html.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank">$1</a>')

    // Lists
    html = html.replace(/^\* (.+$)/gm, "<li>$1</li>")
    html = html.replace(/^- (.+$)/gm, "<li>$1</li>")
    html = html.replace(/^(\d+)\. (.+$)/gm, "<li>$1. $2</li>")

    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
      if (match.includes("<li>1.") || /\d+\./.test(match)) {
        return "<ol>" + match + "</ol>"
      } else {
        return "<ul>" + match + "</ul>"
      }
    })

    // Blockquotes
    html = html.replace(/^> (.+$)/gm, "<blockquote>$1</blockquote>")

    // Line breaks
    html = html.replace(/\n/g, "<br>")

    // Clean up multiple br tags
    html = html.replace(/(<br>\s*){3,}/g, "<br><br>")

    return html
  }

  // FIXED: Simple conversion with single newlines only
  function convertHtmlToMarkdown(html) {
    console.log("Converting HTML to Markdown:")
    console.log("Input HTML:", html)

    const temp = document.createElement("div")
    temp.innerHTML = html

    // Get all the direct children and process them
    const children = Array.from(temp.childNodes)
    let markdown = ""

    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      const nextNode = children[i + 1]

      const nodeMarkdown = processNodeToMarkdown(node)

      if (nodeMarkdown.trim() !== "") {
        markdown += nodeMarkdown

        // Always single newline between elements (no double newlines)
        if (nextNode) {
          markdown += "\n"
        }
      }
    }

    // Clean up the result
    markdown = markdown
      .replace(/^\n+/, "") // Remove leading newlines
      .replace(/\n+$/, "") // Remove trailing newlines

    console.log("Output Markdown:", JSON.stringify(markdown))
    return markdown
  }

  function processNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      const content = Array.from(node.childNodes)
        .map((child) => processNodeToMarkdown(child))
        .join("")

      switch (tagName) {
        case "h1":
          return `# ${content}`
        case "h2":
          return `## ${content}`
        case "h3":
          return `### ${content}`
        case "h4":
          return `#### ${content}`
        case "h5":
          return `##### ${content}`
        case "h6":
          return `###### ${content}`
        case "strong":
        case "b":
          return `**${content}**`
        case "em":
        case "i":
          return `*${content}*`
        case "u":
          return `<u>${content}</u>`
        case "strike":
        case "s":
          return `~~${content}~~`
        case "code":
          return `\`${content}\``
        case "pre":
          return `\`\`\`\n${content}\n\`\`\``
        case "blockquote":
          return `> ${content}`
        case "ul":
          return processListToMarkdown(node, "-")
        case "ol":
          return processListToMarkdown(node, "1.")
        case "li":
          return content
        case "br":
          return "\n"
        case "p":
          return content
        case "div":
          return content
        case "a":
          const href = node.getAttribute("href")
          return `[${content}](${href})`
        default:
          return content
      }
    }

    return ""
  }

  function processListToMarkdown(listNode, marker) {
    let markdown = ""
    let counter = 1

    Array.from(listNode.children).forEach((li) => {
      if (li.tagName.toLowerCase() === "li") {
        const content = Array.from(li.childNodes)
          .map((child) => processNodeToMarkdown(child))
          .join("")
        const currentMarker = marker === "1." ? `${counter}.` : marker
        markdown += `${currentMarker} ${content}\n`
        counter++
      }
    })

    return markdown.replace(/\n$/, "") // Remove trailing newline
  }

  // Global functions
  window.renderMarkdown = renderMarkdown
  window.convertHtmlToMarkdown = convertHtmlToMarkdown
}
