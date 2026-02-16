package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"hypercard/go-inventory-chat/internal/app"
	"hypercard/go-inventory-chat/internal/chat"
	"hypercard/go-inventory-chat/internal/store"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(2)
	}

	var err error
	switch os.Args[1] {
	case "serve":
		err = runServe(os.Args[2:])
	case "seed":
		err = runSeed(os.Args[2:])
	case "help", "-h", "--help":
		printUsage()
		return
	default:
		err = fmt.Errorf("unknown subcommand: %s", os.Args[1])
	}

	if err != nil {
		log.Printf("error: %v", err)
		os.Exit(1)
	}
}

func runServe(args []string) error {
	fs := flag.NewFlagSet("serve", flag.ContinueOnError)
	addr := fs.String("addr", ":8081", "HTTP listen address")
	dbPath := fs.String("db", "go-inventory-chat/data/inventory.db", "SQLite database path")
	allowOrigin := fs.String("allow-origin", "http://localhost:5173", "Allowed CORS origin (or * for any)")
	autoSeed := fs.Bool("auto-seed", true, "Seed mock data when database is empty")
	tokenDelayMS := fs.Int("token-delay-ms", 16, "Delay between streamed token frames in milliseconds")
	if err := fs.Parse(args); err != nil {
		return err
	}

	st, err := store.OpenSQLite(*dbPath)
	if err != nil {
		return err
	}
	defer st.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := st.EnsureSchema(ctx); err != nil {
		return err
	}
	if *autoSeed {
		seeded, err := st.SeedIfEmpty(ctx)
		if err != nil {
			return err
		}
		if seeded {
			log.Printf("seeded sqlite with mock inventory data")
		}
	}

	planner := chat.NewPlanner(st)
	srv := app.NewServer(planner, app.ServerOptions{
		AllowOrigin: *allowOrigin,
		TokenDelay:  time.Duration(*tokenDelayMS) * time.Millisecond,
	})

	httpSrv := &http.Server{
		Addr:              *addr,
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	log.Printf("inventory-chat server listening on %s (db=%s)", *addr, *dbPath)
	err = httpSrv.ListenAndServe()
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func runSeed(args []string) error {
	fs := flag.NewFlagSet("seed", flag.ContinueOnError)
	dbPath := fs.String("db", "go-inventory-chat/data/inventory.db", "SQLite database path")
	force := fs.Bool("force", false, "Reset tables before seeding")
	if err := fs.Parse(args); err != nil {
		return err
	}

	st, err := store.OpenSQLite(*dbPath)
	if err != nil {
		return err
	}
	defer st.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if *force {
		if err := st.ResetAndSeed(ctx); err != nil {
			return err
		}
		log.Printf("database reset and seeded: %s", *dbPath)
		return nil
	}

	seeded, err := st.SeedIfEmpty(ctx)
	if err != nil {
		return err
	}
	if seeded {
		log.Printf("database seeded: %s", *dbPath)
	} else {
		log.Printf("database already contains data (use --force to reset): %s", *dbPath)
	}
	return nil
}

func printUsage() {
	fmt.Println("inventory-chat backend")
	fmt.Println("")
	fmt.Println("Usage:")
	fmt.Println("  inventory-chat serve [flags]")
	fmt.Println("  inventory-chat seed [flags]")
	fmt.Println("")
	fmt.Println("Examples:")
	fmt.Println("  go run ./cmd/inventory-chat serve --db go-inventory-chat/data/inventory.db")
	fmt.Println("  go run ./cmd/inventory-chat seed --db go-inventory-chat/data/inventory.db --force")
}
