import {
  useState,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { CommandPalette } from '../primitives/CommandPalette';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
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

// ── Reducer types ────────────────────────────────────────────────────
interface CalcState {
  cells: Record<string, CellData>;
  clipboard: ClipboardData | null;
  sel: { r: number; c: number };
  selRange: CellRange | null;
  isDragging: boolean;
  dragStart: { r: number; c: number } | null;
  editing: boolean;
  editVal: string;
  showFind: boolean;
  findQuery: string;
  showPalette: boolean;
  colWidths: number[];
}

type CalcAction =
  | { type: 'SET_CELLS'; cells: Record<string, CellData> }
  | {
      type: 'UPDATE_CELLS';
      updater: (prev: Record<string, CellData>) => Record<string, CellData>;
    }
  | { type: 'SET_SEL'; r: number; c: number }
  | { type: 'SET_SEL_RANGE'; range: CellRange | null }
  | { type: 'START_DRAG'; r: number; c: number }
  | { type: 'END_DRAG' }
  | { type: 'SET_EDITING'; editing: boolean }
  | { type: 'SET_EDIT_VAL'; val: string }
  | { type: 'START_EDIT'; r: number; c: number; val: string }
  | { type: 'COMMIT_EDIT' }
  | {
      type: 'NAVIGATE';
      dr: number;
      dc: number;
    }
  | { type: 'TOGGLE_PALETTE' }
  | { type: 'SHOW_PALETTE' }
  | { type: 'HIDE_PALETTE' }
  | { type: 'TOGGLE_FIND' }
  | { type: 'HIDE_FIND' }
  | { type: 'SET_FIND_QUERY'; query: string }
  | { type: 'SET_CLIPBOARD'; data: ClipboardData | null }
  | { type: 'RESIZE_COL'; col: number; width: number };

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'SET_CELLS':
      return { ...state, cells: action.cells };

    case 'UPDATE_CELLS':
      return { ...state, cells: action.updater(state.cells) };

    case 'SET_SEL':
      return { ...state, sel: { r: action.r, c: action.c } };

    case 'SET_SEL_RANGE':
      return { ...state, selRange: action.range };

    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        dragStart: { r: action.r, c: action.c },
      };

    case 'END_DRAG':
      return { ...state, isDragging: false, dragStart: null };

    case 'SET_EDITING':
      return { ...state, editing: action.editing };

    case 'SET_EDIT_VAL':
      return { ...state, editVal: action.val };

    case 'START_EDIT':
      return {
        ...state,
        sel: { r: action.r, c: action.c },
        editing: true,
        editVal: action.val,
      };

    case 'COMMIT_EDIT': {
      if (!state.editing) return state;
      const key = cellId(state.sel.r, state.sel.c);
      const existing = state.cells[key] ?? EMPTY_CELL;
      return {
        ...state,
        cells: {
          ...state.cells,
          [key]: { ...existing, raw: state.editVal },
        },
        editing: false,
      };
    }

    case 'NAVIGATE': {
      // First commit any active edit, then move selection
      let cells = state.cells;
      if (state.editing) {
        const key = cellId(state.sel.r, state.sel.c);
        const existing = state.cells[key] ?? EMPTY_CELL;
        cells = { ...state.cells, [key]: { ...existing, raw: state.editVal } };
      }
      const newR = Math.max(
        0,
        Math.min(NUM_ROWS - 1, state.sel.r + action.dr),
      );
      const newC = Math.max(
        0,
        Math.min(NUM_COLS - 1, state.sel.c + action.dc),
      );
      return {
        ...state,
        cells,
        editing: false,
        sel: { r: newR, c: newC },
        selRange: null,
      };
    }

    case 'TOGGLE_PALETTE':
      return { ...state, showPalette: !state.showPalette };

    case 'SHOW_PALETTE':
      return { ...state, showPalette: true };

    case 'HIDE_PALETTE':
      return { ...state, showPalette: false };

    case 'TOGGLE_FIND':
      return { ...state, showFind: !state.showFind };

    case 'HIDE_FIND':
      return { ...state, showFind: false, findQuery: '' };

    case 'SET_FIND_QUERY':
      return { ...state, findQuery: action.query };

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.data };

    case 'RESIZE_COL': {
      const widths = [...state.colWidths];
      widths[action.col] = Math.max(40, action.width);
      return { ...state, colWidths: widths };
    }

    default:
      return state;
  }
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
    <div data-part={P.calcFindBar}>
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
        data-part={P.calcFindInput}
      />
      <input
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Replace\u2026"
        data-part={P.calcFindInput}
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
  const [state, dispatch] = useReducer(
    calcReducer,
    undefined,
    (): CalcState => ({
      cells: initialCells ?? createSampleCells(),
      clipboard: null,
      sel: { r: 0, c: 0 },
      selRange: null,
      isDragging: false,
      dragStart: null,
      editing: false,
      editVal: '',
      showFind: false,
      findQuery: '',
      showPalette: false,
      colWidths: Array(NUM_COLS).fill(DEFAULT_COL_W) as number[],
    }),
  );

  const {
    cells,
    clipboard,
    sel,
    selRange,
    isDragging,
    dragStart,
    editing,
    editVal,
    showFind,
    findQuery,
    showPalette,
    colWidths,
  } = state;

  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const getCell = useCallback(
    (r: number, c: number): CellData =>
      cells[cellId(r, c)] || EMPTY_CELL,
    [cells],
  );

  const setCell = useCallback(
    (r: number, c: number, updates: Partial<CellData>) => {
      dispatch({
        type: 'UPDATE_CELLS',
        updater: (prev) => ({
          ...prev,
          [cellId(r, c)]: { ...(prev[cellId(r, c)] ?? EMPTY_CELL), ...updates },
        }),
      });
    },
    [],
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
    dispatch({ type: 'COMMIT_EDIT' });
  }, []);

  const startEdit = useCallback(
    (r: number, c: number, initialVal?: string) => {
      const val =
        initialVal !== undefined
          ? initialVal
          : (cells[cellId(r, c)] ?? EMPTY_CELL).raw;
      dispatch({ type: 'START_EDIT', r, c, val });
      setTimeout(() => editRef.current?.focus(), 0);
    },
    [cells],
  );

  const navigate = useCallback((dr: number, dc: number) => {
    dispatch({ type: 'NAVIGATE', dr, dc });
  }, []);

  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    let count = 0;
    const q = findQuery.toLowerCase();
    Object.values(cells).forEach((c) => {
      if (c.raw.toLowerCase().includes(q)) count++;
    });
    return count;
  }, [findQuery, cells]);

  const handleFind = useCallback(
    (q: string) => dispatch({ type: 'SET_FIND_QUERY', query: q }),
    [],
  );
  const handleReplace = useCallback((f: string, r: string) => {
    if (!f) return;
    dispatch({
      type: 'UPDATE_CELLS',
      updater: (prev) => {
        const next = { ...prev };
        const fl = f.toLowerCase();
        for (const k in next) {
          if (next[k].raw.toLowerCase().includes(fl)) {
            next[k] = {
              ...next[k],
              raw: next[k].raw.replace(
                new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                r,
              ),
            };
            break;
          }
        }
        return next;
      },
    });
  }, []);
  const handleReplaceAll = useCallback((f: string, r: string) => {
    if (!f) return;
    dispatch({
      type: 'UPDATE_CELLS',
      updater: (prev) => {
        const next = { ...prev };
        const regex = new RegExp(
          f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'gi',
        );
        for (const k in next)
          next[k] = { ...next[k], raw: next[k].raw.replace(regex, r) };
        return next;
      },
    });
  }, []);

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
          dispatch({ type: 'TOGGLE_FIND' });
          break;
        case 'copy': {
          const data: Record<string, CellData> = {};
          applyToRange((r, c) => {
            data[`${r - r1},${c - c1}`] = { ...getCell(r, c) };
          });
          dispatch({
            type: 'SET_CLIPBOARD',
            data: { data, rows: r2 - r1 + 1, cols: c2 - c1 + 1 },
          });
          break;
        }
        case 'paste': {
          if (!clipboard) break;
          dispatch({
            type: 'UPDATE_CELLS',
            updater: (prev) => {
              const next = { ...prev };
              for (let dr = 0; dr < clipboard.rows; dr++) {
                for (let dc = 0; dc < clipboard.cols; dc++) {
                  const src = clipboard.data[`${dr},${dc}`];
                  if (src)
                    next[cellId(sel.r + dr, sel.c + dc)] = { ...src };
                }
              }
              return next;
            },
          });
          break;
        }
        case 'select-all':
          dispatch({
            type: 'SET_SEL_RANGE',
            range: { r1: 0, c1: 0, r2: NUM_ROWS - 1, c2: NUM_COLS - 1 },
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
          dispatch({ type: 'SET_EDITING', editing: false });
          dispatch({ type: 'SET_EDIT_VAL', val: '' });
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        dispatch({ type: 'SHOW_PALETTE' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_FIND' });
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
          navigate(1, 0);
        } else if (e.key === 'Tab') {
          e.preventDefault();
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
    [editing, sel, navigate, startEdit, execAction, showPalette],
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
    dispatch({ type: 'COMMIT_EDIT' });
    if (e.shiftKey) {
      dispatch({ type: 'SET_SEL', r, c });
      dispatch({
        type: 'SET_SEL_RANGE',
        range: { r1: sel.r, c1: sel.c, r2: r, c2: c },
      });
    } else {
      dispatch({ type: 'SET_SEL', r, c });
      dispatch({ type: 'SET_SEL_RANGE', range: null });
      dispatch({ type: 'START_DRAG', r, c });
    }
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging && dragStart) {
      dispatch({
        type: 'SET_SEL_RANGE',
        range: { r1: dragStart.r, c1: dragStart.c, r2: r, c2: c },
      });
    }
  };

  useEffect(() => {
    const up = () => dispatch({ type: 'END_DRAG' });
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
      dispatch({ type: 'RESIZE_COL', col: colIdx, width: startW + diff });
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
    <div data-part={P.calculator}>
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
        <Separator />
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
        <Separator />
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
        <Separator />
        <Btn
          onClick={() => execAction('sum-insert')}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\u03A3'}
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn
          onClick={() => dispatch({ type: 'TOGGLE_FIND' })}
          style={{ fontSize: 12, padding: '2px 7px' }}
        >
          {'\uD83D\uDD0D'}
        </Btn>
        <Btn
          onClick={() => dispatch({ type: 'SHOW_PALETTE' })}
          style={{ fontSize: 11, padding: '2px 7px' }}
        >
          {'\u2318'}P
        </Btn>
      </WidgetToolbar>

      {/* Formula Bar */}
      <div data-part={P.calcFormulaBar}>
        <div data-part={P.calcCellRef}>
          {cellId(sel.r, sel.c)}
        </div>
        <span style={{ color: 'var(--hc-color-muted)' }}>
          {'\u0192'}
        </span>
        <input
          value={formulaDisplay}
          onChange={(e) => {
            if (!editing) startEdit(sel.r, sel.c, e.target.value);
            else dispatch({ type: 'SET_EDIT_VAL', val: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitEdit();
              gridRef.current?.focus();
            } else if (e.key === 'Escape') {
              dispatch({ type: 'SET_EDITING', editing: false });
              dispatch({ type: 'SET_EDIT_VAL', val: '' });
              gridRef.current?.focus();
            }
          }}
          onFocus={() => {
            if (!editing) startEdit(sel.r, sel.c);
          }}
          data-part={P.calcFormulaInput}
        />
      </div>

      {showFind && (
        <FindBar
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => {
            dispatch({ type: 'HIDE_FIND' });
            gridRef.current?.focus();
          }}
          matchCount={matchCount}
        />
      )}

      {/* Grid */}
      <div
        data-part={P.calcGrid}
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
      >
        <div
          data-part={P.calcGridInner}
          style={{ width: totalW, height: totalH }}
        >
          {/* Column headers */}
          <div data-part={P.calcColHeaders}>
            <div
              data-part={P.calcCornerCell}
              style={{ width: ROW_HEADER_W, height: HEADER_H }}
            >
              {'\u229E'}
            </div>
            {Array.from({ length: NUM_COLS }, (_, c) => (
              <div
                key={c}
                data-part={P.calcColHeader}
                data-state={sel.c === c ? 'active' : undefined}
                style={{
                  width: colWidths[c],
                  height: HEADER_H,
                }}
              >
                {colLabel(c)}
                <div
                  onMouseDown={(e) => handleColResizeStart(c, e)}
                  data-part={P.calcColResize}
                />
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: NUM_ROWS }, (_, r) => (
            <div key={r} data-part={P.calcRow}>
              <div
                data-part={P.calcRowHeader}
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
                    data-part={P.calcCell}
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
                        data-part={P.calcCellEdit}
                        value={editVal}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_EDIT_VAL',
                            val: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            navigate(1, 0);
                            gridRef.current?.focus();
                          } else if (e.key === 'Tab') {
                            e.preventDefault();
                            navigate(0, e.shiftKey ? -1 : 1);
                            gridRef.current?.focus();
                          } else if (e.key === 'Escape') {
                            dispatch({ type: 'SET_EDITING', editing: false });
                            dispatch({ type: 'SET_EDIT_VAL', val: '' });
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
      <WidgetStatusBar>
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
      </WidgetStatusBar>

      {/* Palette */}
      {showPalette && (
        <CommandPalette
          items={CALC_ACTIONS}
          onSelect={(id) => {
            dispatch({ type: 'HIDE_PALETTE' });
            execAction(id);
            setTimeout(() => gridRef.current?.focus(), 0);
          }}
          onClose={() => {
            dispatch({ type: 'HIDE_PALETTE' });
            gridRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
