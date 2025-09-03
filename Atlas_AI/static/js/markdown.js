window.initMarkdown = () => {
  let isQuillActive = false;
  const marked = window.marked;
  const TurndownService = window.TurndownService;

  renderMarkdown();

  function renderMarkdown() {
    const pageContent = document.getElementById("pageContent");
    if (!pageContent || isQuillActive) return;

    const rawContent = pageContent.getAttribute("data-original-content") || pageContent.textContent;
    if (!rawContent) return;

    const html = marked.parse(rawContent);
    pageContent.innerHTML = html;
  }

function convertHtmlToMarkdown(html) {
  console.log("Converting HTML to Markdown:");
  console.log("Input HTML:", html);

  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
  });

  // New rule to handle dynamic file links and preserve the target="_blank" attribute
  turndownService.addRule("fileLinks", {
    filter: (node) => node.nodeName === "A" && node.getAttribute("href")?.startsWith("/api/file/"),
    replacement: (content, node) => {
      const href = node.getAttribute("href");
      const target = node.getAttribute("target");
      if (target === "_blank") {
        // Return Markdown with a custom title attribute to preserve the target
        return `[${content}](${href} "target=_blank")`;
      }
      return `[${content}](${href})`;
    },
  });

  // Custom rule for handling Quill-style lists with indentation
  turndownService.addRule("quillList", {
    filter: "li",
    replacement: (content, node, options) => {
      const indentClass = Array.from(node.classList).find(cls =>
        cls.startsWith("ql-indent-")
      );
      const indentLevel = indentClass
        ? parseInt(indentClass.replace("ql-indent-", ""), 10)
        : 0;

      const indentation = "  ".repeat(indentLevel); // 2 spaces per level

      const listType = node.getAttribute("data-list");
      let prefix;
      if (listType === "ordered") {
        const start = node.parentNode.getAttribute("start");
        const index = Array.prototype.indexOf.call(
          node.parentNode.children,
          node
        );
        prefix = (start ? Number(start) + index : index + 1) + ". ";
      } else {
        prefix = options.bulletListMarker + " ";
      }

      // Clean and indent multiline content
      content = content
        .replace(/^\n+/, "")
        .replace(/\n+$/, "")
        .replace(/\n/gm, `\n${indentation}  `);

      const result = `\n${indentation}${prefix}${content.replace(/\n/g, `\n${indentation}  `)}\n`;

      console.log(
        `[quillList] indentLevel=${indentLevel}, listType=${listType}, prefix="${prefix}" ->`,
        JSON.stringify(result)
      );

      return result;
    },
  });

  // Handle inline colored text
  turndownService.addRule("coloredText", {
    filter: (node, options) =>
      node.style && (node.style.color || node.style.backgroundColor),
    replacement: (content, node, options) => {
      const color = node.style.color;
      const backgroundColor = node.style.backgroundColor;

      if (color && backgroundColor) {
        return `<span style="color: ${color}; background-color: ${backgroundColor};">${content}</span>`;
      } else if (color) {
        return `<span style="color: ${color};">${content}</span>`;
      } else if (backgroundColor) {
        return `<span style="background-color: ${backgroundColor};">${content}</span>`;
      }
      return content;
    },
  });

  // Blockquote formatting
  turndownService.addRule("blockquote", {
    filter: "blockquote",
    replacement: (content, node, options) => {
      const lines = content.trim().split("\n");
      const quotedLines = lines.map((line) => `> ${line.trim()}`);
      return quotedLines.join("\n");
    },
  });

  // Code block formatting
  turndownService.addRule("codeBlock", {
    filter: (node, options) =>
      node.nodeName === "PRE" &&
      node.firstChild &&
      node.firstChild.nodeName === "CODE",
    replacement: (content, node, options) => {
      const language =
        node.firstChild.className.replace("language-", "") || "";
      return `\`\`\`${language}\n${content.trim()}\n\`\`\``;
    },
  });

  // Inline code formatting
  turndownService.addRule("inlineCode", {
    filter: (node, options) =>
      node.nodeName === "CODE" && node.parentNode.nodeName !== "PRE",
    replacement: (content, node, options) => `\`${content}\``,
  });

  // Link formatting
  turndownService.addRule("links", {
    filter: "a",
    replacement: (content, node, options) => {
      const href = node.getAttribute("href");
      const title = node.getAttribute("title");

      if (!href) return content;

      if (title) {
        return `[${content}](${href} "${title}")`;
      }
      return `[${content}](${href})`;
    },
  });

  let markdown = turndownService.turndown(html);

  console.log("Output Markdown:", JSON.stringify(markdown));
  return markdown;
}

  window.renderMarkdown = renderMarkdown;
  window.convertHtmlToMarkdown = convertHtmlToMarkdown;
  window.setQuillActive = (active) => {
    isQuillActive = active;
  };
};