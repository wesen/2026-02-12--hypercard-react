import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Company } from '../../domain/types';

const COMPANIES_SEED: Company[] = [
  { id: 'co1', name: 'Acme Corp', industry: 'Technology', website: 'acme.com', size: 'enterprise' },
  { id: 'co2', name: 'Globex Inc', industry: 'Finance', website: 'globex.io', size: 'medium' },
  { id: 'co3', name: 'Initech', industry: 'Consulting', website: 'initech.biz', size: 'small' },
  { id: 'co4', name: 'Soylent Corp', industry: 'Food & Bev', website: 'soylent.co', size: 'startup' },
  { id: 'co5', name: 'Umbrella Ltd', industry: 'Healthcare', website: 'umbrella.org', size: 'enterprise' },
];

function cloneSeed(): Company[] {
  return JSON.parse(JSON.stringify(COMPANIES_SEED)) as Company[];
}

function nextId(items: Company[]): string {
  const max = items.reduce((m, c) => {
    const n = Number.parseInt(String(c.id).replace(/^co/, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `co${max + 1}`;
}

export const companiesSlice = createSlice({
  name: 'companies',
  initialState: { items: cloneSeed() },
  reducers: {
    saveCompany(state, action: PayloadAction<{ id: string; edits: Partial<Company> }>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    deleteCompany(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((c) => c.id !== action.payload.id);
    },
    createCompany(
      state,
      action: PayloadAction<{ name: string; industry: string; website: string; size: Company['size'] }>,
    ) {
      const p = action.payload;
      state.items.push({
        id: nextId(state.items),
        name: p.name,
        industry: p.industry,
        website: p.website,
        size: p.size,
      });
    },
    resetCompanies(state) {
      state.items = cloneSeed();
    },
  },
});

export const { saveCompany, deleteCompany, createCompany, resetCompanies } = companiesSlice.actions;
export const companiesReducer = companiesSlice.reducer;
