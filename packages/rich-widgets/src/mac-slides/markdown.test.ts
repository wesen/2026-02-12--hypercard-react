import { describe, expect, it } from 'vitest';
import { createDeck, parseSlideDirective, renderBasicMarkdown, splitSlides } from './markdown';

describe('macSlides markdown helpers', () => {
  it('parses alignment directives from slide headers', () => {
    expect(parseSlideDirective('<!-- align: center -->\n# Title').align).toBe('center');
    expect(parseSlideDirective('<!-- align: left -->\n# Title').align).toBe('left');
    expect(parseSlideDirective('# Title').align).toBe('auto');
  });

  it('splits markdown into trimmed slides', () => {
    const slides = splitSlides('# One\n\n---\n\n# Two');
    expect(slides).toHaveLength(2);
    expect(slides[0].content).toContain('# One');
    expect(slides[1].content).toContain('# Two');
  });

  it('renders simple markdown and creates deck metadata', () => {
    expect(renderBasicMarkdown('# Hello')).toContain('<h1>Hello</h1>');
    expect(createDeck('# One\n\n---\n\n# Two').slides).toHaveLength(2);
  });
});
