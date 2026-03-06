import type { MacSlidesDeck, SlideAlignment, SlideDocument } from './types';

function normalizeDirectiveMatch(src: string): RegExpMatchArray | null {
  return (
    src.match(/^<!--\s*align:\s*(center|left)\s*-->\s*\n?/) ??
    src.match(/^&lt;!--\s*align:\s*(center|left)\s*--&gt;\s*\n?/)
  );
}

export function parseSlideDirective(src: string): SlideDocument {
  const match = normalizeDirectiveMatch(src);
  if (!match) {
    return {
      raw: src,
      content: src,
      align: 'auto',
    };
  }

  return {
    raw: src,
    content: src.slice(match[0].length),
    align: match[1] as SlideAlignment,
  };
}

export function splitSlides(markdown: string): SlideDocument[] {
  return markdown
    .split(/\n---\n/)
    .map((slide) => slide.trim())
    .filter((slide) => slide.length > 0)
    .map(parseSlideDirective);
}

export function createDeck(markdown: string): MacSlidesDeck {
  return {
    markdown,
    slides: splitSlides(markdown),
  };
}

export function alignClassName(align: SlideAlignment): string {
  if (align === 'center') {
    return 'slide-content slide-all-center';
  }
  if (align === 'left') {
    return 'slide-content slide-all-left';
  }
  return 'slide-content slide-auto';
}

export function renderBasicMarkdown(src: string): string {
  let html = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) =>
    `<ol>${match.replace(/oli>/g, 'li>')}</ol>`,
  );

  return html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return '';
      }
      if (/^<[hulo]/.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}
