import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { CommandPalette, type PaletteItem } from '../primitives/CommandPalette';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { alignClassName, createDeck, parseSlideDirective, renderBasicMarkdown } from './markdown';
import {
  macSlidesActions,
  type MacSlidesAction,
  type MacSlidesState,
} from './macSlidesState';
import type { SlideAlignment } from './types';

function cycleAlignment(align: SlideAlignment): SlideAlignment {
  if (align === 'auto') {
    return 'center';
  }
  if (align === 'center') {
    return 'left';
  }
  return 'auto';
}

function replaceCurrentSlideAlignment(markdown: string, slideIndex: number): string {
  const parts = markdown.split(/\n---\n/);
  const index = Math.min(slideIndex, Math.max(parts.length - 1, 0));
  const current = parts[index]?.trimStart() ?? '';
  const parsed = parseSlideDirective(current);
  const nextAlign = cycleAlignment(parsed.align);
  let nextContent = parsed.content.trimStart();

  if (nextAlign !== 'auto') {
    nextContent = `<!-- align: ${nextAlign} -->\n${nextContent}`;
  }

  parts[index] = nextContent;
  return parts.join('\n---\n');
}

function PresentationOverlay({
  slides,
  startIndex,
  onExit,
}: {
  slides: ReturnType<typeof createDeck>['slides'];
  startIndex: number;
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
      if (event.key === 'ArrowRight' || event.key === ' ') {
        setCurrentIndex((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setCurrentIndex((value) => Math.max(value - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit, slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <div
      data-part={P.msPresentation}
      onClick={() => setCurrentIndex((value) => Math.min(value + 1, slides.length - 1))}
    >
      <div data-part={P.msPresentationFrame}>
        <div
          className={alignClassName(currentSlide.align)}
          dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(currentSlide.content) }}
        />
      </div>
      <div data-part={P.msPresentationStatus}>
        {currentIndex + 1} / {slides.length} — Press Esc to exit
      </div>
    </div>
  );
}

function SlideSidebar({
  slides,
  selectedIndex,
  onSelect,
}: {
  slides: ReturnType<typeof createDeck>['slides'];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div data-part={P.msSidebar}>
      <div data-part={P.msSidebarHeader}>Slides</div>
      <div data-part={P.msSlideList}>
        {slides.length === 0 ? (
          <EmptyState
            icon="🗂️"
            message="No slides yet. Add one from the toolbar or command palette."
          />
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              data-part={P.msSlideThumb}
              data-state={index === selectedIndex ? 'active' : undefined}
              onClick={() => onSelect(index)}
            >
              <div data-part={P.msSlideThumbPreview}>
                <div
                  data-part={P.msSlideThumbContent}
                  dangerouslySetInnerHTML={{
                    __html: renderBasicMarkdown(slide.content),
                  }}
                />
              </div>
              <div data-part={P.msSlideThumbLabel}>Slide {index + 1}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditorPane({
  textareaRef,
  markdown,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  markdown: string;
  onChange: (value: string) => void;
}) {
  return (
    <div data-part={P.msPane} data-state="editor">
      <div data-part={P.msPaneHeader}>
        <span>📝 Markdown Editor</span>
        <span data-part={P.msPaneMeta}>Use `---` to separate slides</span>
      </div>
      <textarea
        ref={textareaRef}
        data-part={P.msEditor}
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={'# New Slide\n\nStart writing here…'}
      />
    </div>
  );
}

function PreviewPane({
  current,
  safeSlideIndex,
  totalSlides,
  onPrev,
  onNext,
  onAddSlide,
  onPresent,
}: {
  current: ReturnType<typeof createDeck>['slides'][number] | undefined;
  safeSlideIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onAddSlide: () => void;
  onPresent: () => void;
}) {
  return (
    <div data-part={P.msPane}>
      <div data-part={P.msPaneHeader}>
        <span>🖼️ Slide Preview</span>
        <span data-part={P.msPaneMeta}>
          {totalSlides > 0 ? `Slide ${safeSlideIndex + 1} of ${totalSlides}` : 'No slides'}
        </span>
      </div>
      <div data-part={P.msPreviewArea}>
        {current ? (
          <div data-part={P.msSlideFrame}>
            <div
              className={alignClassName(current.align)}
              dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(current.content) }}
            />
          </div>
        ) : (
          <EmptyState
            icon="🖼️"
            message="Preview will appear after you create your first slide."
          />
        )}
      </div>
      <div data-part={P.msNavRow}>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onPrev}
          disabled={safeSlideIndex === 0 || totalSlides === 0}
        >
          ◀ Prev
        </Btn>
        <Btn data-part={P.msToolbarButton} onClick={onAddSlide}>
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onPresent}
          disabled={totalSlides === 0}
        >
          ▶ Present
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onNext}
          disabled={totalSlides === 0 || safeSlideIndex >= totalSlides - 1}
        >
          Next ▶
        </Btn>
      </div>
    </div>
  );
}

export function MacSlidesView({
  state,
  dispatch,
  fileName,
}: {
  state: MacSlidesState;
  dispatch: (action: MacSlidesAction) => void;
  fileName: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deck = useMemo(() => createDeck(state.markdown), [state.markdown]);
  const safeSlideIndex = Math.min(state.currentSlide, Math.max(deck.slides.length - 1, 0));
  const current = deck.slides[safeSlideIndex];
  const currentAlignment = current?.align ?? 'auto';
  const hasSlides = deck.slides.length > 0;

  useEffect(() => {
    if (deck.slides.length === 0) {
      if (state.currentSlide !== 0) {
        dispatch(macSlidesActions.setCurrentSlide(0));
      }
      return;
    }

    if (state.currentSlide > deck.slides.length - 1) {
      dispatch(macSlidesActions.setCurrentSlide(Math.max(deck.slides.length - 1, 0)));
    }
  }, [deck.slides.length, dispatch, state.currentSlide]);

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        dispatch(macSlidesActions.setMarkdown(`${state.markdown}${text}`));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = state.markdown.slice(0, start) + text + state.markdown.slice(end);
      dispatch(macSlidesActions.setMarkdown(next));

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    },
    [dispatch, state.markdown],
  );

  const addNewSlide = useCallback(() => {
    insertAtCursor('\n\n---\n\n# New Slide\n\n');
  }, [insertAtCursor]);

  const toggleAlignment = useCallback(() => {
    if (!hasSlides) {
      return;
    }

    dispatch(
      macSlidesActions.setMarkdown(
        replaceCurrentSlideAlignment(state.markdown, safeSlideIndex),
      ),
    );
  }, [dispatch, hasSlides, safeSlideIndex, state.markdown]);

  const actions = useMemo<PaletteItem[]>(
    () => [
      { id: 'new-slide', label: 'New Slide', icon: '➕', shortcut: 'Shift+N' },
      { id: 'prev-slide', label: 'Previous Slide', icon: '◀', shortcut: '←' },
      { id: 'next-slide', label: 'Next Slide', icon: '▶', shortcut: '→' },
      { id: 'toggle-align', label: 'Cycle Alignment', icon: '☰' },
      { id: 'present', label: 'Present', icon: '🖥️', shortcut: '⌘P' },
    ],
    [],
  );

  const goPrev = useCallback(() => {
    dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)));
  }, [dispatch, safeSlideIndex]);

  const goNext = useCallback(() => {
    dispatch(
      macSlidesActions.setCurrentSlide(
        Math.min(Math.max(deck.slides.length - 1, 0), safeSlideIndex + 1),
      ),
    );
  }, [deck.slides.length, dispatch, safeSlideIndex]);

  const openPresentation = useCallback(() => {
    if (hasSlides) {
      dispatch(macSlidesActions.setPresentationOpen(true));
    }
  }, [dispatch, hasSlides]);

  const executeAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'new-slide':
          addNewSlide();
          break;
        case 'prev-slide':
          goPrev();
          break;
        case 'next-slide':
          goNext();
          break;
        case 'toggle-align':
          toggleAlignment();
          break;
        case 'present':
          openPresentation();
          break;
      }
    },
    [addNewSlide, goNext, goPrev, openPresentation, toggleAlignment],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (state.paletteOpen || state.presentationOpen) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        dispatch(macSlidesActions.setPaletteOpen(true));
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        openPresentation();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch, goNext, goPrev, openPresentation, state.paletteOpen, state.presentationOpen]);

  return (
    <div data-part={P.macSlides}>
      <WidgetToolbar>
        <Btn
          data-part={P.msToolbarButton}
          onClick={goPrev}
          disabled={!hasSlides || safeSlideIndex === 0}
        >
          ◀
        </Btn>
        <Btn data-part={P.msToolbarButton} onClick={addNewSlide}>
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={openPresentation}
          disabled={!hasSlides}
        >
          ▶ Present
        </Btn>
        <div data-part={P.msDeckStats}>
          <span>{fileName}</span>
          <span>{deck.slides.length} slides</span>
        </div>
        <div data-part={P.msToolbarSpacer} />
        <span
          data-part={P.msAlignToggle}
          data-disabled={!hasSlides ? 'true' : undefined}
          onClick={toggleAlignment}
          title="Cycle alignment: auto → center → left"
        >
          {currentAlignment === 'center'
            ? '☰ Center'
            : currentAlignment === 'left'
              ? '☰ Left'
              : '☰ Auto'}
        </span>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => dispatch(macSlidesActions.setPaletteOpen(true))}
          style={{ opacity: 0.7 }}
        >
          ⌘P
        </Btn>
      </WidgetToolbar>

      <div data-part={P.msBody}>
        <SlideSidebar
          slides={deck.slides}
          selectedIndex={safeSlideIndex}
          onSelect={(index) => dispatch(macSlidesActions.setCurrentSlide(index))}
        />
        <EditorPane
          textareaRef={textareaRef}
          markdown={state.markdown}
          onChange={(value) => dispatch(macSlidesActions.setMarkdown(value))}
        />
        <PreviewPane
          current={current}
          safeSlideIndex={safeSlideIndex}
          totalSlides={deck.slides.length}
          onPrev={goPrev}
          onNext={goNext}
          onAddSlide={addNewSlide}
          onPresent={openPresentation}
        />
      </div>

      <WidgetStatusBar>
        <span>
          {deck.slides.length} slides · {state.markdown.length} characters
        </span>
        <span>
          ←/→ navigate · ⌘P present · ⇧⌘P actions
        </span>
      </WidgetStatusBar>

      {state.paletteOpen && (
        <CommandPalette
          items={actions}
          onSelect={(id) => {
            dispatch(macSlidesActions.setPaletteOpen(false));
            executeAction(id);
          }}
          onClose={() => dispatch(macSlidesActions.setPaletteOpen(false))}
        />
      )}

      {state.presentationOpen && current && (
        <PresentationOverlay
          slides={deck.slides}
          startIndex={safeSlideIndex}
          onExit={() => dispatch(macSlidesActions.setPresentationOpen(false))}
        />
      )}
    </div>
  );
}
