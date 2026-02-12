export const PARTS = {
  // Widget root
  root: 'hypercard',
  // Primitives
  btn: 'btn',
  chip: 'chip',
  toast: 'toast',
  // Window chrome
  windowFrame: 'window-frame',
  titleBar: 'title-bar',
  closeBox: 'close-box',
  titleText: 'title-text',
  tabBar: 'tab-bar',
  tab: 'tab',
  // Navigation
  navBar: 'nav-bar',
  // Data display
  dataTable: 'data-table',
  tableHeader: 'table-header',
  tableRow: 'table-row',
  tableCell: 'table-cell',
  tableEmpty: 'table-empty',
  tableFooter: 'table-footer',
  // Cards
  card: 'card',
  cardTitle: 'card-title',
  cardBody: 'card-body',
  cardToolbar: 'card-toolbar',
  // Menu
  menuGrid: 'menu-grid',
  // Fields
  fieldGrid: 'field-grid',
  fieldLabel: 'field-label',
  fieldValue: 'field-value',
  fieldInput: 'field-input',
  formView: 'form-view',
  detailView: 'detail-view',
  // Buttons
  buttonGroup: 'button-group',
  // Filter
  filterBar: 'filter-bar',
  // Status
  statusBar: 'status-bar',
  // Report
  reportView: 'report-view',
  reportRow: 'report-row',
  // Chat
  chatView: 'chat-view',
  chatTimeline: 'chat-timeline',
  chatMessage: 'chat-message',
  chatComposer: 'chat-composer',
  chatInput: 'chat-input',
  chatSuggestions: 'chat-suggestions',
  // AI panel
  aiPanel: 'ai-panel',
  aiPanelHeader: 'ai-panel-header',
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
