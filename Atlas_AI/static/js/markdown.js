// Markdown rendering and conversion utilities
window.initMarkdown = () => {
  renderMarkdown()

  function renderMarkdown() {
    const pageContent = document.getElementById("pageContent")
    if (!pageContent) return;

    const rawContent = pageContent.getAttribute("data-original-content") || pageContent.textContent;
    if (!rawContent) return;

    const html = parseMarkdown(rawContent);
    pageContent.innerHTML = html;
  }

  function parseMarkdown(text) {
    let html = text;

    // Headers (must be at start of line)
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'); // Changed $$ to () for standard markdown links

    // Lists (improved for nesting)
    const lines = html.split('\n');
    let inList = false;
    let listStack = []; // Stores current list type (ul/ol) and indentation level

    let processedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchUl = line.match(/^(\s*)[*-] (.+)/);
      const matchOl = line.match(/^(\s*)(\d+)\. (.+)/);

      if (matchUl || matchOl) {
        const indent = matchUl ? matchUl[1].length : matchOl[1].length;
        const listItemContent = matchUl ? matchUl[2] : matchOl[3];
        const listType = matchUl ? 'ul' : 'ol';

        if (!inList) {
          // Start new list
          processedLines.push(`<${listType}>`);
          listStack.push({ type: listType, indent: indent });
          inList = true;
        } else {
          // Check for nesting/de-nesting
          let currentList = listStack[listStack.length - 1];
          if (indent > currentList.indent) {
            // Nested list
            processedLines.push(`<${listType}>`);
            listStack.push({ type: listType, indent: indent });
          } else if (indent < currentList.indent) {
            // De-nest
            while (listStack.length > 0 && indent < listStack[listStack.length - 1].indent) {
              processedLines.push(`</${listStack.pop().type}>`);
            }
            if (listStack.length === 0 || indent > listStack[listStack.length - 1].indent) {
              // If we de-nested completely or to an invalid level, start new list
              processedLines.push(`<${listType}>`);
              listStack.push({ type: listType, indent: indent });
            } else if (listStack[listStack.length - 1].type !== listType) {
              // Changed list type at same level
              processedLines.push(`</${listStack.pop().type}>`);
              processedLines.push(`<${listType}>`);
              listStack.push({ type: listType, indent: indent });
            }
          } else if (currentList.type !== listType) {
            // Same level, but different list type (e.g., ul to ol)
            processedLines.push(`</${currentList.type}>`);
            processedLines.push(`<${listType}>`);
            listStack[listStack.length - 1].type = listType;
          }
        }
        processedLines.push(`<li>${listItemContent}</li>`);
      } else {
        // Not a list item
        while (listStack.length > 0) {
          processedLines.push(`</${listStack.pop().type}>`);
        }
        inList = false;
        processedLines.push(line);
      }
    }

    // Close any open lists at the end
    while (listStack.length > 0) {
      processedLines.push(`</${listStack.pop().type}>`);
    }

    html = processedLines.join('\n');

    // Blockquotes
    html = html.replace(/^> (.+$)/gm, "<blockquote>$1</blockquote>");

    // Paragraphs (wrap text not already in a block-level element)
    html = html.split('\n\n').map(p => {
        if (p.trim() === '' || p.match(/<(h[1-6]|ul|ol|blockquote|pre|table|div)>/i)) {
            return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');


    // Clean up multiple br tags if they appear
    html = html.replace(/(<br>\s*){3,}/g, "<br><br>");

    return html;
  }

  // FIXED: Simple conversion with single newlines only, improved for nested lists
  function convertHtmlToMarkdown(html) {
    console.log("Converting HTML to Markdown:");
    console.log("Input HTML:", html);

    const temp = document.createElement("div");
    temp.innerHTML = html;

    let markdown = "";

    function processNode(node, indentLevel = 0) {
      let nodeMarkdown = "";
      if (node.nodeType === Node.TEXT_NODE) {
        nodeMarkdown = node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const childrenMarkdown = Array.from(node.childNodes)
          .map(child => processNode(child, indentLevel + 1))
          .join("");

        switch (tagName) {
          case "h1":
            nodeMarkdown = `# ${childrenMarkdown}`;
            break;
          case "h2":
            nodeMarkdown = `## ${childrenMarkdown}`;
            break;
          case "h3":
            nodeMarkdown = `### ${childrenMarkdown}`;
            break;
          case "h4":
            nodeMarkdown = `#### ${childrenMarkdown}`;
            break;
          case "h5":
            nodeMarkdown = `##### ${childrenMarkdown}`;
            break;
          case "h6":
            nodeMarkdown = `###### ${childrenMarkdown}`;
            break;
          case "strong":
          case "b":
            nodeMarkdown = `**${childrenMarkdown}**`;
            break;
          case "em":
          case "i":
            nodeMarkdown = `*${childrenMarkdown}*`;
            break;
          case "u":
            nodeMarkdown = `<u>${childrenMarkdown}</u>`;
            break;
          case "strike":
          case "s":
            nodeMarkdown = `~~${childrenMarkdown}~~`;
            break;
          case "code":
            // Handle inline code vs. block code
            if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
                nodeMarkdown = childrenMarkdown; // For code inside <pre>
            } else {
                nodeMarkdown = `\`${childrenMarkdown}\``; // For inline code
            }
            break;
          case "pre":
            nodeMarkdown = `\`\`\`\n${childrenMarkdown}\n\`\`\``;
            break;
          case "blockquote":
            nodeMarkdown = `> ${childrenMarkdown.split('\n').join('\n> ')}`;
            break;
          case "ul":
          case "ol": 
            const listItems = Array.from(node.children)
              .filter(child => child.tagName.toLowerCase() === 'li')
              .map((li, idx) => {
                const liContent = processNode(li, 0); // Process li content at its own level
                const prefix = tagName === 'ol' ? `${idx + 1}.` : '-';
                return '  '.repeat(indentLevel) + `${prefix} ${liContent.trim()}`;
              })
              .join('\n');
            nodeMarkdown = listItems;
            break;
          case "li":
            // Handled by ul/ol processing, return raw content for list item context
            nodeMarkdown = childrenMarkdown;
            break;
          case "br":
            nodeMarkdown = "\n";
            break;
          case "p":
            nodeMarkdown = childrenMarkdown;
            break;
          case "div":
            nodeMarkdown = childrenMarkdown;
            break;
          case "a":
            const href = node.getAttribute("href");
            nodeMarkdown = `[${childrenMarkdown}](${href})`;
            break;
          case "span": // Handle spans that might contain font colors
            if (node.style.color) {
              nodeMarkdown = `<span style="color:${node.style.color}">${childrenMarkdown}</span>`;
            } else {
              nodeMarkdown = childrenMarkdown;
            }
            break;
          case "font": // Handle deprecated font tag for color
            if (node.color) {
              nodeMarkdown = `<span style="color:${node.color}">${childrenMarkdown}</span>`;
            } else {
              nodeMarkdown = childrenMarkdown;
            }
            break;
          default:
            nodeMarkdown = childrenMarkdown;
            break;
        }
      }
      return nodeMarkdown;
    }

    // Iterate through top-level children to maintain block-level separation
    Array.from(temp.children).forEach(node => {
        const nodeMarkdown = processNode(node, 0);
        if (nodeMarkdown.trim() !== "") {
            markdown += nodeMarkdown;
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'p'].includes(node.tagName.toLowerCase())) {
                markdown += "\n\n"; // Add double newline for block-level elements
            } else {
                markdown += "\n"; // Single newline for inline elements or others
            }
        }
    });

    // Clean up the result
    markdown = markdown
      .replace(/^\n+/, "") // Remove leading newlines
      .replace(/\n+$/, "") // Remove trailing newlines
      .replace(/\n\n+/g, "\n\n"); // Collapse multiple newlines to a maximum of two

    console.log("Output Markdown:", JSON.stringify(markdown));
    return markdown;
  }

  // Global functions
  window.renderMarkdown = renderMarkdown;
  window.convertHtmlToMarkdown = convertHtmlToMarkdown;
};