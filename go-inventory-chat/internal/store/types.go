package store

import "time"

type Item struct {
	SKU      string
	Name     string
	Category string
	Qty      int
	Price    float64
	Cost     float64
}

type SaleEntry struct {
	ID       string
	Date     time.Time
	SKU      string
	Qty      int
	Total    float64
	Category string
}

type CategorySummary struct {
	Category string
	Revenue  float64
	Units    int
}

type SalesSummary struct {
	FromDate      time.Time
	ToDate        time.Time
	OrderCount    int
	UnitsSold     int
	TotalRevenue  float64
	ByCategory    []CategorySummary
	TopCategory   string
	TopCategoryUS int
}

type InventoryValueSummary struct {
	SKUCount    int
	UnitCount   int
	RetailValue float64
	CostBasis   float64
	GrossMargin float64
}
