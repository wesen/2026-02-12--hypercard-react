import type { ColumnConfig, ComputedFieldConfig, FieldConfig, FilterConfig } from '@hypercard/engine';
import type { Activity, Company, Contact, Deal } from '../types';

// ── Contact columns & fields ──

export const CONTACT_COLUMNS: ColumnConfig<Contact>[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'phone', label: 'Phone', width: 120 },
  { key: 'status', label: 'Status', width: 90 },
];

export const CONTACT_FILTERS: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'lead', 'prospect', 'customer', 'churned'] },
  { field: '_search', type: 'text', placeholder: 'Search name or email...' },
];

export const CONTACT_DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'email', label: 'Email', type: 'text' },
  { id: 'phone', label: 'Phone', type: 'text' },
  { id: 'companyId', label: 'Company ID', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: ['lead', 'prospect', 'customer', 'churned'] },
];

export const CONTACT_COMPUTED: ComputedFieldConfig<Contact>[] = [
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    compute: (record) => {
      if (record.status === 'customer') return '✅ Active Customer';
      if (record.status === 'prospect') return '🔍 In Pipeline';
      if (record.status === 'churned') return '⚠️ Churned';
      return '🌱 New Lead';
    },
  },
];

export const CONTACT_FORM_FIELDS: FieldConfig[] = [
  { id: 'name', label: 'Name', type: 'text', placeholder: 'Full name', required: true },
  { id: 'email', label: 'Email', type: 'text', placeholder: 'email@company.com', required: true },
  { id: 'phone', label: 'Phone', type: 'text', placeholder: '555-0100' },
  { id: 'companyId', label: 'Company ID', type: 'text', placeholder: 'co1' },
  { id: 'status', label: 'Status', type: 'select', options: ['lead', 'prospect', 'customer', 'churned'] },
];

// ── Company columns & fields ──

export const COMPANY_COLUMNS: ColumnConfig<Company>[] = [
  { key: 'name', label: 'Company', width: '1fr' },
  { key: 'industry', label: 'Industry', width: 140 },
  { key: 'size', label: 'Size', width: 100 },
  { key: 'website', label: 'Website', width: 140 },
];

export const COMPANY_FILTERS: FilterConfig[] = [
  { field: 'size', type: 'select', options: ['All', 'startup', 'small', 'medium', 'enterprise'] },
  { field: '_search', type: 'text', placeholder: 'Search company...' },
];

export const COMPANY_DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'industry', label: 'Industry', type: 'text' },
  { id: 'website', label: 'Website', type: 'text' },
  { id: 'size', label: 'Size', type: 'select', options: ['startup', 'small', 'medium', 'enterprise'] },
];

export const COMPANY_COMPUTED: ComputedFieldConfig<Company>[] = [
  {
    id: 'tier',
    label: 'Tier',
    compute: (record) => {
      if (record.size === 'enterprise') return '🏢 Enterprise';
      if (record.size === 'medium') return '🏗️ Mid-Market';
      if (record.size === 'small') return '🏠 SMB';
      return '🚀 Startup';
    },
  },
];

// ── Deal columns & fields ──

export const DEAL_COLUMNS: ColumnConfig<Deal>[] = [
  { key: 'title', label: 'Deal', width: '1fr' },
  { key: 'stage', label: 'Stage', width: 120 },
  {
    key: 'value',
    label: 'Value',
    width: 110,
    align: 'right',
    format: (v) => `$${Number(v).toLocaleString()}`,
  },
  { key: 'probability', label: 'Prob %', width: 80, align: 'right' },
  { key: 'closeDate', label: 'Close Date', width: 110 },
];

export const DEAL_FILTERS: FilterConfig[] = [
  {
    field: 'stage',
    type: 'select',
    options: ['All', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
  },
  { field: '_search', type: 'text', placeholder: 'Search deals...' },
];

export const DEAL_DETAIL_FIELDS: FieldConfig[] = [
  { id: 'id', label: 'ID', type: 'readonly' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'contactId', label: 'Contact ID', type: 'text' },
  { id: 'companyId', label: 'Company ID', type: 'text' },
  {
    id: 'stage',
    label: 'Stage',
    type: 'select',
    options: ['qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
  },
  { id: 'value', label: 'Value ($)', type: 'number', step: 1000 },
  { id: 'probability', label: 'Probability (%)', type: 'number', step: 5 },
  { id: 'closeDate', label: 'Close Date', type: 'text' },
];

export const DEAL_COMPUTED: ComputedFieldConfig<Deal>[] = [
  {
    id: 'weightedValue',
    label: 'Weighted Value',
    compute: (record) => `$${Math.round(record.value * (record.probability / 100)).toLocaleString()}`,
  },
  {
    id: 'stageIcon',
    label: 'Stage Status',
    compute: (record) => {
      const icons: Record<string, string> = {
        qualification: '🔍 Qualifying',
        proposal: '📝 Proposal Sent',
        negotiation: '🤝 Negotiating',
        'closed-won': '🎉 Won!',
        'closed-lost': '❌ Lost',
      };
      return icons[record.stage] ?? record.stage;
    },
  },
];

export const DEAL_FORM_FIELDS: FieldConfig[] = [
  { id: 'title', label: 'Title', type: 'text', placeholder: 'Deal title', required: true },
  { id: 'contactId', label: 'Contact ID', type: 'text', placeholder: 'c1' },
  { id: 'companyId', label: 'Company ID', type: 'text', placeholder: 'co1' },
  {
    id: 'stage',
    label: 'Stage',
    type: 'select',
    options: ['qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
  },
  { id: 'value', label: 'Value ($)', type: 'number', step: 1000 },
  { id: 'probability', label: 'Probability (%)', type: 'number', step: 5 },
  { id: 'closeDate', label: 'Close Date', type: 'text', placeholder: '2026-06-30' },
];

// ── Activity columns ──

export const ACTIVITY_COLUMNS: ColumnConfig<Activity>[] = [
  { key: 'date', label: 'Date', width: 100 },
  { key: 'type', label: 'Type', width: 80 },
  { key: 'subject', label: 'Subject', width: '1fr' },
  { key: 'contactId', label: 'Contact', width: 80 },
];

export const ACTIVITY_FILTERS: FilterConfig[] = [
  { field: 'type', type: 'select', options: ['All', 'call', 'email', 'meeting', 'note'] },
  { field: '_search', type: 'text', placeholder: 'Search activities...' },
];

export const ACTIVITY_FORM_FIELDS: FieldConfig[] = [
  { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Activity subject', required: true },
  { id: 'type', label: 'Type', type: 'select', options: ['call', 'email', 'meeting', 'note'] },
  { id: 'contactId', label: 'Contact ID', type: 'text', placeholder: 'c1' },
  { id: 'dealId', label: 'Deal ID', type: 'text', placeholder: 'd1' },
  { id: 'date', label: 'Date', type: 'text', placeholder: '2026-02-13' },
  { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Details...' },
];
