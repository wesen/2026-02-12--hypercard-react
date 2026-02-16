package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const dateLayout = "2006-01-02"

var schemaStatements = []string{
	`CREATE TABLE IF NOT EXISTS items (
		sku TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		qty INTEGER NOT NULL,
		price REAL NOT NULL,
		cost REAL NOT NULL,
		tags_json TEXT NOT NULL DEFAULT '[]'
	);`,
	`CREATE TABLE IF NOT EXISTS sales_log (
		id TEXT PRIMARY KEY,
		sale_date TEXT NOT NULL,
		sku TEXT NOT NULL,
		qty INTEGER NOT NULL,
		total REAL NOT NULL,
		FOREIGN KEY (sku) REFERENCES items(sku)
	);`,
	`CREATE INDEX IF NOT EXISTS idx_items_qty ON items(qty);`,
	`CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);`,
	`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_log(sale_date);`,
	`CREATE INDEX IF NOT EXISTS idx_sales_sku ON sales_log(sku);`,
	`CREATE TABLE IF NOT EXISTS timeline_conversations (
		conversation_id TEXT PRIMARY KEY,
		last_seq INTEGER NOT NULL DEFAULT 0,
		updated_at TEXT NOT NULL
	);`,
	`CREATE TABLE IF NOT EXISTS timeline_messages (
		conversation_id TEXT NOT NULL,
		message_id TEXT NOT NULL,
		role TEXT NOT NULL,
		text TEXT NOT NULL DEFAULT '',
		status TEXT NOT NULL DEFAULT 'streaming',
		artifacts_json TEXT NOT NULL DEFAULT '[]',
		actions_json TEXT NOT NULL DEFAULT '[]',
		updated_at TEXT NOT NULL,
		PRIMARY KEY (conversation_id, message_id),
		FOREIGN KEY (conversation_id) REFERENCES timeline_conversations(conversation_id)
	);`,
	`CREATE TABLE IF NOT EXISTS timeline_events (
		conversation_id TEXT NOT NULL,
		seq INTEGER NOT NULL,
		event_id TEXT NOT NULL,
		event_type TEXT NOT NULL,
		stream_id TEXT NOT NULL DEFAULT '',
		data_json TEXT NOT NULL DEFAULT '{}',
		metadata_json TEXT NOT NULL DEFAULT '{}',
		created_at TEXT NOT NULL,
		PRIMARY KEY (conversation_id, seq),
		FOREIGN KEY (conversation_id) REFERENCES timeline_conversations(conversation_id)
	);`,
	`CREATE INDEX IF NOT EXISTS idx_timeline_messages_conversation_updated ON timeline_messages(conversation_id, updated_at);`,
	`CREATE INDEX IF NOT EXISTS idx_timeline_events_conversation_seq ON timeline_events(conversation_id, seq);`,
}

type SQLiteStore struct {
	db *sql.DB
}

func OpenSQLite(path string) (*SQLiteStore, error) {
	if strings.TrimSpace(path) == "" {
		return nil, errors.New("sqlite path is required")
	}

	if dir := filepath.Dir(path); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create sqlite directory: %w", err)
		}
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetConnMaxIdleTime(2 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	return &SQLiteStore{db: db}, nil
}

func (s *SQLiteStore) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

func (s *SQLiteStore) EnsureSchema(ctx context.Context) error {
	if s == nil || s.db == nil {
		return errors.New("store is nil")
	}
	for _, stmt := range schemaStatements {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("ensure schema: %w", err)
		}
	}
	return nil
}

func (s *SQLiteStore) ResetAndSeed(ctx context.Context) error {
	if err := s.EnsureSchema(ctx); err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin reset transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.ExecContext(ctx, `DELETE FROM sales_log`); err != nil {
		return fmt.Errorf("clear sales_log: %w", err)
	}
	if _, err = tx.ExecContext(ctx, `DELETE FROM items`); err != nil {
		return fmt.Errorf("clear items: %w", err)
	}

	if err = insertSeedData(ctx, tx); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit reset transaction: %w", err)
	}
	return nil
}

func (s *SQLiteStore) SeedIfEmpty(ctx context.Context) (bool, error) {
	if err := s.EnsureSchema(ctx); err != nil {
		return false, err
	}

	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM items`).Scan(&count); err != nil {
		return false, fmt.Errorf("count items: %w", err)
	}
	if count > 0 {
		return false, nil
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, fmt.Errorf("begin seed transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err = insertSeedData(ctx, tx); err != nil {
		return false, err
	}
	if err = tx.Commit(); err != nil {
		return false, fmt.Errorf("commit seed transaction: %w", err)
	}
	return true, nil
}

func (s *SQLiteStore) QueryLowStock(ctx context.Context, threshold int, limit int) ([]Item, error) {
	if threshold < 0 {
		threshold = 0
	}
	if limit <= 0 {
		limit = 20
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT sku, name, category, qty, price, cost
		FROM items
		WHERE qty <= ?
		ORDER BY qty ASC, sku ASC
		LIMIT ?
	`, threshold, limit)
	if err != nil {
		return nil, fmt.Errorf("query low stock: %w", err)
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.SKU, &it.Name, &it.Category, &it.Qty, &it.Price, &it.Cost); err != nil {
			return nil, fmt.Errorf("scan low stock row: %w", err)
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate low stock rows: %w", err)
	}
	return items, nil
}

func (s *SQLiteStore) QueryInventoryValue(ctx context.Context) (InventoryValueSummary, error) {
	var out InventoryValueSummary
	if err := s.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) AS sku_count,
			COALESCE(SUM(qty), 0) AS unit_count,
			COALESCE(SUM(price * qty), 0) AS retail_value,
			COALESCE(SUM(cost * qty), 0) AS cost_basis
		FROM items
	`).Scan(&out.SKUCount, &out.UnitCount, &out.RetailValue, &out.CostBasis); err != nil {
		return out, fmt.Errorf("query inventory value: %w", err)
	}
	out.GrossMargin = out.RetailValue - out.CostBasis
	return out, nil
}

func (s *SQLiteStore) QuerySalesSummary(ctx context.Context, days int) (SalesSummary, error) {
	if days <= 0 {
		days = 7
	}

	from := time.Now().UTC().AddDate(0, 0, -days)
	to := time.Now().UTC()

	rows, err := s.db.QueryContext(ctx, `
		SELECT s.id, s.sale_date, s.sku, s.qty, s.total, i.category
		FROM sales_log s
		JOIN items i ON i.sku = s.sku
		WHERE date(s.sale_date) >= date(?)
		ORDER BY s.sale_date DESC, s.id DESC
	`, from.Format(dateLayout))
	if err != nil {
		return SalesSummary{}, fmt.Errorf("query sales summary: %w", err)
	}
	defer rows.Close()

	out := SalesSummary{
		FromDate: from,
		ToDate:   to,
	}
	perCategory := map[string]*CategorySummary{}

	for rows.Next() {
		var (
			saleDateRaw string
			sale        SaleEntry
		)
		if err := rows.Scan(&sale.ID, &saleDateRaw, &sale.SKU, &sale.Qty, &sale.Total, &sale.Category); err != nil {
			return SalesSummary{}, fmt.Errorf("scan sales row: %w", err)
		}
		parsed, err := time.Parse(dateLayout, saleDateRaw)
		if err != nil {
			return SalesSummary{}, fmt.Errorf("parse sales date %q: %w", saleDateRaw, err)
		}
		sale.Date = parsed

		out.OrderCount++
		out.UnitsSold += sale.Qty
		out.TotalRevenue += sale.Total

		cat := sale.Category
		if cat == "" {
			cat = "Uncategorized"
		}
		summary, ok := perCategory[cat]
		if !ok {
			summary = &CategorySummary{Category: cat}
			perCategory[cat] = summary
		}
		summary.Revenue += sale.Total
		summary.Units += sale.Qty
	}
	if err := rows.Err(); err != nil {
		return SalesSummary{}, fmt.Errorf("iterate sales rows: %w", err)
	}

	for _, entry := range perCategory {
		out.ByCategory = append(out.ByCategory, *entry)
	}
	sort.Slice(out.ByCategory, func(i, j int) bool {
		if out.ByCategory[i].Revenue == out.ByCategory[j].Revenue {
			return out.ByCategory[i].Category < out.ByCategory[j].Category
		}
		return out.ByCategory[i].Revenue > out.ByCategory[j].Revenue
	})
	if len(out.ByCategory) > 0 {
		out.TopCategory = out.ByCategory[0].Category
		out.TopCategoryUS = out.ByCategory[0].Units
	}

	return out, nil
}

func (s *SQLiteStore) QueryItemBySKU(ctx context.Context, sku string) (*Item, error) {
	sku = strings.TrimSpace(strings.ToUpper(sku))
	if sku == "" {
		return nil, nil
	}

	var it Item
	err := s.db.QueryRowContext(ctx, `
		SELECT sku, name, category, qty, price, cost
		FROM items
		WHERE upper(sku) = ?
	`, sku).Scan(&it.SKU, &it.Name, &it.Category, &it.Qty, &it.Price, &it.Cost)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query item by sku: %w", err)
	}
	return &it, nil
}

func (s *SQLiteStore) SearchItems(ctx context.Context, query string, limit int) ([]Item, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 8
	}

	pattern := "%" + strings.ToLower(query) + "%"
	rows, err := s.db.QueryContext(ctx, `
		SELECT sku, name, category, qty, price, cost
		FROM items
		WHERE lower(sku) LIKE ? OR lower(name) LIKE ? OR lower(category) LIKE ?
		ORDER BY qty ASC, sku ASC
		LIMIT ?
	`, pattern, pattern, pattern, limit)
	if err != nil {
		return nil, fmt.Errorf("search items: %w", err)
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.SKU, &it.Name, &it.Category, &it.Qty, &it.Price, &it.Cost); err != nil {
			return nil, fmt.Errorf("scan search row: %w", err)
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate search rows: %w", err)
	}
	return items, nil
}
