import {
  type SharedActionRegistry,
  type SharedSelectorRegistry,
} from '@hypercard/engine';
import type { CrmStateSlice, ContactStatus, DealStage } from '../domain/types';
import { selectContacts } from '../features/contacts/selectors';
import { selectCompanies } from '../features/companies/selectors';
import { selectDeals } from '../features/deals/selectors';
import { selectActivities } from '../features/activities/selectors';
import {
  createContact,
  deleteContact,
  resetContacts,
  saveContact,
  setContactStatus,
} from '../features/contacts/contactsSlice';
import {
  createCompany,
  deleteCompany,
  resetCompanies,
  saveCompany,
} from '../features/companies/companiesSlice';
import {
  createDeal,
  deleteDeal,
  resetDeals,
  saveDeal,
  setDealStage,
} from '../features/deals/dealsSlice';
import {
  createActivity,
  resetActivities,
} from '../features/activities/activitiesSlice';

// ── Shared Selectors ──

export const crmSharedSelectors: SharedSelectorRegistry<CrmStateSlice> = {
  // Contacts
  'contacts.all': (state) => selectContacts(state),
  'contacts.leads': (state) => selectContacts(state).filter((c) => c.status === 'lead'),
  'contacts.customers': (state) => selectContacts(state).filter((c) => c.status === 'customer'),
  'contacts.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'contacts.byParam': (state, _args, ctx) => {
    const id = String(ctx.params.param ?? '');
    return selectContacts(state).find((c) => c.id === id) ?? null;
  },
  'contacts.byCompany': (state, _args, ctx) => {
    const companyId = String(ctx.params.param ?? '');
    return selectContacts(state).filter((c) => c.companyId === companyId);
  },

  // Companies
  'companies.all': (state) => selectCompanies(state),
  'companies.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'companies.byParam': (state, _args, ctx) => {
    const id = String(ctx.params.param ?? '');
    return selectCompanies(state).find((c) => c.id === id) ?? null;
  },
  'companies.nameMap': (state) => {
    const map: Record<string, string> = {};
    for (const c of selectCompanies(state)) {
      map[c.id] = c.name;
    }
    return map;
  },

  // Deals
  'deals.all': (state) => selectDeals(state),
  'deals.open': (state) =>
    selectDeals(state).filter((d) => !d.stage.startsWith('closed')),
  'deals.paramId': (_state, _args, ctx) => String(ctx.params.param ?? ''),
  'deals.byParam': (state, _args, ctx) => {
    const id = String(ctx.params.param ?? '');
    return selectDeals(state).find((d) => d.id === id) ?? null;
  },
  'deals.byContact': (state, _args, ctx) => {
    const contactId = String(ctx.params.param ?? '');
    return selectDeals(state).filter((d) => d.contactId === contactId);
  },
  'deals.byCompany': (state, _args, ctx) => {
    const companyId = String(ctx.params.param ?? '');
    return selectDeals(state).filter((d) => d.companyId === companyId);
  },

  // Activities
  'activities.all': (state) => selectActivities(state),
  'activities.byContact': (state, _args, ctx) => {
    const contactId = String(ctx.params.param ?? '');
    return selectActivities(state).filter((a) => a.contactId === contactId);
  },
  'activities.byDeal': (state, _args, ctx) => {
    const dealId = String(ctx.params.param ?? '');
    return selectActivities(state).filter((a) => a.dealId === dealId);
  },
  'activities.recent': (state) => {
    return [...selectActivities(state)]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  },

  // Pipeline report
  'pipeline.reportSections': (state) => {
    const deals = selectDeals(state);
    const open = deals.filter((d) => !d.stage.startsWith('closed'));
    const won = deals.filter((d) => d.stage === 'closed-won');
    const lost = deals.filter((d) => d.stage === 'closed-lost');
    const totalPipeline = open.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = open.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
    const wonRevenue = won.reduce((sum, d) => sum + d.value, 0);
    const contacts = selectContacts(state);
    const leads = contacts.filter((c) => c.status === 'lead').length;
    const customers = contacts.filter((c) => c.status === 'customer').length;

    return [
      { label: 'Open Deals', value: String(open.length) },
      { label: 'Total Pipeline', value: `$${totalPipeline.toLocaleString()}` },
      { label: 'Weighted Pipeline', value: `$${Math.round(weightedPipeline).toLocaleString()}` },
      { label: 'Won Revenue', value: `$${wonRevenue.toLocaleString()}` },
      { label: 'Lost Deals', value: String(lost.length) },
      { label: 'Total Contacts', value: String(contacts.length) },
      { label: 'Leads', value: String(leads) },
      { label: 'Customers', value: String(customers) },
    ];
  },
};

// ── Shared Actions ──

export const crmSharedActions: SharedActionRegistry<CrmStateSlice> = {
  // Contact CRUD
  'contacts.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(saveContact({
      id: String(data.id ?? ''),
      edits: (data.edits ?? {}) as Record<string, unknown>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'contacts.setStatus': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(setContactStatus({
      id: String(data.id ?? ''),
      status: String(data.status ?? '') as ContactStatus,
    }));
  },
  'contacts.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteContact({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'contacts.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const name = String(values.name ?? '').trim();
    const email = String(values.email ?? '').trim();
    if (!name || !email) {
      ctx.patchScopedState('card', { submitResult: 'Name and Email are required' });
      return;
    }
    ctx.dispatch(createContact({
      name,
      email,
      phone: String(values.phone ?? ''),
      companyId: String(values.companyId ?? ''),
      status: (values.status as ContactStatus) ?? 'lead',
      tags: [],
    }));
    ctx.patchScopedState('card', {
      submitResult: 'Contact created',
      formValues: { name: '', email: '', phone: '', companyId: '', status: 'lead' },
    });
  },
  'contacts.reset': (ctx) => {
    ctx.dispatch(resetContacts());
  },

  // Company CRUD
  'companies.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(saveCompany({
      id: String(data.id ?? ''),
      edits: (data.edits ?? {}) as Record<string, unknown>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'companies.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteCompany({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'companies.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const name = String(values.name ?? '').trim();
    if (!name) {
      ctx.patchScopedState('card', { submitResult: 'Company name is required' });
      return;
    }
    ctx.dispatch(createCompany({
      name,
      industry: String(values.industry ?? ''),
      website: String(values.website ?? ''),
      size: (values.size as 'startup' | 'small' | 'medium' | 'enterprise') ?? 'small',
    }));
    ctx.patchScopedState('card', {
      submitResult: 'Company created',
      formValues: { name: '', industry: '', website: '', size: 'small' },
    });
  },
  'companies.reset': (ctx) => {
    ctx.dispatch(resetCompanies());
  },

  // Deal CRUD
  'deals.save': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(saveDeal({
      id: String(data.id ?? ''),
      edits: (data.edits ?? {}) as Record<string, unknown>,
    }));
    ctx.patchScopedState('card', { edits: {} });
  },
  'deals.setStage': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(setDealStage({
      id: String(data.id ?? ''),
      stage: String(data.stage ?? '') as DealStage,
    }));
  },
  'deals.delete': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    ctx.dispatch(deleteDeal({ id: String(data.id ?? '') }));
    ctx.nav.back();
  },
  'deals.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const title = String(values.title ?? '').trim();
    if (!title) {
      ctx.patchScopedState('card', { submitResult: 'Deal title is required' });
      return;
    }
    ctx.dispatch(createDeal({
      title,
      contactId: String(values.contactId ?? ''),
      companyId: String(values.companyId ?? ''),
      stage: (values.stage as DealStage) ?? 'qualification',
      value: Number(values.value ?? 0),
      probability: Number(values.probability ?? 25),
      closeDate: String(values.closeDate ?? ''),
    }));
    ctx.patchScopedState('card', {
      submitResult: 'Deal created',
      formValues: { title: '', contactId: '', companyId: '', stage: 'qualification', value: 0, probability: 25, closeDate: '' },
    });
  },
  'deals.reset': (ctx) => {
    ctx.dispatch(resetDeals());
  },

  // Activity creation
  'activities.create': (ctx, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    const values = (data.values ?? {}) as Record<string, unknown>;
    const subject = String(values.subject ?? '').trim();
    if (!subject) {
      ctx.patchScopedState('card', { submitResult: 'Subject is required' });
      return;
    }
    ctx.dispatch(createActivity({
      contactId: String(values.contactId ?? ''),
      dealId: String(values.dealId ?? ''),
      type: (values.type as 'call' | 'email' | 'meeting' | 'note') ?? 'note',
      subject,
      date: String(values.date ?? new Date().toISOString().slice(0, 10)),
      notes: String(values.notes ?? ''),
    }));
    ctx.patchScopedState('card', {
      submitResult: 'Activity logged',
      formValues: { contactId: '', dealId: '', type: 'note', subject: '', date: '', notes: '' },
    });
  },
  'activities.reset': (ctx) => {
    ctx.dispatch(resetActivities());
  },

  // Global reset
  'crm.resetAll': (ctx) => {
    ctx.dispatch(resetContacts());
    ctx.dispatch(resetCompanies());
    ctx.dispatch(resetDeals());
    ctx.dispatch(resetActivities());
    ctx.patchScopedState('card', { edits: {} });
  },
};
