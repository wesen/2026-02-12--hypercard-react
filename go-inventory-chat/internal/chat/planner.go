package chat

import (
	"context"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"hypercard/go-inventory-chat/internal/store"
)

type Planner struct {
	store QueryStore
}

func NewPlanner(qs QueryStore) *Planner {
	return &Planner{store: qs}
}

func (p *Planner) Plan(ctx context.Context, prompt string) (PlannedResponse, error) {
	trimmed := strings.TrimSpace(prompt)
	if trimmed == "" {
		return PlannedResponse{
			Text: "Please ask a question about inventory, stock, sales, or a specific SKU.",
			Actions: []Action{
				{Label: "Open Inventory", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
			},
		}, nil
	}

	lower := strings.ToLower(trimmed)
	if strings.Contains(lower, "low stock") || strings.Contains(lower, "reorder") || strings.Contains(lower, "below") {
		return p.planLowStock(ctx, trimmed)
	}
	if strings.Contains(lower, "sales") || strings.Contains(lower, "revenue") {
		return p.planSalesSummary(ctx, trimmed)
	}
	if strings.Contains(lower, "value") || strings.Contains(lower, "worth") || strings.Contains(lower, "margin") {
		return p.planInventoryValue(ctx)
	}
	if sku := extractSKU(trimmed); sku != "" {
		return p.planItemLookup(ctx, sku, trimmed)
	}
	if strings.Contains(lower, "item") || strings.Contains(lower, "search") || strings.Contains(lower, "find") {
		return p.planItemSearch(ctx, trimmed)
	}
	return planHelp(), nil
}

func (p *Planner) planLowStock(ctx context.Context, prompt string) (PlannedResponse, error) {
	threshold := parseThreshold(prompt, 3)
	items, err := p.store.QueryLowStock(ctx, threshold, 12)
	if err != nil {
		return PlannedResponse{}, err
	}

	reportSections := []map[string]any{
		{"label": "Threshold", "value": fmt.Sprintf("<= %d", threshold)},
		{"label": "Items at/below threshold", "value": fmt.Sprintf("%d", len(items))},
	}
	if len(items) > 0 {
		reportSections = append(reportSections,
			map[string]any{"label": "Most urgent", "value": fmt.Sprintf("%s (%d)", items[0].SKU, items[0].Qty)},
		)
	}

	proposalID := fmt.Sprintf("proposal-low-stock-%d", threshold)
	cardID := fmt.Sprintf("saved_low_stock_%d", threshold)
	cardTitle := fmt.Sprintf("Saved Low Stock <= %d", threshold)

	artifacts := []Artifact{
		{
			Kind:       "widget",
			ID:         fmt.Sprintf("widget-low-stock-summary-%d", threshold),
			WidgetType: "report-view",
			Label:      fmt.Sprintf("Low Stock Summary (<= %d)", threshold),
			Props: map[string]any{
				"sections": reportSections,
			},
		},
		{
			Kind:       "widget",
			ID:         fmt.Sprintf("widget-low-stock-table-%d", threshold),
			WidgetType: "data-table",
			Label:      "Items Requiring Attention",
			Props: map[string]any{
				"items":   itemsToWidgetRows(items),
				"columns": defaultItemColumns(),
			},
		},
		{
			Kind:   "card-proposal",
			ID:     proposalID,
			CardID: cardID,
			Title:  cardTitle,
			Icon:   "RPT",
			Code:   buildLowStockCardCode(cardTitle, threshold),
		},
	}

	text := fmt.Sprintf("Found %d items at or below %d units. I added a summary and a table. You can create a reusable saved report card from this result.", len(items), threshold)
	if len(items) == 0 {
		text = fmt.Sprintf("No items are currently at or below %d units. I still prepared a summary and a reusable card proposal so you can monitor this threshold.", threshold)
	}

	actions := []Action{
		{Label: "Open Low Stock", Action: map[string]any{"type": "open-card", "cardId": "lowStock"}},
		{Label: "Open Browse", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
		{Label: "Create Saved Card", Action: map[string]any{"type": "create-card", "proposalId": proposalID}},
	}

	return PlannedResponse{Text: text, Artifacts: artifacts, Actions: actions}, nil
}

func (p *Planner) planSalesSummary(ctx context.Context, prompt string) (PlannedResponse, error) {
	days := parseDays(prompt, 7)
	summary, err := p.store.QuerySalesSummary(ctx, days)
	if err != nil {
		return PlannedResponse{}, err
	}

	sections := []map[string]any{
		{"label": "Window", "value": fmt.Sprintf("Last %d days", days)},
		{"label": "Revenue", "value": toMoney(summary.TotalRevenue)},
		{"label": "Orders", "value": fmt.Sprintf("%d", summary.OrderCount)},
		{"label": "Units sold", "value": fmt.Sprintf("%d", summary.UnitsSold)},
	}
	if summary.TopCategory != "" {
		sections = append(sections, map[string]any{
			"label": "Top category",
			"value": fmt.Sprintf("%s (%d units)", summary.TopCategory, summary.TopCategoryUS),
		})
	}

	categoryRows := make([]map[string]any, 0, len(summary.ByCategory))
	for _, c := range summary.ByCategory {
		categoryRows = append(categoryRows, map[string]any{
			"category": c.Category,
			"revenue":  c.Revenue,
			"units":    c.Units,
		})
	}

	artifacts := []Artifact{
		{
			Kind:       "widget",
			ID:         fmt.Sprintf("widget-sales-summary-%d", days),
			WidgetType: "report-view",
			Label:      fmt.Sprintf("Sales Summary (Last %d days)", days),
			Props: map[string]any{
				"sections": sections,
			},
		},
		{
			Kind:       "widget",
			ID:         fmt.Sprintf("widget-sales-category-%d", days),
			WidgetType: "data-table",
			Label:      "Revenue by Category",
			Props: map[string]any{
				"items": categoryRows,
				"columns": []map[string]any{
					{"key": "category", "label": "Category", "width": "1.4fr"},
					{"key": "units", "label": "Units", "width": 90, "align": "right"},
					{"key": "revenue", "label": "Revenue", "width": 110, "align": "right", "format": "money"},
				},
			},
		},
	}

	text := fmt.Sprintf("Sales in the last %d days: %s across %d orders and %d units.", days, toMoney(summary.TotalRevenue), summary.OrderCount, summary.UnitsSold)

	return PlannedResponse{
		Text:      text,
		Artifacts: artifacts,
		Actions: []Action{
			{Label: "Open Sales Log", Action: map[string]any{"type": "open-card", "cardId": "salesToday"}},
			{Label: "Open Report", Action: map[string]any{"type": "open-card", "cardId": "report"}},
		},
	}, nil
}

func (p *Planner) planInventoryValue(ctx context.Context) (PlannedResponse, error) {
	summary, err := p.store.QueryInventoryValue(ctx)
	if err != nil {
		return PlannedResponse{}, err
	}

	sections := []map[string]any{
		{"label": "SKUs", "value": fmt.Sprintf("%d", summary.SKUCount)},
		{"label": "Units", "value": fmt.Sprintf("%d", summary.UnitCount)},
		{"label": "Retail value", "value": toMoney(summary.RetailValue)},
		{"label": "Cost basis", "value": toMoney(summary.CostBasis)},
		{"label": "Gross margin", "value": toMoney(summary.GrossMargin)},
	}

	return PlannedResponse{
		Text: "Computed current inventory valuation from the SQLite tool data source.",
		Artifacts: []Artifact{
			{
				Kind:       "widget",
				ID:         "widget-inventory-value",
				WidgetType: "report-view",
				Label:      "Inventory Value",
				Props: map[string]any{
					"sections": sections,
				},
			},
		},
		Actions: []Action{
			{Label: "Open Report", Action: map[string]any{"type": "open-card", "cardId": "report"}},
			{Label: "Open Browse", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
		},
	}, nil
}

func (p *Planner) planItemLookup(ctx context.Context, sku string, prompt string) (PlannedResponse, error) {
	item, err := p.store.QueryItemBySKU(ctx, sku)
	if err != nil {
		return PlannedResponse{}, err
	}
	if item == nil {
		return p.planItemSearch(ctx, prompt)
	}

	rows := []map[string]any{itemToRow(*item)}
	text := fmt.Sprintf("Found item %s in inventory.", item.SKU)

	return PlannedResponse{
		Text: text,
		Artifacts: []Artifact{
			{
				Kind:       "widget",
				ID:         "widget-item-" + strings.ToLower(item.SKU),
				WidgetType: "data-table",
				Label:      "Item Lookup",
				Props: map[string]any{
					"items":   rows,
					"columns": defaultItemColumns(),
				},
			},
		},
		Actions: []Action{
			{Label: "Open Browse", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
			{Label: "Open Low Stock", Action: map[string]any{"type": "open-card", "cardId": "lowStock"}},
		},
	}, nil
}

func (p *Planner) planItemSearch(ctx context.Context, query string) (PlannedResponse, error) {
	items, err := p.store.SearchItems(ctx, query, 8)
	if err != nil {
		return PlannedResponse{}, err
	}
	if len(items) == 0 {
		return PlannedResponse{
			Text: "No inventory items matched that search. Try a SKU such as A-1002 or terms like mug, candle, or keychain.",
			Actions: []Action{
				{Label: "Open Browse", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
			},
		}, nil
	}

	return PlannedResponse{
		Text: fmt.Sprintf("Found %d matching items.", len(items)),
		Artifacts: []Artifact{
			{
				Kind:       "widget",
				ID:         fmt.Sprintf("widget-search-%d", time.Now().Unix()),
				WidgetType: "data-table",
				Label:      "Search Results",
				Props: map[string]any{
					"items":   itemsToWidgetRows(items),
					"columns": defaultItemColumns(),
				},
			},
		},
		Actions: []Action{
			{Label: "Open Browse", Action: map[string]any{"type": "open-card", "cardId": "browse"}},
			{Label: "Ask Low Stock", Action: map[string]any{"type": "prefill", "text": "Show low stock below 3"}},
		},
	}, nil
}

func planHelp() PlannedResponse {
	return PlannedResponse{
		Text: "I can query inventory tools backed by SQLite. Try: 'low stock below 5', 'sales last 7 days', 'total inventory value', or 'find A-1002'.",
		Actions: []Action{
			{Label: "Low stock <= 3", Action: map[string]any{"type": "prefill", "text": "Show low stock below 3"}},
			{Label: "Sales last week", Action: map[string]any{"type": "prefill", "text": "Show sales last 7 days"}},
			{Label: "Inventory value", Action: map[string]any{"type": "prefill", "text": "What is total inventory value?"}},
		},
	}
}

func defaultItemColumns() []map[string]any {
	return []map[string]any{
		{"key": "sku", "label": "SKU", "width": 95},
		{"key": "name", "label": "Name", "width": "1.5fr"},
		{"key": "category", "label": "Category", "width": "1fr"},
		{"key": "qty", "label": "Qty", "width": 70, "align": "right"},
		{"key": "price", "label": "Price", "width": 90, "align": "right", "format": "money"},
	}
}

func itemToRow(item store.Item) map[string]any {
	return map[string]any{
		"sku":      item.SKU,
		"name":     item.Name,
		"category": item.Category,
		"qty":      item.Qty,
		"price":    item.Price,
		"cost":     item.Cost,
	}
}

func itemsToWidgetRows(items []store.Item) []map[string]any {
	rows := make([]map[string]any, 0, len(items))
	for _, item := range items {
		rows = append(rows, itemToRow(item))
	}
	return rows
}

func parseThreshold(prompt string, fallback int) int {
	re := regexp.MustCompile(`(?i)(?:below|under|threshold|<=|<)\s*(\d{1,3})`)
	if m := re.FindStringSubmatch(prompt); len(m) == 2 {
		if n, err := strconv.Atoi(m[1]); err == nil && n > 0 {
			return n
		}
	}
	numberRE := regexp.MustCompile(`\b(\d{1,3})\b`)
	if m := numberRE.FindStringSubmatch(prompt); len(m) == 2 {
		if n, err := strconv.Atoi(m[1]); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}

func parseDays(prompt string, fallback int) int {
	lower := strings.ToLower(prompt)
	if strings.Contains(lower, "week") {
		return 7
	}
	re := regexp.MustCompile(`(?i)(?:last|past)\s*(\d{1,3})\s*day`)
	if m := re.FindStringSubmatch(prompt); len(m) == 2 {
		if n, err := strconv.Atoi(m[1]); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}

func extractSKU(prompt string) string {
	re := regexp.MustCompile(`(?i)\b([A-Z]-\d{4})\b`)
	if m := re.FindStringSubmatch(prompt); len(m) == 2 {
		return strings.ToUpper(m[1])
	}
	return ""
}

func toMoney(v float64) string {
	return fmt.Sprintf("$%.2f", v)
}

func buildLowStockCardCode(title string, threshold int) string {
	return fmt.Sprintf(`({ ui }) => ({
  render({ globalState }) {
    var domains = (globalState && globalState.domains) || {};
    var inventory = (domains && domains.inventory) || {};
    var items = Array.isArray(inventory.items) ? inventory.items : [];
    var rows = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var qty = Number(it.qty || 0);
      if (qty <= %d) {
        rows.push([
          String(it.sku || ''),
          String(it.name || ''),
          String(it.category || ''),
          String(qty),
          '$' + Number(it.price || 0).toFixed(2)
        ]);
      }
    }

    return ui.panel([
      ui.text(%q),
      ui.table(rows, { headers: ['SKU', 'Name', 'Category', 'Qty', 'Price'] }),
      ui.row([
        ui.button('Back', { onClick: { handler: 'back' } }),
        ui.button('Open Browse', { onClick: { handler: 'goBrowse' } })
      ])
    ]);
  },
  handlers: {
    back: function(ctx) {
      ctx.dispatchSystemCommand('nav.back');
    },
    goBrowse: function(ctx) {
      ctx.dispatchSystemCommand('nav.go', { cardId: 'browse' });
    }
  }
})`, threshold, title)
}

func sortCategoryRows(rows []map[string]any) {
	sort.Slice(rows, func(i, j int) bool {
		left, _ := rows[i]["revenue"].(float64)
		right, _ := rows[j]["revenue"].(float64)
		return left > right
	})
}
