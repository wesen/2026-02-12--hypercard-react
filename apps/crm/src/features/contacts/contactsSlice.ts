import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Contact, ContactStatus } from '../../domain/types';

const CONTACTS_SEED: Contact[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@acme.com', phone: '555-0101', companyId: 'co1', status: 'customer', tags: ['vip', 'tech'] },
  { id: 'c2', name: 'Bob Smith', email: 'bob@globex.io', phone: '555-0102', companyId: 'co2', status: 'prospect', tags: ['finance'] },
  { id: 'c3', name: 'Carol Davis', email: 'carol@initech.biz', phone: '555-0103', companyId: 'co3', status: 'lead', tags: ['consulting'] },
  { id: 'c4', name: 'Dan Wilson', email: 'dan@soylent.co', phone: '555-0104', companyId: 'co4', status: 'lead', tags: ['startup'] },
  { id: 'c5', name: 'Eve Martinez', email: 'eve@umbrella.org', phone: '555-0105', companyId: 'co5', status: 'customer', tags: ['healthcare', 'vip'] },
  { id: 'c6', name: 'Frank Brown', email: 'frank@acme.com', phone: '555-0106', companyId: 'co1', status: 'churned', tags: ['tech'] },
  { id: 'c7', name: 'Grace Lee', email: 'grace@globex.io', phone: '555-0107', companyId: 'co2', status: 'prospect', tags: ['finance', 'enterprise'] },
];

function cloneSeed(): Contact[] {
  return JSON.parse(JSON.stringify(CONTACTS_SEED)) as Contact[];
}

function nextId(items: Contact[]): string {
  const max = items.reduce((m, c) => {
    const n = Number.parseInt(String(c.id).replace(/^c/, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `c${max + 1}`;
}

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState: { items: cloneSeed() },
  reducers: {
    saveContact(state, action: PayloadAction<{ id: string; edits: Partial<Contact> }>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.edits };
      }
    },
    setContactStatus(state, action: PayloadAction<{ id: string; status: ContactStatus }>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx].status = action.payload.status;
      }
    },
    deleteContact(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((c) => c.id !== action.payload.id);
    },
    createContact(state, action: PayloadAction<{ name: string; email: string; phone: string; companyId: string; status: ContactStatus; tags: string[] }>) {
      const p = action.payload;
      state.items.push({
        id: nextId(state.items),
        name: p.name,
        email: p.email,
        phone: p.phone,
        companyId: p.companyId,
        status: p.status,
        tags: p.tags,
      });
    },
    resetContacts(state) {
      state.items = cloneSeed();
    },
  },
});

export const { saveContact, setContactStatus, deleteContact, createContact, resetContacts } = contactsSlice.actions;
export const contactsReducer = contactsSlice.reducer;
