/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable no-useless-escape */
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarkdownService {
  convertToHtml(markdown: string): string {
    // Allow raw HTML blocks to pass through without processing
    const rawHtmlBlocks: string[] = [];
    markdown = markdown.replace(/```html\n([\s\S]+?)\n```/g, (match, content) => {
      const index = rawHtmlBlocks.length;
      rawHtmlBlocks.push(content);
      return `__RAW_HTML_BLOCK_${index}__`;
    });

    // Process front matter
    markdown = this.processFrontMatter(markdown);

    // Convert headers with anchor IDs
    markdown = this.convertHeaders(markdown);

    // Convert horizontal rules
    markdown = markdown.replace(
      /^(___|\*\*\*|---)$/gm,
      '<hr class="markdown-hr">',
    );

    // Convert typographic replacements
    markdown = this.convertTypography(markdown);

    // Convert callouts and notes
    markdown = this.convertCallouts(markdown);
    markdown = this.convertNotes(markdown);

    // Convert code blocks with syntax highlighting (must come before inline code)
    markdown = this.convertCodeBlocks(markdown);

    // Convert bold, italic and strikethrough
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    markdown = markdown.replace(/__(.*?)__/g, '<strong>$1</strong>');
    markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
    markdown = markdown.replace(/_(.*?)_/g, '<em>$1</em>');
    markdown = markdown.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Convert blockquotes with nesting
    markdown = this.convertBlockquotes(markdown);

    // Convert lists with proper nesting support
    markdown = this.convertLists(markdown);

    // Convert tables
    markdown = this.convertTables(markdown);

    // Convert images (must come before links)
    markdown = this.convertImages(markdown);

    // Convert links with support for anchors
    markdown = this.convertLinks(markdown);

    // Convert inline code (after code blocks)
    markdown = markdown.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>',
    );

    // Convert footnotes
    markdown = this.convertFootnotes(markdown);

    // Convert definition lists
    markdown = this.convertDefinitionLists(markdown);

    // Convert abbreviations
    markdown = this.convertAbbreviations(markdown);

    // Convert custom containers
    markdown = this.convertCustomContainers(markdown);

    // Convert subscript/superscript
    markdown = markdown.replace(/~([^~]+)~/g, '<sub>$1</sub>');
    markdown = markdown.replace(/\^([^\^]+)\^/g, '<sup>$1</sup>');

    // Convert embeds
    markdown = this.convertEmbeds(markdown);

    // Convert details/summary elements
    markdown = this.convertDetails(markdown);

    // Convert columns layout
    markdown = this.convertColumns(markdown);

    // Convert line breaks (but preserve paragraphs)
    markdown = this.convertLineBreaks(markdown);

    // Clean the final HTML to remove unnecessary <br> tags
    markdown = this.cleanHtml(markdown);

    // Fix HTML entities in attributes (add this new step)
    markdown = this.fixHtmlEntities(markdown);

    // In your convertToHtml method, add a step for direct media embedding
    markdown = this.processDirectMediaEmbeds(markdown);

    // At the very end, restore the raw HTML blocks
    rawHtmlBlocks.forEach((block, index) => {
      markdown = markdown.replace(`__RAW_HTML_BLOCK_${index}__`, block);
    });

    return markdown;
  }

  private processFrontMatter(markdown: string): string {
    // Simple front matter handling (remove it from the output)
    return markdown.replace(/^---\n([\s\S]*?)\n---/m, '');
  }

  private convertTypography(markdown: string): string {
    // Handle typographic replacements
    const replacements: { [key: string]: string } = {
      '\\(c\\)': '©',
      '\\(C\\)': '©',
      '\\(r\\)': '®',
      '\\(R\\)': '®',
      '\\(tm\\)': '™',
      '\\(TM\\)': '™',
      '\\(p\\)': '§',
      '\\(P\\)': '§',
      '\\+-': '±',
      '\\.\\.\\.': '…',
      '--': '–',
      '---': '—',
      '<<': '«',
      '>>': '»',
    };

    let result = markdown;
    for (const [pattern, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(pattern, 'g'), replacement);
    }

    // Smart quotes
    result = result.replace(/"([^"]+)"/g, '&ldquo;$1&rdquo;');
    result = result.replace(/'([^']+)'/g, '&lsquo;$1&rsquo;');

    return result;
  }

  private convertBlockquotes(markdown: string): string {
    // Split into lines to handle blockquotes properly
    const lines: string[] = markdown.split('\n');
    let inBlockquote = false;
    let blockquoteLevel = 0;
    let result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(>+)\s(.*)$/);

      if (match) {
        const level = match[1].length;
        const content = match[2];

        if (!inBlockquote) {
          // Start a new blockquote
          inBlockquote = true;
          blockquoteLevel = level;

          // Open the required number of blockquote tags
          for (let j = 0; j < level; j++) {
            result.push('<blockquote>');
          }
          result.push(content);
        } else if (level === blockquoteLevel) {
          // Continue the current blockquote
          result.push(content);
        } else if (level > blockquoteLevel) {
          // Increase nesting level
          for (let j = 0; j < level - blockquoteLevel; j++) {
            result.push('<blockquote>');
          }
          blockquoteLevel = level;
          result.push(content);
        } else {
          // Decrease nesting level
          for (let j = 0; j < blockquoteLevel - level; j++) {
            result.push('</blockquote>');
          }
          blockquoteLevel = level;
          result.push(content);
        }
      } else if (inBlockquote && line.trim() === '') {
        // End of blockquote
        for (let j = 0; j < blockquoteLevel; j++) {
          result.push('</blockquote>');
        }
        inBlockquote = false;
        blockquoteLevel = 0;
        result.push('');
      } else {
        if (inBlockquote) {
          // End of blockquote
          for (let j = 0; j < blockquoteLevel; j++) {
            result.push('</blockquote>');
          }
          inBlockquote = false;
          blockquoteLevel = 0;
        }
        result.push(line);
      }
    }

    // Close any open blockquotes
    if (inBlockquote) {
      for (let j = 0; j < blockquoteLevel; j++) {
        result.push('</blockquote>');
      }
    }

    return result.join('\n');
  }

  private convertLists(markdown: string): string {
    // First, identify and process nested lists
    let result = markdown;

    // Match list items and maintain proper nesting
    const processListItems = (text: string, isOrdered: boolean): string => {
      const listTag = isOrdered ? 'ol' : 'ul';
      const listItems = text
        .split('\n')
        .filter((line) => line.trim().length > 0);

      let html = `<${listTag} class="markdown-list">`;
      let currentIndent = 0;
      let stack: number[] = [];

      for (let i = 0; i < listItems.length; i++) {
        const line = listItems[i];

        // Count leading spaces to determine indentation level
        const match = line.match(/^(\s*)([\*\-\+]|\d+\.)\s+(.*)/);

        if (!match) continue;

        const [, indent, marker, content] = match;
        const indentLevel = indent.length;
        const isOrderedItem = /^\d+\./.test(marker);

        // Handle indentation changes
        if (indentLevel > currentIndent) {
          // Deeper level - start a new sublist
          const newListTag = isOrderedItem ? 'ol' : 'ul';
          html += `<${newListTag} class="markdown-sublist">`;
          stack.push(currentIndent);
          currentIndent = indentLevel;
        } else if (indentLevel < currentIndent) {
          // Going back up - close sublists
          while (stack.length > 0 && indentLevel <= stack[stack.length - 1]) {
            const parentListTag = isOrderedItem ? 'ol' : 'ul';
            html += `</${parentListTag}>`;
            currentIndent = stack.pop() || 0;
          }
        }

        // Add the list item
        html += `<li>${content}</li>`;
      }

      // Close any remaining open lists
      while (stack.length > 0) {
        const listType = isOrdered ? 'ol' : 'ul';
        html += `</${listType}>`;
        stack.pop();
      }

      html += `</${listTag}>`;
      return html;
    };

    // Find and process unordered lists (*, -, +)
    result = result.replace(
      /(?:^|\n)((?:\s*[\*\-\+]\s+.*(?:\n|$))+)/g,
      (match, listContent) => {
        return processListItems(listContent, false);
      },
    );

    // Find and process ordered lists (1., 2., etc)
    result = result.replace(
      /(?:^|\n)((?:\s*\d+\.\s+.*(?:\n|$))+)/g,
      (match, listContent) => {
        return processListItems(listContent, true);
      },
    );

    return result;
  }

  private convertTables(markdown: string): string {
    // First identify and handle standard markdown tables with a very specific pattern
    const lines = markdown.split('\n');
    const processed: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      // Look for the start of a table (a line that begins with |)
      if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        // Check if next line exists and is a separator row
        if (
          i + 1 < lines.length &&
          lines[i + 1].trim().startsWith('|') &&
          lines[i + 1].trim().endsWith('|') &&
          lines[i + 1].includes('-')
        ) {
          // Look ahead to find the end of the table
          let endIndex = i + 2;
          while (
            endIndex < lines.length &&
            lines[endIndex].trim().startsWith('|') &&
            lines[endIndex].trim().endsWith('|')
          ) {
            endIndex++;
          }

          if (endIndex > i + 2) {
            // We have a table with at least header, separator, and one data row
            // Extract table rows
            const tableRows = lines.slice(i, endIndex);

            // Create HTML table
            let tableHtml: any =
              '<div class="table-container"><table class="markdown-table">';

            // Add header (first row)
            tableHtml += '<thead><tr>';
            const headerCells = this.extractTableCells(tableRows[0]);
            headerCells.forEach((cell) => {
              tableHtml += `<th>${this.processTableCellContent(cell.trim())}</th>`;
            });
            tableHtml += '</tr></thead>';

            // Add body (skip the separator row)
            tableHtml += '<tbody>';
            for (let rowIndex = 2; rowIndex < tableRows.length; rowIndex++) {
              const row = tableRows[rowIndex];
              tableHtml += '<tr>';
              const cells = this.extractTableCells(row);
              cells.forEach((cell) => {
                tableHtml += `<td>${this.processTableCellContent(cell.trim())}</td>`;
              });
              tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table></div>';

            // Add the processed table
            processed.push(tableHtml);

            // Skip past the table in our processing
            i = endIndex - 1;
            continue;
          }
        }
      }

      // Not a table, just add the line as is
      processed.push(lines[i]);
    }

    // Fall back to the existing table processing for any tables we didn't handle
    let result = processed.join('\n');
    if (!result.includes('<table class="markdown-table">')) {
      result = this.processTablesWithRegex(result);
    }

    return result;
  }

  // Move the existing table processing to a separate method
  private processTablesWithRegex(markdown: string): string {
    let result = markdown;

    // Use the existing regex patterns and methods
    const standardTableRegex =
      /(?:^|\n)[ \t]*\|(.*\|)[ \t]*\n[ \t]*\|([-:\|\s]+)\|[ \t]*\n((?:[ \t]*\|.*\|[ \t]*\n?)+)/gm;
    result = result.replace(standardTableRegex, (match) => {
      return this.processStandardTable(match);
    });

    const simplePipeTableRegex =
      /(?:^|\n)(\|[^\n]+\|\s*\n)(?:\|[^\n]+\|\s*\n)+/g;
    result = result.replace(simplePipeTableRegex, (match) => {
      if (match.includes('<table class="markdown-table">')) {
        return match;
      }
      return this.processSimpleTable(match);
    });

    return result;
  }

  /**
   * Helper method to check if a row is a separator row (consists of only dashes, colons, and spaces)
   */
  private isSeparatorRow(cells: string[]): boolean {
    return cells.every((cell) => {
      const trimmed = cell.trim();
      // Check if cell contains primarily dashes, hyphens, colons, or separator-like characters
      // Including various Unicode dash characters that might be present
      return !trimmed || /^[\s\-:|–—―−﹘﹣－+]+$/.test(trimmed);
    });
  }

  /**
   * Processes a standard markdown table with header, separator, and body rows
   */
  private processStandardTable(tableText: string): string {
    const rows = tableText
      .trim()
      .split('\n')
      .map((row) => row.trim());

    if (rows.length < 3) {
      return tableText; // Not enough rows for a proper table
    }

    const headerRow = rows[0];
    const headerCells = this.extractTableCells(headerRow);

    const separatorRow = rows[1];
    const alignments = this.extractTableAlignments(separatorRow);

    let tableHtml =
      '<div class="table-container"><table class="markdown-table">';

    // Add header
    tableHtml += '<thead><tr>';
    headerCells.forEach((cell, index) => {
      const alignment = index < alignments.length ? alignments[index] : 'left';
      const processedContent = this.processTableCellContent(cell.trim());
      tableHtml += `<th class="align-${alignment}">${processedContent}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Add body - FORCE SKIP the separator row (row 1)
    tableHtml += '<tbody>';
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row.trim()) continue;

      const cells = this.extractTableCells(row);

      // Skip any row that looks like a separator
      if (this.isSeparatorRow(cells)) continue;

      tableHtml += '<tr>';
      cells.forEach((cell, index) => {
        const alignment =
          index < alignments.length ? alignments[index] : 'left';
        const processedContent = this.processTableCellContent(cell.trim());
        tableHtml += `<td class="align-${alignment}">${processedContent}</td>`;
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';

    return tableHtml;
  }

  /**
   * Processes a simple pipe-separated table without a separator row
   */
  private processSimpleTable(tableText: string): string {
    // Split the table into rows and clean them
    const rows = tableText
      .trim()
      .split('\n')
      .map((row) => row.trim());

    if (rows.length < 2) {
      return tableText; // Not enough rows for a proper table
    }

    // Extract the cells from all rows
    const allRows = rows.map((row) => this.extractTableCells(row));

    // Force check if second row looks like a separator
    const secondRowIsSeparator =
      rows.length > 1 && this.isSeparatorRow(this.extractTableCells(rows[1]));

    // If the second row appears to be a separator, process as standard table
    if (secondRowIsSeparator) {
      return this.processStandardTable(tableText);
    }

    // Process as a simple table
    const headerIndex = 0;
    const bodyStartIndex = 1;

    // Generate table HTML
    let tableHtml =
      '<div class="table-container"><table class="markdown-table simple-table">';

    // Add header
    tableHtml += '<thead><tr>';
    allRows[headerIndex].forEach((cell) => {
      const processedContent = this.processTableCellContent(cell.trim());
      tableHtml += `<th>${processedContent}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Add body
    tableHtml += '<tbody>';
    for (let i = bodyStartIndex; i < allRows.length; i++) {
      const cells = allRows[i];

      // Skip separator-like rows
      if (this.isSeparatorRow(cells)) continue;

      tableHtml += '<tr>';
      cells.forEach((cell) => {
        const processedContent = this.processTableCellContent(cell.trim());
        tableHtml += `<td>${processedContent}</td>`;
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';

    return tableHtml;
  }

  /**
   * Process the content of a table cell to handle inline markdown
   */
  private processTableCellContent(cellContent: string): string {
    if (!cellContent) return '';

    // Process inline elements
    let processed = cellContent;

    // Process images with proper sizing
    processed = processed.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="table-image">',
    );

    // Process links - fix the target="_blank" issue
    processed = processed.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank">$1</a>',
    );

    // Process bold text
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Process italic text
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');

    // Process code spans
    processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');

    // Replace any remaining newlines with spaces instead of <br>
    processed = processed.replace(/\n/g, ' ');

    return processed;
  }

  private extractTableCells(row: string): string[] {
    // Remove leading and trailing | and whitespace
    const trimmedRow = row.trim().replace(/^\||\|\s*$/g, '');

    // Split by | but preserve escaped pipe characters
    let cells: string[] = [];
    let currentCell: string = '';
    let insideCode: boolean = false;

    for (let i = 0; i < trimmedRow.length; i++) {
      const char = trimmedRow[i];
      const nextChar = trimmedRow[i + 1] || '';

      if (char === '`') {
        insideCode = !insideCode;
        currentCell += char;
      } else if (char === '\\' && nextChar === '|') {
        currentCell += '|';
        i++; // Skip the next character
      } else if (char === '|' && !insideCode) {
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // Add the last cell
    cells.push(currentCell);

    return cells;
  }

  private extractTableAlignments(separatorRow: string): string[] {
    // Remove leading and trailing | and whitespace
    const trimmedRow = separatorRow.trim().replace(/^\||\|\s*$/g, '');

    // Split by |
    const cells = trimmedRow.split('|');

    // Determine alignment based on the position of : characters
    return cells.map((cell) => {
      const trimmed = cell.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
        return 'center';
      } else if (trimmed.endsWith(':')) {
        return 'right';
      } else {
        return 'left';
      }
    });
  }

  private convertCodeBlocks(markdown: string): string {
    // Process code blocks with different formats
    let result = markdown;

    // Process blocks with line numbers and language specification
    result = result.replace(
      /```line_numbers,(\w+)\n([\s\S]+?)```/g,
      (match: string, lang: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        const lines = escapedCode.split('\n');

        let numberedCode = '<div class="code-with-line-numbers">\n';
        numberedCode += '<div class="line-numbers">\n';

        for (let i = 1; i <= lines.length; i++) {
          numberedCode += `<span class="line-number">${i}</span>\n`;
        }

        numberedCode +=
          '</div>\n<pre><code class="language-' +
          lang +
          '">' +
          escapedCode +
          '</code></pre>\n</div>';
        return numberedCode;
      },
    );

    // Process command blocks (standard command)
    result = result.replace(
      /```command\n([\s\S]+?)```/g,
      (match: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<div class="command-block"><pre><code class="command">${escapedCode}</code></pre></div>`;
      },
    );

    // Process command blocks with environment
    result = result.replace(
      /```command\n\[environment\s+(\w+)\]\n([\s\S]+?)```/g,
      (match: string, env: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<div class="command-block environment-${env}"><div class="environment-label">${env}</div><pre><code class="command">${escapedCode}</code></pre></div>`;
      },
    );

    // Process super_user (root) command blocks
    result = result.replace(
      /```super_user\n([\s\S]+?)```/g,
      (match: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<div class="super-user-block"><pre><code class="super-user">${escapedCode}</code></pre></div>`;
      },
    );

    // Process custom prefix command blocks
    result = result.replace(
      /```custom_prefix\(([^)]+)\)\n([\s\S]+?)```/g,
      (match: string, prefix: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        // Handle "\s" in prefix to represent a space
        const formattedPrefix = prefix.replace(/\\s/g, ' ');
        return `<div class="custom-prefix-block" data-prefix="${this.escapeHtml(formattedPrefix)}"><pre><code>${escapedCode}</code></pre></div>`;
      },
    );

    // Process blocks with secondary labels
    result = result.replace(
      /```\n\[secondary_label\s+([^\]]+)\]\n([\s\S]+?)```/g,
      (match: string, label: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<div class="secondary-label-block"><div class="secondary-label">${label}</div><pre><code>${escapedCode}</code></pre></div>`;
      },
    );

    // Process blocks with labels and environments
    result = result.replace(
      /```(\w+)\n\[environment\s+(\w+)\]\n\[label\s+([^\]]+)\]\n([\s\S]+?)```/g,
      (
        match: string,
        lang: string,
        env: string,
        label: string,
        code: string,
      ) => {
        const escapedCode = this.escapeHtml(code);
        return `<div class="code-block environment-${env}">
          <div class="environment-label">${env}</div>
          <div class="code-label">${label}</div>
          <pre><code class="language-${lang}">${escapedCode}</code></pre>
        </div>`;
      },
    );

    // Process standard code blocks with language specification
    result = result.replace(
      /```(\w+)\n([\s\S]+?)```/g,
      (match: string, lang: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
      },
    );

    // Process plain code blocks
    result = result.replace(
      /```\n([\s\S]+?)```/g,
      (match: string, code: string) => {
        const escapedCode = this.escapeHtml(code);
        return `<pre><code>${escapedCode}</code></pre>`;
      },
    );

    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private convertFootnotes(markdown: string): string {
    const footnotes = new Map<string, string>();
    let result = markdown;

    // Extract footnote definitions
    result = result.replace(
      /^\[\^(\w+)\]:\s+([\s\S]+?)(?=\n\n|\n\[\^|$)/gm,
      (match: string, id: string, content: string) => {
        footnotes.set(id, content.trim());
        return '';
      },
    );

    // Replace footnote references
    result = result.replace(/\[\^(\w+)\]/g, (match: string, id: string) => {
      if (footnotes.has(id)) {
        return `<sup><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`;
      }
      return match;
    });

    // Add footnotes section at the end if there are any footnotes
    if (footnotes.size > 0) {
      result += '\n\n<div class="footnotes">\n<hr>\n<ol>\n';
      footnotes.forEach((content, id) => {
        result += `<li id="footnote-${id}">${content} <a href="#footnote-ref-${id}">↩</a></li>\n`;
      });
      result += '</ol>\n</div>';
    }

    return result;
  }

  private convertDefinitionLists(markdown: string): string {
    // Simple definition list conversion
    const dlRegex = /^([^\n:]+)\n:[ \t]+([\s\S]+?)(?=\n\n|\n[^: \t]|$)/gm;
    return markdown.replace(dlRegex, '<dl>\n<dt>$1</dt>\n<dd>$2</dd>\n</dl>\n');
  }

  private convertAbbreviations(markdown: string): string {
    const abbrs = new Map<string, string>();
    let result = markdown;

    // Extract abbreviation definitions
    result = result.replace(
      /^\*\[(.*?)\]:\s+(.*?)$/gm,
      (match: string, abbr: string, definition: string) => {
        abbrs.set(abbr, definition.trim());
        return '';
      },
    );

    // Replace abbreviations in text
    abbrs.forEach((definition, abbr) => {
      const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedAbbr}\\b`, 'g');
      result = result.replace(
        regex,
        `<abbr title="${definition}">${abbr}</abbr>`,
      );
    });

    return result;
  }

  private convertCustomContainers(markdown: string): string {
    // Convert custom containers like ::: warning ... :::
    return markdown.replace(
      /:::\s*(\w+)\n([\s\S]+?):::/g,
      (match: string, type: string, content: string) => {
        return `<div class="${type}">${content}</div>`;
      },
    );
  }

  private convertLineBreaks(markdown: string): string {
    // Split into paragraphs
    const paragraphs: string[] = markdown.split(/\n\n+/);

    // Process each paragraph
    const processedParagraphs = paragraphs.map((para: string) => {
      // Skip if it's already an HTML element
      if (
        para.trim().match(/^<(\w+)[^>]*>.*<\/\1>$/s) ||
        para.trim().match(/^<(\w+)[^>]*\/?>$/)
      ) {
        return para;
      }

      // Convert line breaks within paragraphs
      const processed = para.replace(/\n/g, '<br>\n');

      // Wrap in paragraph tags if not already an HTML element
      if (!processed.trim().startsWith('<')) {
        return `<p>${processed}</p>`;
      }

      return processed;
    });

    return processedParagraphs.join('\n\n');
  }

  private convertImages(markdown: string): string {
    // Basic image conversion
    let result = markdown.replace(
      /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,
      (match: string, alt: string, url: string, title: string) => {
        return `<img src="${url}" alt="${alt}"${title ? ` title="${title}"` : ''}>`;
      },
    );

    // Extended image syntax with width, height, and alignment
    result = result.replace(
      /!\[(.*?)\]\((.*?)\)\{\s*(?:width=(\d+%?|auto))?\s*(?:height=(\d+%?|auto))?\s*(?:align=(left|right|center))?\s*\}/g,
      (
        match: string,
        alt: string,
        url: string,
        width: string,
        height: string,
        align: string,
      ) => {
        let style = '';
        if (width) style += `width: ${width}; `;
        if (height) style += `height: ${height}; `;
        if (align) {
          if (align === 'left') style += 'float: left; margin-right: 10px; ';
          else if (align === 'right')
            style += 'float: right; margin-left: 10px; ';
          else if (align === 'center')
            style += 'display: block; margin: 0 auto; ';
        }

        return `<img src="${url}" alt="${alt}" style="${style.trim()}">`;
      },
    );

    return result;
  }

  private convertEmbeds(markdown: string): string {
    let result = markdown;

    // YouTube embeds [youtube videoId height width]
    result = result.replace(
      /\[youtube\s+([a-zA-Z0-9_-]+)(?:\s+(\d+))?(?:\s+(\d+))?\]/g,
      (match, videoId, height, width) => {
        const h = height || '360';
        const w = width || '640';
        return `<div class="video-embed youtube-embed">
          <iframe 
            width="${w}" 
            height="${h}" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>`;
      },
    );

    // Vimeo embeds [vimeo videoId height width]
    result = result.replace(
      /\[vimeo\s+([a-zA-Z0-9_-]+)(?:\s+(\d+))?(?:\s+(\d+))?\]/g,
      (match, videoId, height, width) => {
        const h = height || '360';
        const w = width || '640';
        return `<div class="video-embed vimeo-embed">
          <iframe 
            width="${w}" 
            height="${h}" 
            src="https://player.vimeo.com/video/${videoId}" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>`;
      },
    );

    // HTML5 video [video url type poster height width]
    result = result.replace(
      /\[video\s+([^\s]+)(?:\s+([^\s]+))?(?:\s+([^\s]+))?(?:\s+(\d+))?(?:\s+(\d+))?\]/g,
      (match, url, type, poster, height, width) => {
        const h = height ? `height="${height}"` : '';
        const w = width ? `width="${width}"` : '';
        const posterAttr = poster ? `poster="${poster}"` : '';
        const videoType = type || this.getVideoTypeFromUrl(url);

        return `<div class="video-embed html5-video">
          <video controls preload="metadata" ${h} ${w} ${posterAttr} playsinline>
            <source src="${this.ensureValidUrl(url)}" type="video/${videoType}">
            <p class="video-fallback">Your browser does not support the video tag.</p>
          </video>
          <div class="video-controls-overlay">
            <button class="play-button" aria-label="Play video"></button>
          </div>
        </div>`;
      },
    );

    // HTML5 audio [audio url type height width]
    result = result.replace(
      /\[audio\s+([^\s]+)(?:\s+([^\s]+))?(?:\s+(\d+))?(?:\s+(\d+))?\]/g,
      (match, url, type, height, width) => {
        const h = height ? `height="${height}"` : '';
        const w = width ? `width="${width}"` : '';
        const audioType = type || this.getAudioTypeFromUrl(url);

        return `<div class="audio-embed">
          <audio controls preload="metadata" ${h} ${w}>
            <source src="${this.ensureValidUrl(url)}" type="audio/${audioType}">
            <p class="audio-fallback">Your browser does not support the audio tag.</p>
          </audio>
          <div class="audio-info">
            <span class="audio-title">Audio</span>
            <span class="audio-format">${audioType.toUpperCase()}</span>
          </div>
        </div>`;
      },
    );

    // SoundCloud embeds [soundcloud url height]
    result = result.replace(
      /\[soundcloud\s+([^\s]+)(?:\s+(\d+))?\]/g,
      (match, url, height) => {
        const h = height || '166';

        return `<div class="audio-embed soundcloud-embed">
          <iframe 
            width="100%" 
            height="${h}" 
            scrolling="no" 
            frameborder="no" 
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true">
          </iframe>
        </div>`;
      },
    );

    // Spotify embeds [spotify track/album/playlist id height]
    result = result.replace(
      /\[spotify\s+(track|album|playlist)\/([a-zA-Z0-9]+)(?:\s+(\d+))?\]/g,
      (match, type, id, height) => {
        const h = height || (type === 'track' ? '80' : '380');

        return `<div class="audio-embed spotify-embed">
          <iframe 
            src="https://open.spotify.com/embed/${type}/${id}" 
            width="100%" 
            height="${h}" 
            frameborder="0" 
            allowtransparency="true" 
            allow="encrypted-media">
          </iframe>
        </div>`;
      },
    );

    return result;
  }

  // Helper method to determine video type from URL
  private getVideoTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'mp4':
        return 'mp4';
      case 'webm':
        return 'webm';
      case 'ogg':
      case 'ogv':
        return 'ogg';
      case 'mov':
        return 'quicktime';
      case 'avi':
        return 'x-msvideo';
      default:
        return 'mp4'; // Default to mp4
    }
  }

  // Helper method to determine audio type from URL
  private getAudioTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'mp3':
        return 'mpeg';
      case 'wav':
        return 'wav';
      case 'ogg':
        return 'ogg';
      case 'aac':
        return 'aac';
      case 'flac':
        return 'flac';
      case 'm4a':
        return 'mp4';
      default:
        return 'mpeg'; // Default to mp3
    }
  }

  // Add this helper method to ensure URLs are properly formatted
  private ensureValidUrl(url: string): string {
    // Remove any existing entity encoding
    let cleanUrl = url
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&quot;/g, '"');
      
    // Ensure URL is properly encoded
    return cleanUrl.trim();
  }

  private convertDetails(markdown: string): string {
    // Convert details/summary elements
    return markdown.replace(
      /\[details(\s+open)?\s+(.*?)\n([\s\S]+?)\]/g,
      (match: string, isOpen: string, summary: string, content: string) => {
        const openAttr = isOpen ? ' open' : '';
        return `<details${openAttr}><summary>${summary.trim()}</summary>${content}</details>`;
      },
    );
  }

  private convertColumns(markdown: string): string {
    // Find all column blocks
    const columnRegex = /\[column\n([\s\S]+?)\]/g;
    const columns: string[] = [];
    let match: RegExpExecArray | null;

    // Extract all column content
    while ((match = columnRegex.exec(markdown)) !== null) {
      columns.push(match[1]);
    }

    // If we have columns, replace the entire column section
    if (columns.length >= 2) {
      // Create a regex to match the entire column section
      const fullSectionRegex = /(\[column\n[\s\S]+?\][\s\n]*){2,}/g;

      return markdown.replace(fullSectionRegex, (match: string) => {
        let columnHtml = '<div class="columns">';
        columns.forEach((content) => {
          columnHtml += `<div class="column">${content}</div>`;
        });
        columnHtml += '</div>';
        return columnHtml;
      });
    }

    return markdown;
  }

  private convertCallouts(markdown: string): string {
    // Handle various callout types
    const calloutTypes = ['note', 'warning', 'info', 'draft'];

    let result = markdown;

    calloutTypes.forEach((type) => {
      // Match callouts with and without labels
      const withLabelRegex = new RegExp(
        `<\\$>\\[${type}\\]\\n\\[label\\s+([^\\]]+)\\]\\n([\\s\\S]+?)<\\$>`,
        'g',
      );
      const withoutLabelRegex = new RegExp(
        `<\\$>\\[${type}\\]\\n([\\s\S]+?)<\\$>`,
        'g',
      );

      // Process callouts with labels
      result = result.replace(
        withLabelRegex,
        (match: string, label: string, content: string) => {
          return `<div class="callout ${type}">
          <div class="callout-label">${label}</div>
          <div class="callout-content">${content}</div>
        </div>`;
        },
      );

      // Process callouts without labels
      result = result.replace(
        withoutLabelRegex,
        (match: string, content: string) => {
          return `<div class="callout ${type}">
          <div class="callout-content">${content}</div>
        </div>`;
        },
      );
    });

    return result;
  }

  private convertNotes(markdown: string): string {
    // Match **Note:** pattern and convert to styled note
    return markdown.replace(
      /\*\*Note:\*\* ([\s\S]+?)(?=\n\n|\n\*\*|\n#|$)/g,
      (match: string, content: string) => {
        return `<div class="note-block"><strong>Note:</strong> ${content.trim()}</div>`;
      },
    );
  }

  private convertHeaders(markdown: string): string {
    const slugify = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .trim(); // Trim start/end
    };

    let result = markdown;

    // Convert h1 with ID
    result = result.replace(/^# (.*$)/gm, (match: string, text: string) => {
      const id = slugify(text);
      return `<h1 id="${id}">${text}</h1>`;
    });

    // Convert h2 with ID
    result = result.replace(/^## (.*$)/gm, (match: string, text: string) => {
      const id = slugify(text);
      return `<h2 id="${id}">${text}</h2>`;
    });

    // Convert h3 with ID
    result = result.replace(/^### (.*$)/gm, (match: string, text: string) => {
      const id = slugify(text);
      return `<h3 id="${id}">${text}</h3>`;
    });

    // Convert h4 with ID
    result = result.replace(/^#### (.*$)/gm, (match: string, text: string) => {
      const id = slugify(text);
      return `<h4 id="${id}">${text}</h4>`;
    });

    // Convert h5 with ID
    result = result.replace(/^##### (.*$)/gm, (match: string, text: string) => {
      const id = slugify(text);
      return `<h5 id="${id}">${text}</h5>`;
    });

    // Convert h6 with ID
    result = result.replace(
      /^###### (.*$)/gm,
      (match: string, text: string) => {
        const id = slugify(text);
        return `<h6 id="${id}">${text}</h6>`;
      },
    );

    return result;
  }

  private convertLinks(markdown: string): string {
    // Handle standard Markdown links [text](url)
    let result = markdown.replace(
      /\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,
      (match: string, text: string, url: string, title: string) => {
        return `<a href="${url}"${title ? ` title="${title}"` : ''}>${text}</a>`;
      },
    );

    // Handle reference-style links [text](#anchor)
    result = result.replace(
      /\[(.*?)\]\(#(.*?)\)/g,
      (match: string, text: string, anchor: string) => {
        return `<a href="#${anchor}" class="anchor-link">${text}</a>`;
      },
    );

    // Handle automatic links <url>
    result = result.replace(
      /<(https?:\/\/[^>]+)>/g,
      (match: string, url: string) => {
        return `<a href="${url}" class="auto-link">${url}</a>`;
      },
    );

    return result;
  }

  /**
   * Add a new method to clean any HTML output to remove unwanted BR tags
   */
  private cleanHtml(html: string): string {
    // Remove <br> tags that appear right after HTML tags
    let cleaned = html.replace(/>(\s*)<br>/g, '>$1');

    // Remove <br> tags that appear right before HTML closing tags
    cleaned = cleaned.replace(/<br>(\s*)</g, '$1<');

    return cleaned;
  }

  // Add this new method to fix HTML entities in attribute values
  private fixHtmlEntities(html: string): string {
    // Fix quotes in HTML attribute values
    const attributeRegex = /(\s+[a-zA-Z-]+)=(&ldquo;|&rdquo;|&quot;)(.*?)(&ldquo;|&rdquo;|&quot;)/g;
    html = html.replace(attributeRegex, '$1="$3"');
    
    // Also fix direct entity usage in src attributes (common for media)
    const srcRegex = /(src|href)=(&ldquo;|&rdquo;|&quot;)(.*?)(&ldquo;|&rdquo;|&quot;)/g;
    html = html.replace(srcRegex, '$1="$3"');
    
    return html;
  }

  // Add this new method
  private processDirectMediaEmbeds(markdown: string): string {
    // For audio
    markdown = markdown.replace(
      /!\[(audio)\]\(([^)]+)\)/g,
      (match, type, url) => {
        const audioType = this.getAudioTypeFromUrl(url);
        return `<div class="audio-embed">
          <audio controls preload="metadata">
            <source src="${url}" type="audio/${audioType}">
            <p>Your browser does not support audio playback.</p>
          </audio>
        </div>`;
      }
    );

    // For video
    markdown = markdown.replace(
      /!\[(video)\]\(([^)]+)\)/g,
      (match, type, url) => {
        const videoType = this.getVideoTypeFromUrl(url);
        return `<div class="video-embed html5-video">
          <video controls preload="metadata" playsinline>
            <source src="${url}" type="video/${videoType}">
            <p>Your browser does not support video playback.</p>
          </video>
        </div>`;
      }
    );

    return markdown;
  }
}
