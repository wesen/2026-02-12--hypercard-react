import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Activity, ActivityType } from '../../domain/types';

const ACTIVITIES_SEED: Activity[] = [
  {
    id: 'a1',
    contactId: 'c1',
    dealId: 'd1',
    type: 'call',
    subject: 'Intro call with Alice',
    date: '2026-02-01',
    notes: 'Discussed enterprise needs. Very interested.',
  },
  {
    id: 'a2',
    contactId: 'c1',
    dealId: 'd1',
    type: 'email',
    subject: 'Sent proposal to Alice',
    date: '2026-02-05',
    notes: 'Attached pricing deck and SOW.',
  },
  {
    id: 'a3',
    contactId: 'c2',
    dealId: 'd2',
    type: 'meeting',
    subject: 'Demo for Globex team',
    date: '2026-02-08',
    notes: 'Bob and 3 colleagues attended. Good reception.',
  },
  {
    id: 'a4',
    contactId: 'c3',
    dealId: 'd3',
    type: 'note',
    subject: 'Research on Initech',
    date: '2026-02-10',
    notes: 'Small shop, budget-conscious. Need lean proposal.',
  },
  {
    id: 'a5',
    contactId: 'c5',
    dealId: 'd5',
    type: 'call',
    subject: 'Follow-up with Eve',
    date: '2026-02-12',
    notes: 'Waiting on legal review. Expects 2-week turnaround.',
  },
  {
    id: 'a6',
    contactId: 'c7',
    dealId: 'd7',
    type: 'email',
    subject: 'Grace asked for discount',
    date: '2026-01-10',
    notes: 'Cannot offer more than 10%. Deal at risk.',
  },
];

function cloneSeed(): Activity[] {
  return JSON.parse(JSON.stringify(ACTIVITIES_SEED)) as Activity[];
}

function nextId(items: Activity[]): string {
  const max = items.reduce((m, a) => {
    const n = Number.parseInt(String(a.id).replace(/^a/, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `a${max + 1}`;
}

export const activitiesSlice = createSlice({
  name: 'activities',
  initialState: { items: cloneSeed() },
  reducers: {
    createActivity(
      state,
      action: PayloadAction<{
        contactId: string;
        dealId: string;
        type: ActivityType;
        subject: string;
        date: string;
        notes: string;
      }>,
    ) {
      const p = action.payload;
      state.items.push({
        id: nextId(state.items),
        contactId: p.contactId,
        dealId: p.dealId,
        type: p.type,
        subject: p.subject,
        date: p.date,
        notes: p.notes,
      });
    },
    deleteActivity(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((a) => a.id !== action.payload.id);
    },
    resetActivities(state) {
      state.items = cloneSeed();
    },
  },
});

export const { createActivity, deleteActivity, resetActivities } = activitiesSlice.actions;
export const activitiesReducer = activitiesSlice.reducer;
