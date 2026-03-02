import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import type { CellData, CellRange, ClipboardData, CellFormat } from './types';
import {
  NUM_ROWS,
  NUM_COLS,
  DEFAULT_COL_W,
  ROW_H,
  HEADER_H,
  ROW_HEADER_W,
  EMPTY_CELL,
  colLabel,
  cellId,
} from './types';
import { evaluateFormula } from './formula';
import { createSampleCells, CALC_ACTIONS } from './sampleData';

// ── Palette ─────────────────────────────────────────────────────────
function Palette({
  onSelect,
  onClose,
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return CALC_ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.id.includes(q) ||
        a.cat.includes(q),
    ).slice(0, 14);
  }, [query]);
  useEffect(() => {
    setIdx(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && filtered[idx]) {
      e.preventDefault();
      onSelect(filtered[idx].id);
    }
  };

  return (
    <div onClick={onClose} data-part={RICH_PARTS.calcPaletteOverlay}>
      <div
        onClick={(e) => e.stopPropagation()}
        data-part={RICH_PARTS.calcPalette}
      >
        <div data-part={RICH_PARTS.calcPaletteSearch}>
          <span style={{ fontSize: 15, opacity: 0.4 }}>{'\uD83D\uDD0D'}</span>
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search actions\u2026"
            data-part={RICH_PARTS.calcPaletteInput}
          />
          <kbd data-part={RICH_PARTS.calcKbd}>esc</kbd>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--hc-color-muted)',
              }}
            >
              No actions found
            </div>
          )}
          {filtered.map((a, i) => (
            <div
              key={a.id}
              onClick={() => onSelect(a.id)}
              onMouseEnter={() => setIdx(i)}
              data-part={RICH_PARTS.calcPaletteItem}
              data-state={i === idx ? 'active' : undefined}
            >
              <span style={{ width: 24, textAlign: 'center', fontSize: 14 }}>
                {a.icon}
              </span>
              <span style={{ flex: 1, fontSize: 13 }}>{a.label}</span>
              {a.shortcut && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--hc-color-muted)',
                  }}
                >
                  {a.shortcut}
                </span>
              )}
            </div>
          ))}
        </div>
        <div data-part={RICH_PARTS.calcPaletteFooter}>
          <span>{'\u2191\u2193'} navigate</span>
          <span>{'\u23CE'} run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

// ── Find Bar ────────────────────────────────────────────────────────
function FindBar({
  onFind,
  onReplace,
  onReplaceAll,
  onClose,
  matchCount,
}: {
  onFind: (q: string) => void;
  onReplace: (f: string, r: string) => void;
  onReplaceAll: (f: string, r: string) => void;
  onClose: () => void;
  matchCount: number;
}) {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  useEffect(() => {
    onFind(find);
  }, [find, onFind]);

  return (
    <div data-part={RICH_PARTS.calcFindBar}>
      <span style={{ color: 'var(--hc-confirm-selected-bg, #000)' }}>
        {'\uD83D\uDD0D'}
      </span>
      <input
        ref={ref}
        value={find}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Find\u2026"
        data-part={RICH_PARTS.calcFindInput}
      />
      <input
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Replace\u2026"
        data-part={RICH_PARTS.calcFindInput}
      />
      <Btn onClick={() => onReplace(find, replace)} style={{ fontSize: 11 }}>
        Replace
      </Btn>
      <Btn
        onClick={() => onReplaceAll(find, replace)}
        style={{ fontSize: 11 }}
      >
        All
      </Btn>
      <span style={{ color: 'var(--hc-color-muted)', fontSize: 11 }}>
        {matchCount > 0 ? `${matchCount}` : find ? '0' : ''}
      </span>
      <div
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          cursor: 'pointer',
          opacity: 0.5,
          fontSize: 15,
        }}
      >
        {'\u2715'}
      </div>
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────
export interface MacCalcProps {
  initialCells?: Record<string, CellData>;
}

// ── Main Component ──────────────────────────────────────────────────
export function MacCalc({ initialCells }: MacCalcProps) {
  const [cells, setCells] = useState<Record<string, CellData>>(
    () => initialCells ?? createSampleCells(),
  );
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const [selRange, setSelRange] = useState<CellRange | null>(null);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [colWidths, setColWidths] = useState<number[]>(() =>
    Array(NUM_COLS).fill(DEFAULT_COL_W),
  );
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    r: number;
    c: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const getCell = useCallback(
    (r: number, c: number): CellData =>
      cells[cellId(r, c)] || EMPTY_CELL,
    [cells],
  );

  const setCell = useCallback(
    (r: number, c: number, updates: Partial<CellData>) => {
      setCells((prev) => ({
        ...prev,
        [cellId(r, c)]: { ...getCell(r, c), ...updates },
      }));
    },
    [getCell],
  );

  const getCellDisplay = useCallback(
    (r: number, c: number): string => {
      const cell = getCell(r, c);
      if (!cell.raw) return '';
      const val = cell.raw.startsWith('=')
        ? evaluateFormula(cell.raw, cells)
        : cell.raw;
      if (typeof val === 'string' && val.startsWith('#')) return val;
      if (cell.fmt === 'currency' && typeof val === 'number')
        return `$${val.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      if (cell.fmt === 'percent' && typeof val === 'number')
        return `${val.toFixed(1)}%`;
      if (cell.fmt === 'number' && typeof val === 'number')
        return val.toLocaleString();
      return String(val);
    },
    [cells, getCell],
  );

  const getRange = useCallback((): CellRange => {
    if (!selRange)
      return { r1: sel.r, c1: sel.c, r2: sel.r, c2: sel.c };
    return {
      r1: Math.min(selRange.r1, selRange.r2),
      c1: Math.min(selRange.c1, selRange.c2),
      r2: Math.max(selRange.r1, selRange.r2),
      c2: Math.max(selRange.c1, selRange.c2),
    };
  }, [sel, selRange]);

  const inRange = useCallback(
    (r: number, c: number): boolean => {
      const { r1, c1, r2, c2 } = getRange();
      return r >= r1 && r <= r2 && c >= c1 && c <= c2;
    },
    [getRange],
  );

  const commitEdit = useCallback(() => {
    if (editing) {
      setCell(sel.r, sel.c, { raw: editVal });
      setEditing(false);
    }
  }, [editing, editVal, sel, setCell]);

  const startEdit = useCallback(
    (r: number, c: number, initialVal?: string) => {
      setSel({ r, c });
      setEditing(true);
      setEditVal(initialVal !== undefined ? initialVal : getCell(r, c).raw);
      setTimeout(() => editRef.current?.focus(), 0);
    },
    [getCell],
  );

  const navigate = useCallback(
    (dr: number, dc: number) => {
      commitEdit();
      setSel((prev) => ({
        r: Math.max(0, Math.min(NUM_ROWS - 1, prev.r + dr)),
        c: Math.max(0, Math.min(NUM_COLS - 1, prev.c + dc)),
      }));
      setSelRange(null);
    },
    [commitEdit],
  );

  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    let count = 0;
    const q = findQuery.toLowerCase();
    Object.values(cells).forEach((c) => {
      if (c.raw.toLowerCase().includes(q)) count++;
    });
    return count;
  }, [findQuery, cells]);

  const handleFind = useCallback((q: string) => setFindQuery(q), []);
  const handleReplace = useCallback(
    (f: string, r: string) => {
      if (!f) return;
      setCells((prev) => {
        const next = { ...prev };
        const fl = f.toLowerCase();
        for (const k in next) {
          if (next[k].raw.toLowerCase().includes(fl)) {
            next[k] = {
              ...next[k],
              raw: next[k].raw.replace(
                new RegExp(
                  f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                  'i',
                ),
                r,
              ),
            };
            break;
          }
        }
        return next;
      });
    },
    [],
  );
  const handleReplaceAll = useCallback(
    (f: string, r: string) => {
      if (!f) return;
      setCells((prev) => {
        const next = { ...prev };
        const regex = new RegExp(
          f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'gi',
        );
        for (const k in next)
          next[k] = { ...next[k], raw: next[k].raw.replace(regex, r) };
        return next;
      });
    },
    [],
  );

  const execAction = useCallback(
    (id: string) => {
      const { r1, c1, r2, c2 } = getRange();
      const applyToRange = (fn: (r: number, c: number) => void) => {
        for (let r = r1; r <= r2; r++)
          for (let c = c1; c <= c2; c++) fn(r, c);
      };
      switch (id) {
        case 'bold':
          applyToRange((r, c) =>
            setCell(r, c, { bold: !getCell(r, c).bold }),
          );
          break;
        case 'italic':
          applyToRange((r, c) =>
            setCell(r, c, { italic: !getCell(r, c).italic }),
          );
          break;
        case 'align-left':
          applyToRange((r, c) => setCell(r, c, { align: 'left' }));
          break;
        case 'align-center':
          applyToRange((r, c) => setCell(r, c, { align: 'center' }));
          break;
        case 'align-right':
          applyToRange((r, c) => setCell(r, c, { align: 'right' }));
          break;
        case 'fmt-number':
          applyToRange((r, c) => setCell(r, c, { fmt: 'number' as CellFormat }));
          break;
        case 'fmt-currency':
          applyToRange((r, c) => setCell(r, c, { fmt: 'currency' as CellFormat }));
          break;
        case 'fmt-percent':
          applyToRange((r, c) => setCell(r, c, { fmt: 'percent' as CellFormat }));
          break;
        case 'fmt-plain':
          applyToRange((r, c) => setCell(r, c, { fmt: 'plain' as CellFormat }));
          break;
        case 'clear-cell':
          applyToRange((r, c) => setCell(r, c, { raw: '' }));
          break;
        case 'sum-insert':
          startEdit(sel.r, sel.c, '=SUM()');
          break;
        case 'avg-insert':
          startEdit(sel.r, sel.c, '=AVERAGE()');
          break;
        case 'min-insert':
          startEdit(sel.r, sel.c, '=MIN()');
          break;
        case 'max-insert':
          startEdit(sel.r, sel.c, '=MAX()');
          break;
        case 'count-insert':
          startEdit(sel.r, sel.c, '=COUNT()');
          break;
        case 'if-insert':
          startEdit(sel.r, sel.c, '=IF(,, )');
          break;
        case 'find':
          setShowFind((v) => !v);
          break;
        case 'copy': {
          const data: Record<string, CellData> = {};
          applyToRange((r, c) => {
            data[`${r - r1},${c - c1}`] = { ...getCell(r, c) };
          });
          setClipboard({
            data,
            rows: r2 - r1 + 1,
            cols: c2 - c1 + 1,
          });
          break;
        }
        case 'paste': {
          if (!clipboard) break;
          setCells((prev) => {
            const next = { ...prev };
            for (let dr = 0; dr < clipboard.rows; dr++) {
              for (let dc = 0; dc < clipboard.cols; dc++) {
                const src = clipboard.data[`${dr},${dc}`];
                if (src)
                  next[cellId(sel.r + dr, sel.c + dc)] = { ...src };
              }
            }
            return next;
          });
          break;
        }
        case 'select-all':
          setSelRange({
            r1: 0,
            c1: 0,
            r2: NUM_ROWS - 1,
            c2: NUM_COLS - 1,
          });
          break;
        case 'export': {
          let csv = '';
          for (let r = 0; r < NUM_ROWS; r++) {
            const row: string[] = [];
            for (let c = 0; c < NUM_COLS; c++)
              row.push(getCellDisplay(r, c));
            if (row.some((v) => v)) csv += row.join(',') + '\n';
          }
          try {
            navigator.clipboard?.writeText(csv);
          } catch {
            /* noop */
          }
          break;
        }
      }
    },
    [
      getRange,
      getCell,
      setCell,
      startEdit,
      sel,
      clipboard,
      getCellDisplay,
    ],
  );

  // Keyboard
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showPalette) return;
      if (e.key === 'Escape') {
        if (editing) {
          setEditing(false);
          setEditVal('');
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setShowPalette(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFind((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        execAction('bold');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        execAction('italic');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        execAction('copy');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        execAction('paste');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        execAction('select-all');
        return;
      }

      if (editing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit();
          navigate(1, 0);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit();
          navigate(0, e.shiftKey ? -1 : 1);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigate(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigate(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigate(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigate(0, 1);
          break;
        case 'Enter':
          e.preventDefault();
          startEdit(sel.r, sel.c);
          break;
        case 'Tab':
          e.preventDefault();
          navigate(0, e.shiftKey ? -1 : 1);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          execAction('clear-cell');
          break;
        case 'F2':
          e.preventDefault();
          startEdit(sel.r, sel.c);
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            startEdit(sel.r, sel.c, e.key);
          }
      }
    },
    [
      editing,
      sel,
      navigate,
      commitEdit,
      startEdit,
      execAction,
      showPalette,
    ],
  );

  // Mouse selection
  const handleCellMouseDown = (
    r: number,
    c: number,
    e: React.MouseEvent,
  ) => {
    if (e.detail === 2) {
      startEdit(r, c);
      return;
    }
    commitEdit();
    setSel({ r, c });
    if (e.shiftKey) {
      setSelRange({ r1: sel.r, c1: sel.c, r2: r, c2: c });
    } else {
      setSelRange(null);
      setDragStart({ r, c });
      setIsDragging(true);
    }
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging && dragStart) {
      setSelRange({
        r1: dragStart.r,
        c1: dragStart.c,
        r2: r,
        c2: c,
      });
    }
  };

  useEffect(() => {
    const up = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // Auto-scroll selected cell into view
  useEffect(() => {
    if (!gridRef.current) return;
    const grid = gridRef.current;
    const left =
      ROW_HEADER_W +
      colWidths.slice(0, sel.c).reduce((a, b) => a + b, 0);
    const top = HEADER_H + sel.r * ROW_H;
    if (left < grid.scrollLeft + ROW_HEADER_W)
      grid.scrollLeft = left - ROW_HEADER_W;
    if (left + colWidths[sel.c] > grid.scrollLeft + grid.clientWidth)
      grid.scrollLeft =
        left + colWidths[sel.c] - grid.clientWidth + 10;
    if (top < grid.scrollTop + HEADER_H)
      grid.scrollTop = top - HEADER_H;
    if (top + ROW_H > grid.scrollTop + grid.clientHeight)
      grid.scrollTop = top + ROW_H - grid.clientHeight + 10;
  }, [sel, colWidths]);

  // Column resize
  const handleColResizeStart = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[colIdx];
    const onMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      setColWidths((prev) => {
        const n = [...prev];
        n[colIdx] = Math.max(40, startW + diff);
        return n;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const totalW =
    ROW_HEADER_W + colWidths.reduce((a, b) => a + b, 0);
  const totalH = HEADER_H + NUM_ROWS * ROW_H;
  const currentCell = getCell(sel.r, sel.c);
  const formulaDisplay = editing ? editVal : currentCell.raw;

  return (
    <div data-part={RICH_PARTS.calculator}>
      {/* Toolbar */}
      <WidgetToolbar>
        <Btn
          onClick={() => execAction('bold')}
          data-state={currentCell.bold ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD835\uDC01'}
        </Btn>
        <Btn
          onClick={() => execAction('italic')}
          data-state={currentCell.italic ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD835\uDC3C'}
        </Btn>
        <div data-part={RICH_PARTS.calcSeparator} />
        <Btn
          onClick={() => execAction('align-left')}
          data-state={currentCell.align === 'left' ? 'active' : undefined}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AF7'}
        </Btn>
        <Btn
          onClick={() => execAction('align-center')}
          data-state={
            currentCell.align === 'center' ? 'active' : undefined
          }
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AFF'}
        </Btn>
        <Btn
          onClick={() => execAction('align-right')}
          data-state={
            currentCell.align === 'right' ? 'active' : undefined
          }
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u2AF8'}
        </Btn>
        <div data-part={RICH_PARTS.calcSeparator} />
        <Btn
          onClick={() => execAction('fmt-plain')}
          data-state={currentCell.fmt === 'plain' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          Aa
        </Btn>
        <Btn
          onClick={() => execAction('fmt-number')}
          data-state={currentCell.fmt === 'number' ? 'active' : undefined}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          #0
        </Btn>
        <Btn
          onClick={() => execAction('fmt-currency')}
          data-state={
            currentCell.fmt === 'currency' ? 'active' : undefined
          }
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          $
        </Btn>
        <Btn
          onClick={() => execAction('fmt-percent')}
          data-state={
            currentCell.fmt === 'percent' ? 'active' : undefined
          }
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          %
        </Btn>
        <div data-part={RICH_PARTS.calcSeparator} />
        <Btn
          onClick={() => execAction('sum-insert')}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u03A3'}
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn
          onClick={() => setShowFind((v) => !v)}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD83D\uDD0D'}
        </Btn>
        <Btn
          onClick={() => setShowPalette(true)}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          {'\u2318'}P
        </Btn>
      </WidgetToolbar>

      {/* Formula Bar */}
      <div data-part={RICH_PARTS.calcFormulaBar}>
        <div data-part={RICH_PARTS.calcCellRef}>
          {cellId(sel.r, sel.c)}
        </div>
        <span style={{ color: 'var(--hc-color-muted)' }}>
          {'\u0192'}
        </span>
        <input
          value={formulaDisplay}
          onChange={(e) => {
            if (!editing) startEdit(sel.r, sel.c, e.target.value);
            else setEditVal(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitEdit();
              gridRef.current?.focus();
            } else if (e.key === 'Escape') {
              setEditing(false);
              setEditVal('');
              gridRef.current?.focus();
            }
          }}
          onFocus={() => {
            if (!editing) startEdit(sel.r, sel.c);
          }}
          data-part={RICH_PARTS.calcFormulaInput}
        />
      </div>

      {showFind && (
        <FindBar
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => {
            setShowFind(false);
            setFindQuery('');
            gridRef.current?.focus();
          }}
          matchCount={matchCount}
        />
      )}

      {/* Grid */}
      <div
        data-part={RICH_PARTS.calcGrid}
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
      >
        <div
          data-part={RICH_PARTS.calcGridInner}
          style={{ width: totalW, height: totalH }}
        >
          {/* Column headers */}
          <div data-part={RICH_PARTS.calcColHeaders}>
            <div
              data-part={RICH_PARTS.calcCornerCell}
              style={{ width: ROW_HEADER_W, height: HEADER_H }}
            >
              {'\u229E'}
            </div>
            {Array.from({ length: NUM_COLS }, (_, c) => (
              <div
                key={c}
                data-part={RICH_PARTS.calcColHeader}
                data-state={sel.c === c ? 'active' : undefined}
                style={{
                  width: colWidths[c],
                  height: HEADER_H,
                }}
              >
                {colLabel(c)}
                <div
                  onMouseDown={(e) => handleColResizeStart(c, e)}
                  data-part={RICH_PARTS.calcColResize}
                />
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: NUM_ROWS }, (_, r) => (
            <div key={r} data-part={RICH_PARTS.calcRow}>
              <div
                data-part={RICH_PARTS.calcRowHeader}
                data-state={sel.r === r ? 'active' : undefined}
                style={{ width: ROW_HEADER_W, height: ROW_H }}
              >
                {r + 1}
              </div>
              {Array.from({ length: NUM_COLS }, (_, c) => {
                const cell = getCell(r, c);
                const display = getCellDisplay(r, c);
                const isSel = sel.r === r && sel.c === c;
                const isInR = inRange(r, c) && !isSel;
                const isErr =
                  typeof display === 'string' &&
                  display.startsWith('#');
                const isMatch =
                  findQuery &&
                  cell.raw
                    .toLowerCase()
                    .includes(findQuery.toLowerCase());

                return (
                  <div
                    key={c}
                    onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    data-part={RICH_PARTS.calcCell}
                    data-state={
                      isSel
                        ? 'selected'
                        : isInR
                          ? 'in-range'
                          : isMatch
                            ? 'match'
                            : undefined
                    }
                    style={{
                      width: colWidths[c],
                      height: ROW_H,
                      justifyContent:
                        cell.align === 'center'
                          ? 'center'
                          : cell.align === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                      fontWeight: cell.bold ? 'bold' : 'normal',
                      fontStyle: cell.italic ? 'italic' : 'normal',
                      color: isErr
                        ? 'var(--hc-color-error, #880000)'
                        : undefined,
                    }}
                  >
                    {isSel && editing ? (
                      <input
                        ref={editRef}
                        data-part={RICH_PARTS.calcCellEdit}
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitEdit();
                            navigate(1, 0);
                            gridRef.current?.focus();
                          } else if (e.key === 'Tab') {
                            e.preventDefault();
                            commitEdit();
                            navigate(0, e.shiftKey ? -1 : 1);
                            gridRef.current?.focus();
                          } else if (e.key === 'Escape') {
                            setEditing(false);
                            setEditVal('');
                            gridRef.current?.focus();
                          }
                        }}
                        onBlur={commitEdit}
                        style={{ textAlign: cell.align || 'left' }}
                      />
                    ) : (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          textAlign: cell.align || 'left',
                        }}
                      >
                        {display}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div data-part={RICH_PARTS.calcStatusBar}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontWeight: 'bold' }}>
            {cellId(sel.r, sel.c)}
          </span>
          {selRange &&
            (() => {
              const { r1, c1, r2, c2 } = getRange();
              if (r1 === r2 && c1 === c2) return null;
              const vals: number[] = [];
              for (let r = r1; r <= r2; r++)
                for (let c = c1; c <= c2; c++) {
                  const d = getCellDisplay(r, c);
                  const n = parseFloat(d.replace(/[$%,]/g, ''));
                  if (!isNaN(n)) vals.push(n);
                }
              return vals.length > 0 ? (
                <>
                  <span>
                    {'\u03A3'}{' '}
                    {vals
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                  </span>
                  <span>
                    x{'\u0304'}{' '}
                    {(
                      vals.reduce((a, b) => a + b, 0) / vals.length
                    ).toFixed(2)}
                  </span>
                  <span># {vals.length}</span>
                </>
              ) : null;
            })()}
          <span>
            {currentCell.raw.startsWith('=')
              ? 'Formula'
              : getCellDisplay(sel.r, sel.c)
                ? 'Value'
                : 'Empty'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span>{currentCell.fmt}</span>
        </div>
      </div>

      {/* Palette */}
      {showPalette && (
        <Palette
          onSelect={(id) => {
            setShowPalette(false);
            execAction(id);
            setTimeout(() => gridRef.current?.focus(), 0);
          }}
          onClose={() => {
            setShowPalette(false);
            gridRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
