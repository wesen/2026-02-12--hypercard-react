/**
 * Data-part constants for rich widgets.
 * These follow the same convention as the engine's PARTS:
 * camelCase keys → kebab-case values in the DOM.
 */
export const RICH_PARTS = {
  // Sparkline
  sparkline: 'sparkline',

  // LogViewer
  logViewer: 'log-viewer',
  logViewerToolbar: 'log-viewer-toolbar',
  logViewerSearch: 'log-viewer-search',
  logViewerActivity: 'log-viewer-activity',
  logViewerTable: 'log-viewer-table',
  logViewerHeader: 'log-viewer-header',
  logViewerRow: 'log-viewer-row',
  logViewerCell: 'log-viewer-cell',
  logViewerLevelBadge: 'log-viewer-level-badge',
  logViewerDetail: 'log-viewer-detail',
  logViewerDetailHeader: 'log-viewer-detail-header',
  logViewerDetailField: 'log-viewer-detail-field',
  logViewerDetailStack: 'log-viewer-detail-stack',
  logViewerSidebar: 'log-viewer-sidebar',
  logViewerFilterGroup: 'log-viewer-filter-group',
  logViewerFilterItem: 'log-viewer-filter-item',
  logViewerControls: 'log-viewer-controls',
  logViewerStatusBar: 'log-viewer-status-bar',

  // ChartView
  chartView: 'chart-view',
  chartViewCanvas: 'chart-view-canvas',
  chartViewControls: 'chart-view-controls',
  chartViewControlGroup: 'chart-view-control-group',
  chartViewLegend: 'chart-view-legend',
  chartViewInfo: 'chart-view-info',

  // MacWrite
  macWrite: 'mac-write',
  macWriteToolbar: 'mac-write-toolbar',
  macWriteSeparator: 'mac-write-separator',
  macWriteFindBar: 'mac-write-find-bar',
  macWriteBody: 'mac-write-body',
  macWriteEditor: 'mac-write-editor',
  macWriteDivider: 'mac-write-divider',
  macWritePreview: 'mac-write-preview',
  macWriteStatusBar: 'mac-write-status-bar',

  // KanbanBoard
  kanban: 'kanban',
  kanbanToolbar: 'kanban-toolbar',
  kanbanSeparator: 'kanban-separator',
  kanbanBoard: 'kanban-board',
  kanbanColumn: 'kanban-column',
  kanbanColumnHeader: 'kanban-column-header',
  kanbanColumnCount: 'kanban-column-count',
  kanbanColumnCards: 'kanban-column-cards',
  kanbanCard: 'kanban-card',
  kanbanCardTitle: 'kanban-card-title',
  kanbanCardDesc: 'kanban-card-desc',
  kanbanCardTags: 'kanban-card-tags',
  kanbanTag: 'kanban-tag',
  kanbanModalOverlay: 'kanban-modal-overlay',
  kanbanModal: 'kanban-modal',
  kanbanModalHeader: 'kanban-modal-header',
  kanbanModalBody: 'kanban-modal-body',
  kanbanModalFooter: 'kanban-modal-footer',
  kanbanStatusBar: 'kanban-status-bar',

  // MacRepl
  repl: 'repl',
  replBody: 'repl-body',
  replLine: 'repl-line',
  replInputLine: 'repl-input-line',
  replPrompt: 'repl-prompt',
  replInput: 'repl-input',
  replGhost: 'repl-ghost',
  replCompletionPopup: 'repl-completion-popup',
  replCompletionItem: 'repl-completion-item',
  replStatusBar: 'repl-status-bar',

  // NodeEditor
  nodeEditor: 'node-editor',
  nodeEditorToolbar: 'node-editor-toolbar',
  nodeEditorCanvas: 'node-editor-canvas',
  nodeEditorNode: 'node-editor-node',
  nodeEditorNodeHeader: 'node-editor-node-header',
  nodeEditorNodeFields: 'node-editor-node-fields',
  nodeEditorNodePorts: 'node-editor-node-ports',
  nodeEditorPort: 'node-editor-port',
  nodeEditorStatusBar: 'node-editor-status-bar',
} as const;

export type RichPartName = (typeof RICH_PARTS)[keyof typeof RICH_PARTS];
