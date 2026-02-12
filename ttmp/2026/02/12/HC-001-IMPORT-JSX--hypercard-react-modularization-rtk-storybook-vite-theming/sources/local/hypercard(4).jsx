import { useState, useEffect, useRef, useCallback } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE DSL — The entire HyperCard stack defined as JSON.
//  To add a new card: just add an entry to `cards`.
//  To add AI behavior: add an entry to `ai.intents`.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STACK = {
  name: "Shop Inventory",
  icon: "📇",
  homeCard: "home",
  settings: {
    aiModel: "Local LLM",
    lowStockThreshold: 3,
  },

  // ── Mutable data tables ──────────────────────────────────────
  data: {
    items: [
      { sku: "A-1002", qty: 2,  price: 9.99,  cost: 3.25,  name: "Keychain - Brass",    category: "Accessories", tags: ["gift", "sale"] },
      { sku: "A-1021", qty: 0,  price: 8.99,  cost: 2.80,  name: "Keychain - Silver",   category: "Accessories", tags: ["gift"] },
      { sku: "A-1033", qty: 5,  price: 7.99,  cost: 2.10,  name: "Keychain - Steel",    category: "Accessories", tags: ["new"] },
      { sku: "A-1055", qty: 1,  price: 12.99, cost: 4.50,  name: "Ring - Copper Band",  category: "Accessories", tags: ["artisan"] },
      { sku: "B-2001", qty: 14, price: 24.99, cost: 8.00,  name: "Mug - Ceramic Blue",  category: "Kitchen",     tags: ["popular"] },
      { sku: "B-2015", qty: 3,  price: 19.99, cost: 7.50,  name: "Mug - Hand-thrown",   category: "Kitchen",     tags: ["artisan"] },
      { sku: "C-3010", qty: 0,  price: 34.99, cost: 12.00, name: "Candle - Beeswax Lg", category: "Home",        tags: ["seasonal"] },
      { sku: "C-3011", qty: 8,  price: 14.99, cost: 5.00,  name: "Candle - Soy Sm",     category: "Home",        tags: ["popular", "gift"] },
      { sku: "D-4001", qty: 20, price: 4.99,  cost: 1.20,  name: "Sticker Pack - Logo", category: "Merch",       tags: ["cheap", "popular"] },
      { sku: "D-4002", qty: 6,  price: 18.99, cost: 6.00,  name: "Tote Bag - Canvas",   category: "Merch",       tags: ["new", "eco"] },
    ],
    salesLog: [
      { id: "s1", date: "2026-02-10", sku: "A-1002", qty: 2, total: 19.98 },
      { id: "s2", date: "2026-02-10", sku: "B-2001", qty: 1, total: 24.99 },
      { id: "s3", date: "2026-02-09", sku: "A-1002", qty: 3, total: 29.97 },
      { id: "s4", date: "2026-02-09", sku: "D-4001", qty: 5, total: 24.95 },
      { id: "s5", date: "2026-02-08", sku: "A-1002", qty: 4, total: 39.96 },
      { id: "s6", date: "2026-02-08", sku: "C-3011", qty: 2, total: 29.98 },
      { id: "s7", date: "2026-02-07", sku: "B-2015", qty: 1, total: 19.99 },
    ],
  },

  // ── Card definitions ─────────────────────────────────────────
  //
  //  Card types:
  //    "menu"    — icon grid of buttons (home screen)
  //    "list"    — data table with filters, row actions
  //    "detail"  — single-record view with editable fields
  //    "form"    — blank form that creates / updates data
  //    "chat"    — AI conversation card
  //    "report"  — computed read-only summary
  //
  cards: {
    // ─── Home ───
    home: {
      type: "menu",
      title: "Home",
      icon: "🏠",
      fields: [
        { id: "welcome", type: "label", value: "Welcome to Shop Inventory" },
        { id: "sub",     type: "label", value: "HyperCard + AI", style: "muted" },
      ],
      buttons: [
        { label: "📋 Browse Items",    action: { type: "navigate", card: "browse" } },
        { label: "⚠️ Low Stock",        action: { type: "navigate", card: "lowStock" } },
        { label: "💰 Sales Today",      action: { type: "navigate", card: "salesToday" } },
        { label: "📊 Inventory Report", action: { type: "navigate", card: "report" } },
        { label: "📦 Receive Shipment", action: { type: "navigate", card: "receive" } },
        { label: "💬 Ask AI",           action: { type: "navigate", card: "assistant" } },
        { label: "➕ New Item",          action: { type: "navigate", card: "newItem" } },
        { label: "🏷 Price Checker",    action: { type: "navigate", card: "priceCheck" } },
      ],
    },

    // ─── Browse All ───
    browse: {
      type: "list",
      title: "Browse Inventory",
      icon: "📋",
      dataSource: "items",
      columns: ["sku", "qty", "price", "name", "category"],
      sortable: true,
      filters: [
        { field: "category", type: "select", options: ["All", "Accessories", "Kitchen", "Home", "Merch"] },
        { field: "_search",  type: "text",   placeholder: "Search name or SKU…" },
      ],
      rowAction: { type: "navigate", card: "itemDetail", param: "sku" },
      toolbar: [
        { label: "➕ New", action: { type: "navigate", card: "newItem" } },
      ],
    },

    // ─── Low Stock ───
    lowStock: {
      type: "list",
      title: "Low Stock",
      icon: "⚠️",
      dataSource: "items",
      dataFilter: { field: "qty", op: "<=", value: "$settings.lowStockThreshold" },
      columns: ["sku", "qty", "price", "name", "category"],
      emptyMessage: "All stocked up! 🎉",
      toolbar: [
        { label: "📧 Email Supplier", action: { type: "toast", message: "Reorder email drafted (mock)" } },
        { label: "🖨 Print",           action: { type: "toast", message: "Sent to printer (mock)" } },
      ],
    },

    // ─── Sales Today ───
    salesToday: {
      type: "list",
      title: "Sales Log",
      icon: "💰",
      dataSource: "salesLog",
      columns: ["date", "sku", "qty", "total"],
      filters: [
        { field: "date", type: "select", options: ["All", "2026-02-10", "2026-02-09", "2026-02-08", "2026-02-07"] },
      ],
      footer: { type: "sum", field: "total", label: "Total Revenue" },
    },

    // ─── Item Detail ───
    itemDetail: {
      type: "detail",
      title: "Item: {{name}}",
      icon: "📦",
      dataSource: "items",
      keyField: "sku",
      fields: [
        { id: "sku",      label: "SKU",      type: "readonly" },
        { id: "name",     label: "Name",     type: "text" },
        { id: "category", label: "Category", type: "select", options: ["Accessories", "Kitchen", "Home", "Merch"] },
        { id: "price",    label: "Price ($)", type: "number", step: 0.01 },
        { id: "cost",     label: "Cost ($)",  type: "number", step: 0.01 },
        { id: "qty",      label: "Quantity",  type: "number", highlight: "lowStock" },
        { id: "tags",     label: "Tags",      type: "tags" },
      ],
      computed: [
        { id: "margin", label: "Margin",          expr: "((price - cost) / price * 100).toFixed(1) + '%'" },
        { id: "value",  label: "Inventory Value",  expr: "'$' + (price * qty).toFixed(2)" },
      ],
      buttons: [
        { label: "🛒 Sell 1",       action: { type: "updateQty", delta: -1 }, style: "primary" },
        { label: "🛒 Sell 5",       action: { type: "updateQty", delta: -5 } },
        { label: "📦 Receive +5",   action: { type: "updateQty", delta: 5 } },
        { label: "📦 Receive +10",  action: { type: "updateQty", delta: 10 } },
        { label: "✏️ Save Changes", action: { type: "saveItem" }, style: "primary" },
        { label: "🗑 Delete",       action: { type: "deleteItem" }, style: "danger" },
      ],
    },

    // ─── New Item Form ───
    newItem: {
      type: "form",
      title: "New Item",
      icon: "➕",
      fields: [
        { id: "sku",      label: "SKU",        type: "text",   placeholder: "e.g. E-5001", required: true },
        { id: "name",     label: "Name",       type: "text",   placeholder: "Item name",   required: true },
        { id: "category", label: "Category",   type: "select", options: ["Accessories", "Kitchen", "Home", "Merch"] },
        { id: "price",    label: "Price ($)",   type: "number", step: 0.01, default: 0 },
        { id: "cost",     label: "Cost ($)",    type: "number", step: 0.01, default: 0 },
        { id: "qty",      label: "Initial Qty", type: "number", default: 0 },
      ],
      submitAction: { type: "createItem" },
      submitLabel: "💾 Create Item",
    },

    // ─── Receive Shipment ───
    receive: {
      type: "form",
      title: "Receive Shipment",
      icon: "📦",
      fields: [
        { id: "sku", label: "SKU",     type: "text",   placeholder: "Scan or type SKU", required: true },
        { id: "qty", label: "Quantity", type: "number", default: 1, required: true },
        { id: "note", label: "Note",   type: "text",   placeholder: "PO#, condition…" },
      ],
      submitAction: { type: "receiveStock" },
      submitLabel: "📦 Receive Stock",
    },

    // ─── Price Checker ───
    priceCheck: {
      type: "form",
      title: "Price Checker",
      icon: "🏷",
      fields: [
        { id: "sku", label: "Scan / Type SKU", type: "text", placeholder: "e.g. A-1002", required: true },
      ],
      submitAction: { type: "priceCheck" },
      submitLabel: "🔍 Look Up Price",
    },

    // ─── Inventory Report ───
    report: {
      type: "report",
      title: "Inventory Report",
      icon: "📊",
      sections: [
        { label: "Total SKUs",        compute: "totalSkus" },
        { label: "Total Units",       compute: "totalUnits" },
        { label: "Retail Value",       compute: "retailValue" },
        { label: "Cost Basis",        compute: "costBasis" },
        { label: "Potential Profit",   compute: "potentialProfit" },
        { label: "Low Stock Items",   compute: "lowStockCount" },
        { label: "Out of Stock",      compute: "outOfStockCount" },
        { label: "Best Margin",       compute: "bestMargin" },
        { label: "Sales (last 3 days)", compute: "recentSalesTotal" },
      ],
    },

    // ─── AI Chat ───
    assistant: {
      type: "chat",
      title: "AI Assistant",
      icon: "💬",
      welcome: "Hello! I can help with inventory queries, sales data, restocking, and more. What do you need?",
      suggestions: [
        "What's low stock?",
        "Best selling item?",
        "Show accessories",
        "Total inventory value",
        "Highest margin items",
        "Create a report card",
      ],
    },
  },

  // ── AI intent matching ───────────────────────────────────────
  //
  //  Each intent has:
  //    patterns  — keywords to match (any match triggers)
  //    response  — template string ({{var}} interpolation)
  //    query     — optional data query to show results
  //    actions   — clickable action chips
  //    compute   — name of a special handler for complex logic
  //
  ai: {
    intents: [
      {
        patterns: ["low stock", "reorder", "out of stock", "running low"],
        response: "Items at or below the low-stock threshold (qty ≤ {{threshold}}):",
        query: { source: "items", filter: { field: "qty", op: "<=", value: "$settings.lowStockThreshold" } },
        actions: [
          { label: "📋 Open Low Stock", action: { type: "navigate", card: "lowStock" } },
          { label: "📧 Draft reorder",  action: { type: "toast", message: "Reorder email drafted" } },
        ],
      },
      {
        patterns: ["brass", "keychain", "ring", "candle", "mug", "sticker", "tote"],
        response: "Here are matching items:",
        query: { source: "items", filter: { field: "name", op: "contains", value: "$input" } },
        actions: [
          { label: "📋 Browse all", action: { type: "navigate", card: "browse" } },
        ],
      },
      {
        patterns: ["accessories", "kitchen", "home", "merch"],
        response: "Items in the {{matchCap}} category:",
        query: { source: "items", filter: { field: "category", op: "iequals", value: "$match" } },
        actions: [
          { label: "📋 Browse all", action: { type: "navigate", card: "browse" } },
        ],
      },
      {
        patterns: ["best sell", "top sell", "popular", "most sold"],
        response: "Based on recent sales log, top sellers by volume:",
        compute: "bestSellers",
        actions: [
          { label: "💰 Sales log", action: { type: "navigate", card: "salesToday" } },
        ],
      },
      {
        patterns: ["total value", "inventory value", "worth"],
        compute: "inventoryValue",
        actions: [
          { label: "📊 Full report", action: { type: "navigate", card: "report" } },
        ],
      },
      {
        patterns: ["margin", "profit", "markup"],
        compute: "marginReport",
        actions: [
          { label: "📊 Full report", action: { type: "navigate", card: "report" } },
        ],
      },
      {
        patterns: ["create card", "make card", "new report", "generate report", "snapshot"],
        compute: "createCard",
      },
      {
        patterns: ["how many", "count", "total sku", "catalog size"],
        compute: "catalogCount",
      },
      {
        patterns: ["expensive", "cheapest", "priciest", "most expensive", "least expensive"],
        compute: "priceExtreme",
      },
      {
        patterns: ["sell", "sale", "transaction"],
        response: "Recent sales data:",
        query: { source: "salesLog", limit: 5 },
        actions: [
          { label: "💰 Full sales log", action: { type: "navigate", card: "salesToday" } },
        ],
      },
    ],
    fallback: {
      response: "I'm not sure about that. Here are some things I can help with:",
      actions: [
        { label: "⚠️ Low stock",      action: { type: "aiSend", text: "low stock" } },
        { label: "💰 Best sellers",    action: { type: "aiSend", text: "best sellers" } },
        { label: "📊 Inventory value", action: { type: "aiSend", text: "total inventory value" } },
        { label: "📈 Margins",         action: { type: "aiSend", text: "highest margin" } },
      ],
    },
  },
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ENGINE — Generic renderers for each card type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const font = `"Geneva", "Chicago", "Monaco", monospace`;
const T = { bg: "#fff", alt: "#f5f4ed", ai: "#f0efe8", bdr: "#000", mut: "#777", err: "#a00", wrn: "#960", ok: "#060", lnk: "#006", hi: "#ffffcc" };

const B = {
  btn: { fontFamily: font, fontSize: 11, background: "#fff", border: `2px solid ${T.bdr}`, borderRadius: 0, padding: "3px 10px", cursor: "pointer", boxShadow: `1px 1px 0 ${T.bdr}`, userSelect: "none", whiteSpace: "nowrap" },
  inp: { fontFamily: font, fontSize: 12, border: `2px solid ${T.bdr}`, borderRadius: 0, padding: "3px 6px", outline: "none", background: "#fff", boxSizing: "border-box" },
  chip: { fontFamily: font, fontSize: 10, background: "#000", color: "#fff", border: "none", padding: "2px 8px", cursor: "pointer" },
};

function Btn({ children, active, variant, style: s, ...p }) {
  const x = active ? { background: "#000", color: "#fff" } : variant === "danger" ? { borderColor: T.err, color: T.err } : variant === "primary" ? { background: "#000", color: "#fff" } : {};
  return <button style={{ ...B.btn, ...x, ...s }} {...p}>{children}</button>;
}
function Chip({ children, ...p }) { return <button style={B.chip} {...p}>{children}</button>; }

function matchFilter(item, filter, resolve) {
  const v = resolve(filter.value); const f = item[filter.field];
  switch (filter.op) {
    case "<=": return f <= v; case ">=": return f >= v; case "==": return String(f) === String(v);
    case "!=": return f !== v; case "<": return f < v; case ">": return f > v;
    case "contains": return String(f).toLowerCase().includes(String(v).toLowerCase());
    case "iequals": return String(f).toLowerCase() === String(v).toLowerCase();
    default: return true;
  }
}
function resolveValue(val, ctx) {
  if (typeof val === "string" && val.startsWith("$settings.")) return ctx.stack.settings[val.slice(10)];
  if (val === "$input") return ctx.input || "";
  if (val === "$match") return ctx.match || "";
  return val;
}

// ── Shared data table ──
function DataTable({ items, columns, compact, onRowClick }) {
  const ws = { sku: 65, qty: 35, price: 55, name: "1fr", category: 80, total: 58, date: 78, cost: 55, id: 40 };
  const cols = columns || ["sku", "qty", "price", "name"];
  const tpl = cols.map(c => ws[c] ? (typeof ws[c] === "number" ? ws[c] + "px" : ws[c]) : "1fr").join(" ");
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ display: "grid", gridTemplateColumns: tpl, borderBottom: "2px solid #000", fontWeight: "bold", padding: "2px 4px" }}>
        {cols.map(c => <span key={c} style={{ textTransform: "uppercase" }}>{c}</span>)}
      </div>
      {items.length === 0 && <div style={{ padding: 8, color: T.mut, textAlign: "center" }}>No items</div>}
      {items.map((item, i) => (
        <div key={item.sku || item.id || i} onClick={() => onRowClick?.(item)}
          style={{ display: "grid", gridTemplateColumns: tpl, padding: "2px 4px", background: i % 2 ? "#eee" : "#fff", borderBottom: "1px solid #ccc", cursor: onRowClick ? "pointer" : "default" }}>
          {cols.map(c => {
            let v = item[c]; let st = {};
            if (c === "price" || c === "total" || c === "cost") v = "$" + Number(v).toFixed(2);
            if (c === "qty" && typeof item.qty === "number") { st.fontWeight = "bold"; st.color = item.qty === 0 ? T.err : item.qty <= STACK.settings.lowStockThreshold ? T.wrn : "#000"; }
            return <span key={c} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...st }}>{String(v ?? "")}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", fontFamily: font, fontSize: 12, padding: "6px 16px", zIndex: 999, boxShadow: "2px 2px 0 #000" }}>{message}</div>;
}

// ━━━ Card Renderers ━━━

function MenuCard({ card, dispatch }) {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "center" }}>
      <div style={{ fontSize: 32 }}>{card.icon}</div>
      {card.fields?.map(f => <div key={f.id} style={{ fontSize: f.style === "muted" ? 11 : 16, color: f.style === "muted" ? T.mut : "#000", fontWeight: f.style === "muted" ? "normal" : "bold", textAlign: "center" }}>{f.value}</div>)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8, maxWidth: 340, width: "100%" }}>
        {card.buttons?.map(b => <Btn key={b.label} onClick={() => dispatch(b.action)} style={{ width: "100%", textAlign: "left" }}>{b.label}</Btn>)}
      </div>
    </div>
  );
}

function ListCard({ card, data, dispatch }) {
  const [filters, setFilters] = useState({});
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  let items = [...(data[card.dataSource] || [])];
  if (card.dataFilter) items = items.filter(i => matchFilter(i, card.dataFilter, v => resolveValue(v, { stack: STACK })));

  // User filters
  for (const [key, val] of Object.entries(filters)) {
    if (!val || val === "All") continue;
    if (key === "_search") items = items.filter(i => (i.name || "").toLowerCase().includes(val.toLowerCase()) || (i.sku || "").toLowerCase().includes(val.toLowerCase()));
    else items = items.filter(i => String(i[key]) === val);
  }
  if (sortCol) items.sort((a, b) => (a[sortCol] > b[sortCol] ? 1 : -1) * sortDir);

  let footerText = null;
  if (card.footer?.type === "sum") {
    const sum = items.reduce((a, i) => a + (Number(i[card.footer.field]) || 0), 0);
    footerText = `${card.footer.label}: $${sum.toFixed(2)}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {(card.filters || card.toolbar) && (
        <div style={{ padding: "5px 8px", borderBottom: "1px solid #ccc", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
          {card.filters?.map(f => f.type === "select" ? (
            <select key={f.field} style={{ ...B.inp, padding: "2px 4px" }} value={filters[f.field] || "All"} onChange={e => setFilters(p => ({ ...p, [f.field]: e.target.value }))}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input key={f.field} style={{ ...B.inp, flex: 1, minWidth: 80 }} placeholder={f.placeholder} value={filters[f.field] || ""} onChange={e => setFilters(p => ({ ...p, [f.field]: e.target.value }))} />
          ))}
          {card.toolbar?.map(b => <Btn key={b.label} onClick={() => dispatch(b.action)}>{b.label}</Btn>)}
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        {items.length === 0
          ? <div style={{ padding: 16, textAlign: "center", color: T.mut }}>{card.emptyMessage || "No results"}</div>
          : <DataTable items={items} columns={card.columns}
              onRowClick={card.rowAction ? item => dispatch({ ...card.rowAction, paramValue: item[card.rowAction.param] }) : undefined} />}
      </div>
      {footerText && <div style={{ borderTop: "2px solid #000", padding: "5px 8px", fontWeight: "bold", fontSize: 12, background: T.alt }}>{footerText}</div>}
      <div style={{ borderTop: "1px solid #ccc", padding: "3px 8px", fontSize: 10, color: T.mut }}>{items.length} row{items.length !== 1 ? "s" : ""}</div>
    </div>
  );
}

function DetailCard({ card, data, dispatch, paramValue }) {
  const source = data[card.dataSource] || [];
  const original = source.find(i => i[card.keyField] === paramValue);
  const [edits, setEdits] = useState({});
  if (!original) return <div style={{ padding: 16, color: T.mut }}>Item not found: {paramValue}</div>;
  const item = { ...original, ...edits };
  const title = card.title.replace("{{name}}", item.name || "");

  return (
    <div style={{ padding: 12, overflow: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 8 }}>{card.icon} {title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "4px 8px", marginBottom: 12, maxWidth: 400 }}>
        {card.fields.map(f => {
          const val = item[f.id];
          return [
            <span key={f.id + "l"} style={{ fontSize: 11, color: T.mut, textAlign: "right", paddingTop: 3 }}>{f.label}:</span>,
            f.type === "readonly" ? (
              <span key={f.id + "v"} style={{ fontSize: 12, fontWeight: "bold" }}>{val}</span>
            ) : f.type === "tags" ? (
              <span key={f.id + "v"} style={{ fontSize: 12 }}>{(val || []).join(", ")}</span>
            ) : f.type === "select" ? (
              <select key={f.id + "v"} style={{ ...B.inp, padding: "2px 4px" }} value={val} onChange={e => setEdits(p => ({ ...p, [f.id]: e.target.value }))}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input key={f.id + "v"} style={{
                ...B.inp,
                color: f.highlight === "lowStock" && Number(val) <= STACK.settings.lowStockThreshold ? T.wrn : "#000",
                fontWeight: f.highlight === "lowStock" && Number(val) <= STACK.settings.lowStockThreshold ? "bold" : "normal",
              }}
                type={f.type === "number" ? "number" : "text"} step={f.step} value={val}
                onChange={e => setEdits(p => ({ ...p, [f.id]: f.type === "number" ? Number(e.target.value) : e.target.value }))} />
            )
          ];
        })}
        {card.computed?.map(cf => {
          let result;
          try { result = new Function("price", "cost", "qty", `return ${cf.expr}`)(item.price, item.cost, item.qty); } catch { result = "—"; }
          return [
            <span key={cf.id + "l"} style={{ fontSize: 11, color: T.mut, textAlign: "right" }}>{cf.label}:</span>,
            <span key={cf.id + "v"} style={{ fontSize: 12, fontWeight: "bold" }}>{result}</span>,
          ];
        })}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {card.buttons?.map(b => (
          <Btn key={b.label} variant={b.style} onClick={() => dispatch({ ...b.action, sku: item.sku, edits })}>{b.label}</Btn>
        ))}
      </div>
    </div>
  );
}

function FormCard({ card, data, dispatch }) {
  const [values, setValues] = useState(() => { const o = {}; card.fields.forEach(f => o[f.id] = f.default ?? ""); return o; });
  const [result, setResult] = useState(null);

  function handleSubmit() {
    if (card.fields.some(f => f.required && !values[f.id])) return;

    // Special: price check shows result inline
    if (card.submitAction.type === "priceCheck") {
      const item = (data?.items || []).find(i => i.sku.toLowerCase() === (values.sku || "").toLowerCase());
      setResult(item ? `${item.name} — $${item.price.toFixed(2)} (qty: ${item.qty})` : `SKU "${values.sku}" not found`);
      return;
    }
    dispatch({ ...card.submitAction, values });
    setResult("✅ Done!");
    setTimeout(() => { setResult(null); setValues(() => { const o = {}; card.fields.forEach(f => o[f.id] = f.default ?? ""); return o; }); }, 1500);
  }

  return (
    <div style={{ padding: 12, overflow: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>{card.icon} {card.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "6px 8px", maxWidth: 380 }}>
        {card.fields.map(f => [
          <span key={f.id + "l"} style={{ fontSize: 11, color: T.mut, textAlign: "right", paddingTop: 4 }}>{f.label}:</span>,
          f.type === "select" ? (
            <select key={f.id + "v"} style={B.inp} value={values[f.id]} onChange={e => setValues(p => ({ ...p, [f.id]: e.target.value }))}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input key={f.id + "v"} style={B.inp} type={f.type === "number" ? "number" : "text"} step={f.step}
              placeholder={f.placeholder} value={values[f.id]}
              onChange={e => setValues(p => ({ ...p, [f.id]: f.type === "number" ? Number(e.target.value) : e.target.value }))} />
          )
        ])}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <Btn variant="primary" onClick={handleSubmit}>{card.submitLabel}</Btn>
        {result && <span style={{ fontSize: 12, fontWeight: "bold" }}>{result}</span>}
      </div>
    </div>
  );
}

function ReportCard({ card, data }) {
  const items = data.items || [];
  const sales = data.salesLog || [];
  const th = STACK.settings.lowStockThreshold;

  const computeMap = {
    totalSkus: () => String(items.length),
    totalUnits: () => String(items.reduce((a, i) => a + i.qty, 0)),
    retailValue: () => "$" + items.reduce((a, i) => a + i.price * i.qty, 0).toFixed(2),
    costBasis: () => "$" + items.reduce((a, i) => a + i.cost * i.qty, 0).toFixed(2),
    potentialProfit: () => "$" + items.reduce((a, i) => a + (i.price - i.cost) * i.qty, 0).toFixed(2),
    lowStockCount: () => String(items.filter(i => i.qty <= th && i.qty > 0).length),
    outOfStockCount: () => String(items.filter(i => i.qty === 0).length),
    bestMargin: () => { const sorted = [...items].sort((a, b) => ((b.price - b.cost) / b.price) - ((a.price - a.cost) / a.price)); return sorted[0] ? `${sorted[0].sku} ${sorted[0].name} (${((sorted[0].price - sorted[0].cost) / sorted[0].price * 100).toFixed(0)}%)` : "—"; },
    recentSalesTotal: () => "$" + sales.filter(s => s.date >= "2026-02-08").reduce((a, s) => a + s.total, 0).toFixed(2),
  };

  return (
    <div style={{ padding: 12, overflow: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>{card.icon} {card.title}</div>
      <div style={{ border: "2px solid #000", maxWidth: 400 }}>
        {card.sections.map((sec, i) => (
          <div key={sec.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderBottom: i < card.sections.length - 1 ? "1px solid #ccc" : "none", background: i % 2 ? "#f8f8f4" : "#fff" }}>
            <span style={{ fontSize: 12 }}>{sec.label}</span>
            <span style={{ fontSize: 12, fontWeight: "bold" }}>{computeMap[sec.compute]?.() ?? "—"}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
        <Btn onClick={() => {}}>🖨 Print</Btn>
        <Btn onClick={() => {}}>📧 Email</Btn>
      </div>
    </div>
  );
}

function ChatCard({ card, data, dispatch }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: card.welcome }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const processInput = useCallback((text) => {
    const lower = text.toLowerCase();
    const items = data.items || [];
    const sales = data.salesLog || [];

    for (const intent of STACK.ai.intents) {
      const matched = intent.patterns.find(p => lower.includes(p));
      if (!matched) continue;

      // Computed intents
      if (intent.compute) {
        if (intent.compute === "inventoryValue") {
          const rv = items.reduce((a, i) => a + i.price * i.qty, 0);
          const cv = items.reduce((a, i) => a + i.cost * i.qty, 0);
          return { text: `Total retail value: $${rv.toFixed(2)}\nCost basis: $${cv.toFixed(2)}\nPotential profit: $${(rv - cv).toFixed(2)}`, actions: intent.actions };
        }
        if (intent.compute === "marginReport") {
          const sorted = [...items].sort((a, b) => ((b.price - b.cost) / b.price) - ((a.price - a.cost) / a.price));
          const top = sorted.slice(0, 4);
          return { text: "Top margin items:\n" + top.map(i => `  ${i.sku} ${i.name}: ${((i.price - i.cost) / i.price * 100).toFixed(0)}%`).join("\n"), results: top, actions: intent.actions };
        }
        if (intent.compute === "bestSellers") {
          const counts = {}; sales.forEach(s => { counts[s.sku] = (counts[s.sku] || 0) + s.qty; });
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          const topSkus = sorted.slice(0, 3).map(([sku, qty]) => ({ sku, soldQty: qty }));
          const results = topSkus.map(t => items.find(i => i.sku === t.sku)).filter(Boolean);
          return { text: "Top sellers by volume:\n" + topSkus.map(t => `  ${t.sku}: ${t.soldQty} units sold`).join("\n"), results, actions: intent.actions };
        }
        if (intent.compute === "createCard") {
          return { text: 'Created snapshot card "Report ' + new Date().toISOString().slice(0, 10) + '" with current stats.', isCardCreated: true,
            actions: [{ label: "📊 Open report", action: { type: "navigate", card: "report" } }] };
        }
        if (intent.compute === "catalogCount") {
          const cats = {}; items.forEach(i => cats[i.category] = (cats[i.category] || 0) + 1);
          return { text: `${items.length} items in catalog:\n` + Object.entries(cats).map(([c, n]) => `  ${c}: ${n}`).join("\n"), actions: [{ label: "📋 Browse", action: { type: "navigate", card: "browse" } }] };
        }
        if (intent.compute === "priceExtreme") {
          const exp = lower.includes("cheap") || lower.includes("least") ? "cheapest" : "expensive";
          const sorted = [...items].sort((a, b) => exp === "cheapest" ? a.price - b.price : b.price - a.price);
          const top = sorted.slice(0, 3);
          return { text: (exp === "cheapest" ? "Cheapest" : "Most expensive") + " items:", results: top, actions: [{ label: "📋 Browse", action: { type: "navigate", card: "browse" } }] };
        }
      }

      // Query-based intents
      if (intent.query) {
        let src = data[intent.query.source] || [];
        if (intent.query.filter) src = src.filter(i => matchFilter(i, intent.query.filter, v => resolveValue(v, { stack: STACK, input: text, match: matched })));
        if (intent.query.limit) src = src.slice(0, intent.query.limit);
        const resp = (intent.response || "").replace("{{threshold}}", STACK.settings.lowStockThreshold).replace("{{matchCap}}", matched.charAt(0).toUpperCase() + matched.slice(1));
        return { text: resp, results: src, actions: intent.actions };
      }

      return { text: intent.response || "Done.", actions: intent.actions };
    }

    return { text: STACK.ai.fallback.response, actions: STACK.ai.fallback.actions };
  }, [data]);

  function send(text) {
    if (!text?.trim()) return;
    const resp = processInput(text.trim());
    setMsgs(m => [...m, { role: "user", text: text.trim() }, { role: "ai", ...resp }]);
    setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 10px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, paddingLeft: m.role === "ai" ? 8 : 0, borderLeft: m.role === "ai" ? "3px solid #000" : "none" }}>
            <div style={{ fontSize: 10, fontWeight: "bold", color: m.role === "user" ? T.lnk : T.ok }}>{m.role === "user" ? "You:" : "AI:"}</div>
            <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.results?.length > 0 && (
              <div style={{ marginTop: 3, border: "1px solid #000", background: "#fff", padding: 3 }}>
                <DataTable items={m.results} columns={m.results[0]?.sku ? ["sku", "qty", "price", "name"] : undefined} compact
                  onRowClick={m.results[0]?.sku ? item => dispatch({ type: "navigate", card: "itemDetail", paramValue: item.sku }) : undefined} />
              </div>
            )}
            {m.isCardCreated && <div style={{ marginTop: 3, padding: "3px 8px", border: `2px dashed ${T.ok}`, background: "#efffef", fontSize: 10 }}>📋 Card created</div>}
            {m.actions && <div style={{ marginTop: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
              {m.actions.map((a, j) => <Chip key={j} onClick={() => { if (a.action?.type === "aiSend") send(a.action.text); else if (a.action) dispatch(a.action); }}>{a.label}</Chip>)}
            </div>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {msgs.length <= 1 && card.suggestions && (
        <div style={{ padding: "4px 8px", borderTop: "1px solid #ccc", display: "flex", gap: 3, flexWrap: "wrap" }}>
          {card.suggestions.map(s => <Chip key={s} onClick={() => send(s)}>{s}</Chip>)}
        </div>
      )}
      <div style={{ borderTop: "2px solid #000", padding: "5px 8px", display: "flex", gap: 4, flexShrink: 0 }}>
        <input style={{ ...B.inp, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Ask about inventory…" />
        <Btn onClick={() => send(input)}>Send</Btn>
      </div>
    </div>
  );
}

// ━━━ Layout Shells ━━━

function NavBar({ dispatch, navLen, currentCard }) {
  const def = STACK.cards[currentCard];
  return (
    <div style={{ padding: "4px 8px", borderBottom: "1px solid #ccc", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
      {navLen > 1 && <Btn onClick={() => dispatch({ type: "back" })}>⬅</Btn>}
      <Btn active={currentCard === "home"} onClick={() => dispatch({ type: "navigate", card: "home" })}>🏠</Btn>
      <Btn active={currentCard === "browse"} onClick={() => dispatch({ type: "navigate", card: "browse" })}>📋</Btn>
      <Btn active={currentCard === "lowStock"} onClick={() => dispatch({ type: "navigate", card: "lowStock" })}>⚠️</Btn>
      <Btn active={currentCard === "assistant"} onClick={() => dispatch({ type: "navigate", card: "assistant" })}>💬</Btn>
      <span style={{ marginLeft: "auto", fontSize: 10, color: T.mut }}>{def?.icon} {def?.title || currentCard}</span>
    </div>
  );
}

function LayoutSplit({ cardId, cardDef, data, dispatch, renderCard, navLen }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", height: "100%" }}>
      <div style={{ borderRight: "2px solid #000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <NavBar dispatch={dispatch} navLen={navLen} currentCard={cardId} />
        <div style={{ flex: 1, overflow: "auto" }}>{renderCard(cardId, cardDef)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", background: T.ai }}>
        <div style={{ padding: "5px 8px", borderBottom: "1px solid #ccc", fontWeight: "bold", fontSize: 11, display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
          <span>🤖 AI Copilot</span><span style={{ fontWeight: "normal", fontSize: 10, color: T.mut }}>{STACK.settings.aiModel}</span>
        </div>
        <ChatCard card={STACK.cards.assistant} data={data} dispatch={dispatch} />
      </div>
    </div>
  );
}

function LayoutDrawer({ cardId, cardDef, data, dispatch, renderCard, navLen }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <NavBar dispatch={dispatch} navLen={navLen} currentCard={cardId} />
      <div style={{ flex: 1, overflow: "auto" }}>{renderCard(cardId, cardDef)}</div>
      <div style={{ borderTop: "2px solid #000", background: T.ai, maxHeight: open ? 200 : 26, display: "flex", flexDirection: "column", transition: "max-height 0.15s" }}>
        <div style={{ padding: "3px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, borderBottom: open ? "1px solid #ccc" : "none", flexShrink: 0 }} onClick={() => setOpen(!open)}>
          <span style={{ fontWeight: "bold", fontSize: 11 }}>🤖 AI {open ? "▾" : "▸"}</span>
          <span style={{ fontSize: 10, color: T.mut, fontStyle: "italic" }}>Ask about inventory…</span>
        </div>
        {open && <div style={{ flex: 1, overflow: "hidden" }}><ChatCard card={STACK.cards.assistant} data={data} dispatch={dispatch} /></div>}
      </div>
    </div>
  );
}

function LayoutCardChat({ cardId, cardDef, data, dispatch, renderCard, navLen }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <NavBar dispatch={dispatch} navLen={navLen} currentCard={cardId} />
      <div style={{ flex: 1, overflow: "auto" }}>{renderCard(cardId, cardDef)}</div>
    </div>
  );
}

// ━━━ Main App ━━━

export default function HyperCardEngine() {
  const [layout, setLayout] = useState("split");
  const [navStack, setNavStack] = useState([{ card: "home" }]);
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(STACK.data)));
  const [toast, setToast] = useState(null);

  const current = navStack[navStack.length - 1];
  const cardId = current.card;
  const cardDef = STACK.cards[cardId];

  const dispatch = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case "navigate": setNavStack(s => [...s, { card: action.card, param: action.paramValue || action.param }]); break;
      case "back": setNavStack(s => s.length > 1 ? s.slice(0, -1) : s); break;
      case "toast": setToast(action.message); break;
      case "updateQty":
        setData(p => ({ ...p, items: p.items.map(i => i.sku === action.sku ? { ...i, qty: Math.max(0, i.qty + action.delta) } : i) }));
        setToast(`${action.delta > 0 ? "+" : ""}${action.delta} qty for ${action.sku}`);
        break;
      case "saveItem":
        if (action.edits && action.sku) {
          setData(p => ({ ...p, items: p.items.map(i => i.sku === action.sku ? { ...i, ...action.edits } : i) }));
          setToast(`Saved ${action.sku}`);
        }
        break;
      case "deleteItem":
        setData(p => ({ ...p, items: p.items.filter(i => i.sku !== action.sku) }));
        setNavStack(s => s.slice(0, -1));
        setToast(`Deleted ${action.sku}`);
        break;
      case "createItem":
        if (action.values?.sku && action.values?.name) {
          setData(p => ({ ...p, items: [...p.items, { ...action.values, tags: [] }] }));
          setToast(`Created ${action.values.sku}`);
        }
        break;
      case "receiveStock": {
        const { sku, qty } = action.values || {};
        if (sku && qty) {
          setData(p => {
            const found = p.items.find(i => i.sku.toLowerCase() === sku.toLowerCase());
            if (!found) { setToast(`SKU ${sku} not found`); return p; }
            return { ...p, items: p.items.map(i => i.sku === found.sku ? { ...i, qty: i.qty + Number(qty) } : i) };
          });
          setToast(`Received +${qty} for ${sku}`);
        }
        break;
      }
      default: break;
    }
  }, []);

  function renderCard(id, def) {
    if (!def) return <div style={{ padding: 16, color: T.mut }}>Card "{id}" not found</div>;
    const p = { card: def, data, dispatch, paramValue: current.param };
    switch (def.type) {
      case "menu":   return <MenuCard {...p} />;
      case "list":   return <ListCard {...p} />;
      case "detail": return <DetailCard {...p} />;
      case "form":   return <FormCard {...p} />;
      case "chat":   return <ChatCard {...p} />;
      case "report": return <ReportCard {...p} />;
      default:       return <div style={{ padding: 16 }}>Unknown type: {def.type}</div>;
    }
  }

  const layouts = [
    { key: "split",    label: "1 · Split Pane" },
    { key: "drawer",   label: "2 · Bottom Drawer" },
    { key: "cardChat", label: "3 · Card as Chat" },
  ];
  const L = layout === "split" ? LayoutSplit : layout === "drawer" ? LayoutDrawer : LayoutCardChat;

  return (
    <div style={{ width: "100%", maxWidth: 860, height: "min(650px, 88vh)", margin: "16px auto", fontFamily: font, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", border: "2px solid #000", padding: "4px 8px", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
        <div style={{ width: 13, height: 13, border: "2px solid #000", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 13 }}>{STACK.icon} {STACK.name} — HyperCard + AI</div>
      </div>
      <div style={{ display: "flex", background: "#ddd", borderLeft: "2px solid #000", borderRight: "2px solid #000" }}>
        {layouts.map(l => (
          <div key={l.key} onClick={() => { setLayout(l.key); setNavStack([{ card: "home" }]); }}
            style={{ padding: "4px 14px", fontSize: 11, fontFamily: font, cursor: "pointer", background: layout === l.key ? "#fff" : "#ccc",
              borderRight: "1px solid #000", borderBottom: layout === l.key ? "2px solid #fff" : "2px solid #000",
              marginBottom: layout === l.key ? -2 : 0, fontWeight: layout === l.key ? "bold" : "normal", userSelect: "none", position: "relative", zIndex: layout === l.key ? 2 : 1 }}>
            {l.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, border: "2px solid #000", borderTop: "none", boxShadow: "2px 2px 0 #000", overflow: "hidden", background: "#fff" }}>
        <L cardId={cardId} cardDef={cardDef} data={data} dispatch={dispatch} renderCard={renderCard} navLen={navStack.length} />
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#aaa", fontFamily: font, marginTop: 4 }}>
        DSL-driven · {Object.keys(STACK.cards).length} cards · {data.items.length} items · {STACK.ai.intents.length} AI intents
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
