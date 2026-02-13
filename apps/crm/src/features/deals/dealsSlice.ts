import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Deal, DealStage } from '../../domain/types';

const DEALS_SEED: Deal[] = [
  {
    id: 'd1',
    title: 'Acme Enterprise License',
    contactId: 'c1',
    companyId: 'co1',
    stage: 'negotiation',
    value: 120000,
    probability: 75,
    closeDate: '2026-03-15',
  },
  {
    id: 'd2',
    title: 'Globex Analytics Suite',
    contactId: 'c2',
    companyId: 'co2',
    stage: 'proposal',
    value: 45000,
    probability: 50,
    closeDate: '2026-04-01',
  },
  {
    id: 'd3',
    title: 'Initech Consulting Pkg',
    contactId: 'c3',
    companyId: 'co3',
    stage: 'qualification',
    value: 15000,
    probability: 25,
    closeDate: '2026-05-01',
  },
  {
    id: 'd4',
    title: 'Soylent Pilot Program',
    contactId: 'c4',
    companyId: 'co4',
    stage: 'closed-won',
    value: 8000,
    probability: 100,
    closeDate: '2026-01-20',
  },
  {
    id: 'd5',
    title: 'Umbrella Health Platform',
    contactId: 'c5',
    companyId: 'co5',
    stage: 'proposal',
    value: 200000,
    probability: 40,
    closeDate: '2026-06-30',
  },
  {
    id: 'd6',
    title: 'Acme Support Renewal',
    contactId: 'c1',
    companyId: 'co1',
    stage: 'closed-won',
    value: 30000,
    probability: 100,
    closeDate: '2026-02-01',
  },
  {
    id: 'd7',
    title: 'Globex Data Migration',
    contactId: 'c7',
    companyId: 'co2',
    stage: 'closed-lost',
    value: 60000,
    probability: 0,
    closeDate: '2026-01-15',
  },
];

function cloneSeed(): Deal[] {
  return JSON.parse(JSON.stringify(DEALS_SEED)) as Deal[];
}

function nextId(items: Deal[]): string {
  const max = items.reduce((m, d) => {
    const n = Number.parseInt(String(d.id).replace(/^d/, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `d${max + 1}`;
}

export const dealsSlice = createSlice({
  name: 'deals',
  initialState: { items: cloneSeed() },
  reducers: {
    saveDeal(state, action: PayloadAction<{ id: string; edits: Partial<Deal> }>) {
      const idx = state.items.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    setDealStage(state, action: PayloadAction<{ id: string; stage: DealStage }>) {
      const idx = state.items.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx].stage = action.payload.stage;
        if (action.payload.stage === 'closed-won') state.items[idx].probability = 100;
        if (action.payload.stage === 'closed-lost') state.items[idx].probability = 0;
      }
    },
    deleteDeal(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((d) => d.id !== action.payload.id);
    },
    createDeal(
      state,
      action: PayloadAction<{
        title: string;
        contactId: string;
        companyId: string;
        stage: DealStage;
        value: number;
        probability: number;
        closeDate: string;
      }>,
    ) {
      const p = action.payload;
      state.items.push({
        id: nextId(state.items),
        title: p.title,
        contactId: p.contactId,
        companyId: p.companyId,
        stage: p.stage,
        value: p.value,
        probability: p.probability,
        closeDate: p.closeDate,
      });
    },
    resetDeals(state) {
      state.items = cloneSeed();
    },
  },
});

export const { saveDeal, setDealStage, deleteDeal, createDeal, resetDeals } = dealsSlice.actions;
export const dealsReducer = dealsSlice.reducer;
