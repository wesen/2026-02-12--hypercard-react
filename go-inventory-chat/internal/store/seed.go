package store

import (
	"context"
	"database/sql"
	"fmt"
)

type seedItem struct {
	SKU      string
	Name     string
	Category string
	Qty      int
	Price    float64
	Cost     float64
	TagsJSON string
}

type seedSale struct {
	ID    string
	Date  string
	SKU   string
	Qty   int
	Total float64
}

var defaultSeedItems = []seedItem{
	{SKU: "A-1002", Qty: 2, Price: 9.99, Cost: 3.25, Name: "Keychain - Brass", Category: "Accessories", TagsJSON: `["gift","sale"]`},
	{SKU: "A-1021", Qty: 0, Price: 8.99, Cost: 2.80, Name: "Keychain - Silver", Category: "Accessories", TagsJSON: `["gift"]`},
	{SKU: "A-1033", Qty: 5, Price: 7.99, Cost: 2.10, Name: "Keychain - Steel", Category: "Accessories", TagsJSON: `["new"]`},
	{SKU: "A-1055", Qty: 1, Price: 12.99, Cost: 4.50, Name: "Ring - Copper Band", Category: "Accessories", TagsJSON: `["artisan"]`},
	{SKU: "B-2001", Qty: 14, Price: 24.99, Cost: 8.00, Name: "Mug - Ceramic Blue", Category: "Kitchen", TagsJSON: `["popular"]`},
	{SKU: "B-2015", Qty: 3, Price: 19.99, Cost: 7.50, Name: "Mug - Hand-thrown", Category: "Kitchen", TagsJSON: `["artisan"]`},
	{SKU: "C-3010", Qty: 0, Price: 34.99, Cost: 12.00, Name: "Candle - Beeswax Lg", Category: "Home", TagsJSON: `["seasonal"]`},
	{SKU: "C-3011", Qty: 8, Price: 14.99, Cost: 5.00, Name: "Candle - Soy Sm", Category: "Home", TagsJSON: `["popular","gift"]`},
	{SKU: "D-4001", Qty: 20, Price: 4.99, Cost: 1.20, Name: "Sticker Pack - Logo", Category: "Merch", TagsJSON: `["cheap","popular"]`},
	{SKU: "D-4002", Qty: 6, Price: 18.99, Cost: 6.00, Name: "Tote Bag - Canvas", Category: "Merch", TagsJSON: `["new","eco"]`},
}

var defaultSeedSales = []seedSale{
	{ID: "s1", Date: "2026-02-10", SKU: "A-1002", Qty: 2, Total: 19.98},
	{ID: "s2", Date: "2026-02-10", SKU: "B-2001", Qty: 1, Total: 24.99},
	{ID: "s3", Date: "2026-02-09", SKU: "A-1002", Qty: 3, Total: 29.97},
	{ID: "s4", Date: "2026-02-09", SKU: "D-4001", Qty: 5, Total: 24.95},
	{ID: "s5", Date: "2026-02-08", SKU: "A-1002", Qty: 4, Total: 39.96},
	{ID: "s6", Date: "2026-02-08", SKU: "C-3011", Qty: 2, Total: 29.98},
	{ID: "s7", Date: "2026-02-07", SKU: "B-2015", Qty: 1, Total: 19.99},
}

func insertSeedData(ctx context.Context, tx *sql.Tx) error {
	itemStmt, err := tx.PrepareContext(ctx, `
		INSERT OR REPLACE INTO items (sku, name, category, qty, price, cost, tags_json)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("prepare item insert: %w", err)
	}
	defer itemStmt.Close()

	for _, item := range defaultSeedItems {
		if _, err := itemStmt.ExecContext(ctx, item.SKU, item.Name, item.Category, item.Qty, item.Price, item.Cost, item.TagsJSON); err != nil {
			return fmt.Errorf("insert seed item %s: %w", item.SKU, err)
		}
	}

	saleStmt, err := tx.PrepareContext(ctx, `
		INSERT OR REPLACE INTO sales_log (id, sale_date, sku, qty, total)
		VALUES (?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("prepare sales insert: %w", err)
	}
	defer saleStmt.Close()

	for _, sale := range defaultSeedSales {
		if _, err := saleStmt.ExecContext(ctx, sale.ID, sale.Date, sale.SKU, sale.Qty, sale.Total); err != nil {
			return fmt.Errorf("insert seed sale %s: %w", sale.ID, err)
		}
	}

	return nil
}
