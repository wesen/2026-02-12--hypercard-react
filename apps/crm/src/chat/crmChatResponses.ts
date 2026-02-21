type FakeResponse = {
  text: string;
  actions?: Array<{
    label: string;
    action: unknown;
  }>;
};

type ResponseMatcher = (input: string) => FakeResponse | null;

type ChatNavAction = {
  scope: 'system';
  command: 'nav.go';
  payload: {
    cardId: string;
    param?: string;
  };
};

function nav(cardId: string, param?: string): ChatNavAction {
  return param
    ? { scope: 'system', command: 'nav.go', payload: { cardId, param } }
    : { scope: 'system', command: 'nav.go', payload: { cardId } };
}

/**
 * CRM-specific fake response matcher.
 * Responses reference actual seed data contacts, companies, and deals.
 */
export const crmResponseMatcher: ResponseMatcher = (input): FakeResponse | null => {
  const lower = input.toLowerCase();

  // ── Contacts ──
  if (lower.includes('contact') && (lower.includes('how many') || lower.includes('count') || lower.includes('total'))) {
    return {
      text: 'You have **7 contacts** across 5 companies:\n\n• 2 customers (Alice Johnson, Eve Martinez)\n• 2 prospects (Bob Smith, Grace Lee)\n• 2 leads (Carol Davis, Dan Wilson)\n• 1 churned (Frank Brown)\n\nWould you like to see the full list or focus on a specific group?',
      actions: [
        { label: '👤 All Contacts', action: nav('contacts') },
        { label: '➕ New Contact', action: nav('addContact') },
      ],
    };
  }

  if (lower.includes('vip') || lower.includes('important') || lower.includes('key account')) {
    return {
      text: 'Your VIP contacts are:\n\n• **Alice Johnson** (Acme Corp) — Active customer, VIP & tech tags. Has a $120K deal in negotiation.\n• **Eve Martinez** (Umbrella Ltd) — Active customer, VIP & healthcare tags. Has a $200K deal in proposal.\n\nBoth are high-value accounts worth prioritizing.',
      actions: [
        { label: '👤 Alice', action: nav('contactDetail', 'c1') },
        { label: '👤 Eve', action: nav('contactDetail', 'c5') },
      ],
    };
  }

  if (lower.includes('alice')) {
    return {
      text: 'Alice Johnson is a **customer** at Acme Corp.\n\n• Email: alice@acme.com\n• Phone: 555-0101\n• Tags: vip, tech\n• Deals: Acme Enterprise License ($120K, negotiation) + Acme Support Renewal ($30K, won)',
      actions: [{ label: '👤 View Alice', action: nav('contactDetail', 'c1') }],
    };
  }

  // ── Deals ──
  if (lower.includes('deal') && (lower.includes('open') || lower.includes('pipeline') || lower.includes('active'))) {
    return {
      text: 'You have **4 open deals** in the pipeline:\n\n1. **Acme Enterprise License** — $120,000 (75% prob, negotiation)\n2. **Globex Analytics Suite** — $45,000 (50% prob, proposal)\n3. **Initech Consulting Pkg** — $15,000 (25% prob, qualification)\n4. **Umbrella Health Platform** — $200,000 (40% prob, proposal)\n\n**Total pipeline:** $380,000\n**Weighted value:** ~$198,000',
      actions: [
        { label: '💰 View Deals', action: nav('deals') },
        { label: '📊 Pipeline', action: nav('pipeline') },
      ],
    };
  }

  if (lower.includes('won') || lower.includes('closed') || lower.includes('revenue')) {
    return {
      text: 'Closed deals summary:\n\n**Won:**\n• Soylent Pilot Program — $8,000\n• Acme Support Renewal — $30,000\n**Total won revenue: $38,000**\n\n**Lost:**\n• Globex Data Migration — $60,000\n\nYour win rate is 2/3 (67%) on closed deals.',
      actions: [
        { label: '💰 All Deals', action: nav('deals') },
        { label: '📊 Pipeline', action: nav('pipeline') },
      ],
    };
  }

  if (
    (lower.includes('deal') && lower.includes('biggest')) ||
    lower.includes('largest') ||
    lower.includes('highest value')
  ) {
    return {
      text: 'Your largest open deal is the **Umbrella Health Platform** at **$200,000** (40% probability, proposal stage).\n\nContact: Eve Martinez at Umbrella Ltd.\n\nNext steps: Follow up on legal review (expected 2-week turnaround).',
      actions: [
        { label: '💰 View Deal', action: nav('dealDetail', 'd5') },
        { label: '👤 Eve Martinez', action: nav('contactDetail', 'c5') },
      ],
    };
  }

  // ── Companies ──
  if (lower.includes('compan') && (lower.includes('how many') || lower.includes('list') || lower.includes('all'))) {
    return {
      text: 'You work with **5 companies**:\n\n• **Acme Corp** — Enterprise, Technology\n• **Globex Inc** — Medium, Finance\n• **Initech** — Small, Consulting\n• **Soylent Corp** — Startup, Food & Bev\n• **Umbrella Ltd** — Enterprise, Healthcare',
      actions: [{ label: '🏢 Companies', action: nav('companies') }],
    };
  }

  if (lower.includes('acme')) {
    return {
      text: 'Acme Corp is an **enterprise technology** company (acme.com).\n\nContacts: Alice Johnson (customer, VIP), Frank Brown (churned)\nDeals: Enterprise License ($120K, negotiation) + Support Renewal ($30K, won)\nTotal value: $150,000',
      actions: [{ label: '🏢 View Acme', action: nav('companyDetail', 'co1') }],
    };
  }

  // ── Activities ──
  if (
    lower.includes('activit') ||
    lower.includes('recent') ||
    lower.includes('last call') ||
    lower.includes('follow up')
  ) {
    return {
      text: 'Recent activities:\n\n• 📞 **Follow-up with Eve** (Feb 12) — Waiting on legal review\n• 📧 **Grace asked for discount** (Jan 10) — Cannot offer >10%\n• 📝 **Research on Initech** (Feb 10) — Budget-conscious, need lean proposal\n• 🤝 **Demo for Globex team** (Feb 8) — Good reception from Bob + 3 colleagues\n• 📧 **Sent proposal to Alice** (Feb 5) — Pricing deck + SOW attached',
      actions: [
        { label: '📝 Activity Log', action: nav('activityLog') },
        { label: '➕ Log Activity', action: nav('addActivity') },
      ],
    };
  }

  // ── Pipeline / Report ──
  if (
    lower.includes('pipeline') ||
    lower.includes('report') ||
    lower.includes('summary') ||
    lower.includes('dashboard')
  ) {
    return {
      text: 'CRM Dashboard Summary:\n\n📊 **Pipeline:** 4 open deals, $380K total, $198K weighted\n💰 **Revenue:** $38K won, $60K lost\n👤 **Contacts:** 7 total — 2 customers, 2 prospects, 2 leads, 1 churned\n🏢 **Companies:** 5 (2 enterprise, 1 medium, 1 small, 1 startup)\n📝 **Activities:** 6 logged\n\nTop priority: Umbrella Health Platform ($200K, awaiting legal)',
      actions: [
        { label: '📊 Pipeline', action: nav('pipeline') },
        { label: '💰 Deals', action: nav('deals') },
        { label: '👤 Contacts', action: nav('contacts') },
      ],
    };
  }

  // ── Help ──
  if (lower.includes('help') || lower.includes('what can')) {
    return {
      text: 'I can help you with your CRM data! Try asking:\n\n• "How many contacts do I have?"\n• "Show me open deals"\n• "Who are my VIP contacts?"\n• "Tell me about Acme Corp"\n• "What\'s in the pipeline?"\n• "Recent activities"\n• "What\'s our total revenue?"\n\nI can also navigate you to any screen — just ask!',
    };
  }

  // ── Greetings ──
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      text: "Hello! I'm your CRM assistant. I can help you with contacts, companies, deals, activities, and pipeline data.\n\nTry asking about your open deals, VIP contacts, or pipeline summary!",
      actions: [
        { label: '📊 Pipeline', action: nav('pipeline') },
        { label: '💰 Open Deals', action: nav('deals') },
      ],
    };
  }

  // ── Fallback ──
  return {
    text: `I understand you're asking about "${input}". I can help with contacts, companies, deals, activities, and pipeline data.\n\nTry being more specific, like "show open deals" or "tell me about Alice".`,
    actions: [{ label: '❓ Help', action: nav('home') }],
  };
};
