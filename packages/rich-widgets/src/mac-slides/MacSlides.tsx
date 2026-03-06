import { useMemo, useState } from 'react';
import { DEFAULT_MARKDOWN } from './sampleData';
import { alignClassName, createDeck, renderBasicMarkdown } from './markdown';

export interface MacSlidesProps {
  initialMarkdown?: string;
}

export function MacSlides({
  initialMarkdown = DEFAULT_MARKDOWN,
}: MacSlidesProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [currentSlide, setCurrentSlide] = useState(0);
  const deck = useMemo(() => createDeck(markdown), [markdown]);
  const safeSlideIndex = Math.min(currentSlide, Math.max(deck.slides.length - 1, 0));
  const current = deck.slides[safeSlideIndex];

  return (
    <div>
      <div>
        <strong>MacSlides</strong> scaffold
      </div>
      <div>{deck.slides.length} slides</div>
      <textarea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
      />
      {current && (
        <div>
          <button
            onClick={() => setCurrentSlide((value) => Math.max(0, value - 1))}
          >
            Prev
          </button>
          <button
            onClick={() =>
              setCurrentSlide((value) =>
                Math.min(deck.slides.length - 1, value + 1),
              )
            }
          >
            Next
          </button>
          <div
            className={alignClassName(current.align)}
            dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(current.content) }}
          />
        </div>
      )}
    </div>
  );
}
