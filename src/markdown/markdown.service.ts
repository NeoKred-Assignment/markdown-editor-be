/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-const */
/* eslint-disable no-useless-escape */
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarkdownService {
  convertToHtml(markdown: string): string {
    // Process front matter
    markdown = this.processFrontMatter(markdown);

    // Convert headings with emoji support
    markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    markdown = markdown.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    markdown = markdown.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    markdown = markdown.replace(/^###### (.*$)/gm, '<h6>$1</h6>');

    // Convert horizontal rules
    markdown = markdown.replace(/^(___|\*\*\*|---)$/gm, '<hr>');

    // Convert typographic replacements
    markdown = this.convertTypography(markdown);

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

    // Convert lists
    markdown = this.convertLists(markdown);

    // Convert tables
    markdown = this.convertTables(markdown);

    // Convert links
    markdown = markdown.replace(
      /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g,
      (match: string, text: string, url: string, title?: string) => {
        return `<a href="${url}"${title ? ` title="${title}"` : ''}>${text}</a>`;
      },
    );

    // Convert images
    markdown = markdown.replace(
      /!\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g,
      (match: string, alt: string, url: string, title?: string) => {
        return `<img src="${url}" alt="${alt}"${title ? ` title="${title}"` : ''}>`;
      },
    );

    // Convert inline code (after code blocks)
    markdown = markdown.replace(/`([^`]+)`/g, '<code>$1</code>');

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

    // Convert line breaks (but preserve paragraphs)
    markdown = this.convertLineBreaks(markdown);

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
          for (let j = 0; j < (level - blockquoteLevel); j++) {
            result.push('<blockquote>');
          }
          blockquoteLevel = level;
          result.push(content);
        } else {
          // Decrease nesting level
          for (let j = 0; j < (blockquoteLevel - level); j++) {
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
    // This is a simplified approach - a full implementation would need a proper parser
    let result = markdown;
    
    // Handle unordered lists
    result = result.replace(/^(\s*)[*+-]\s+(.*?)$/gm, (match: string, indent: string, content: string) => {
      const indentLevel = Math.floor(indent.length / 2);
      return `${indent}<li>${content}</li>`;
    });
    
    // Handle ordered lists
    result = result.replace(/^(\s*)\d+\.\s+(.*?)$/gm, (match: string, indent: string, content: string) => {
      const indentLevel = Math.floor(indent.length / 2);
      return `${indent}<li>${content}</li>`;
    });
    
    // Wrap list items in appropriate list tags
    // This is a simplified approach that won't handle complex nesting correctly
    result = result.replace(/(<li>.*?<\/li>\n)+/gs, (match: string) => {
      // Determine if it's an ordered or unordered list based on the first item
      const isOrdered = match.includes('\\d+\\.');
      const listTag = isOrdered ? 'ol' : 'ul';
      return `<${listTag}>\n${match}</${listTag}>\n`;
    });
    
    return result;
  }

  private convertTables(markdown: string): string {
    const tableRegex = /^\|(.+)\|\r?\n\|([-:]+[-| :]*)\|\r?\n((?:\|.+\|\r?\n?)+)$/gm;

    return markdown.replace(tableRegex, (match: string, headerRow: string, alignmentRow: string, bodyRows: string) => {
      // Process header cells
      const headers = headerRow.split('|')
        .map(cell => cell.trim())
        .filter(Boolean);
      
      // Process alignment row
      const alignments = alignmentRow.split('|')
        .map(cell => cell.trim())
        .filter(Boolean)
        .map(cell => {
          if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
          if (cell.endsWith(':')) return 'right';
          return 'left';
        });

      // Start building the HTML table
      let html = '<table>\n<thead>\n<tr>\n';
      
      // Add header cells
      headers.forEach((cell, i) => {
        const align = i < alignments.length ? alignments[i] : 'left';
        html += `<th align="${align}">${cell}</th>\n`;
      });
      
      html += '</tr>\n</thead>\n<tbody>\n';
      
      // Process body rows
      const rows = bodyRows.trim().split('\n');
      rows.forEach(row => {
        const cells = row.split('|')
          .map(cell => cell.trim())
          .filter(Boolean);
        
        html += '<tr>\n';
        cells.forEach((cell, i) => {
          const align = i < alignments.length ? alignments[i] : 'left';
          html += `<td align="${align}">${cell}</td>\n`;
        });
        html += '</tr>\n';
      });
      
      html += '</tbody>\n</table>';
      return html;
    });
  }

  private convertCodeBlocks(markdown: string): string {
    // Handle code blocks with language specification
    return markdown.replace(/```(\w*)\n([\s\S]+?)```/g, (match: string, lang: string, code: string) => {
      const escapedCode = this.escapeHtml(code);
      if (lang) {
        // Use a placeholder for syntax highlighting that can be replaced client-side
        return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
      } else {
        return `<pre><code>${escapedCode}</code></pre>`;
      }
    });
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
    result = result.replace(/^\[\^(\w+)\]:\s+([\s\S]+?)(?=\n\n|\n\[\^|$)/gm, (match: string, id: string, content: string) => {
      footnotes.set(id, content.trim());
      return '';
    });

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
    result = result.replace(/^\*\[(.*?)\]:\s+(.*?)$/gm, (match: string, abbr: string, definition: string) => {
      abbrs.set(abbr, definition.trim());
      return '';
    });

    // Replace abbreviations in text
    abbrs.forEach((definition, abbr) => {
      const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedAbbr}\\b`, 'g');
      result = result.replace(regex, `<abbr title="${definition}">${abbr}</abbr>`);
    });

    return result;
  }

  private convertCustomContainers(markdown: string): string {
    // Convert custom containers like ::: warning ... :::
    return markdown.replace(/:::\s*(\w+)\n([\s\S]+?):::/g, (match: string, type: string, content: string) => {
      return `<div class="${type}">${content}</div>`;
    });
  }

  private convertLineBreaks(markdown: string): string {
    // Split into paragraphs
    const paragraphs: string[] = markdown.split(/\n\n+/);

    // Process each paragraph
    const processedParagraphs = paragraphs.map((para: string) => {
      // Skip if it's already an HTML element
      if (para.trim().match(/^<(\w+)[^>]*>.*<\/\1>$/s) || 
          para.trim().match(/^<(\w+)[^>]*\/?>$/)) {
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
}
