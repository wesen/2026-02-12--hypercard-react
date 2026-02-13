// ── CRM Domain Types ──

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  status: ContactStatus;
  tags: string[];
  [key: string]: unknown;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  website: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  [key: string]: unknown;
};

export type DealStage = 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

export type Deal = {
  id: string;
  title: string;
  contactId: string;
  companyId: string;
  stage: DealStage;
  value: number;
  probability: number;
  closeDate: string;
  [key: string]: unknown;
};

export type ActivityType = 'call' | 'email' | 'meeting' | 'note';

export type Activity = {
  id: string;
  contactId: string;
  dealId: string;
  type: ActivityType;
  subject: string;
  date: string;
  notes: string;
  [key: string]: unknown;
};

export interface CrmStateSlice {
  contacts: { items: Contact[] };
  companies: { items: Company[] };
  deals: { items: Deal[] };
  activities: { items: Activity[] };
}
