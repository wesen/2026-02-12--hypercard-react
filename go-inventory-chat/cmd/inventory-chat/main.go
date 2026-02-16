package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"hypercard/go-inventory-chat/internal/app"
	"hypercard/go-inventory-chat/internal/chat"
	"hypercard/go-inventory-chat/internal/store"
	chatstore "github.com/go-go-golems/pinocchio/pkg/persistence/chatstore"
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
	dbPath := fs.String("db", "data/inventory.db", "SQLite database path")
	allowOrigin := fs.String("allow-origin", "http://localhost:5173", "Allowed CORS origin (or * for any)")
	autoSeed := fs.Bool("auto-seed", true, "Seed mock data when database is empty")
	defaultConvID := fs.String("default-conversation-id", "", "Default conversation ID when omitted by clients (empty = random UUID)")
	timelineDB := fs.String("timeline-db", "data/webchat-timeline.db", "SQLite file for Pinocchio timeline store")
	turnsDB := fs.String("turns-db", "data/webchat-turns.db", "SQLite file for Pinocchio turn store")
	llmEnabled := fs.Bool("llm-enabled", true, "Enable Geppetto LLM runtime when provider API key is configured")
	llmProvider := fs.String("llm-provider", "openai", "LLM provider (openai, openai-responses, claude, gemini, ...)")
	llmModel := fs.String("llm-model", "gpt-4.1-mini", "LLM model name")
	llmAPIKey := fs.String("llm-api-key", "", "LLM API key (defaults from provider-specific env vars)")
	llmBaseURL := fs.String("llm-base-url", "", "Optional LLM provider base URL override")
	systemPrompt := fs.String("system-prompt", "", "Optional runtime system prompt")
	debugRoutes := fs.Bool("debug-routes", true, "Enable Pinocchio /api/debug routes")
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

	apiKey := resolveAPIKey(*llmProvider, *llmAPIKey)
	runtimeCfg := app.RuntimeConfig{
		Enabled:      *llmEnabled,
		Provider:     *llmProvider,
		Model:        *llmModel,
		APIKey:       apiKey,
		BaseURL:      *llmBaseURL,
		SystemPrompt: *systemPrompt,
	}

	var timelineStore chatstore.TimelineStore
	if dsn, err := chatstore.SQLiteTimelineDSNForFile(*timelineDB); err == nil {
		timelineStore, err = chatstore.NewSQLiteTimelineStore(dsn)
		if err != nil {
			return fmt.Errorf("open timeline store: %w", err)
		}
	} else {
		return fmt.Errorf("build timeline store dsn: %w", err)
	}
	defer func() {
		if timelineStore != nil {
			_ = timelineStore.Close()
		}
	}()

	var turnStore chatstore.TurnStore
	if dsn, err := chatstore.SQLiteTurnDSNForFile(*turnsDB); err == nil {
		turnStore, err = chatstore.NewSQLiteTurnStore(dsn)
		if err != nil {
			return fmt.Errorf("open turn store: %w", err)
		}
	} else {
		return fmt.Errorf("build turn store dsn: %w", err)
	}
	defer func() {
		if turnStore != nil {
			_ = turnStore.Close()
		}
	}()

	planner := chat.NewPlanner(st)
	srv, err := app.NewServer(context.Background(), planner, app.ServerConfig{
		Addr:          *addr,
		AllowOrigin:   *allowOrigin,
		Runtime:       runtimeCfg,
		TimelineStore: timelineStore,
		TurnStore:     turnStore,
		DebugRoutes:   *debugRoutes,
		DefaultConvID: *defaultConvID,
	})
	if err != nil {
		return err
	}

	log.Printf(
		"inventory-chat webchat listening on %s (db=%s, timeline=%s, turns=%s, llm_enabled=%t, provider=%s, model=%s)",
		*addr,
		*dbPath,
		*timelineDB,
		*turnsDB,
		runtimeCfg.Enabled && strings.TrimSpace(runtimeCfg.APIKey) != "",
		runtimeCfg.Provider,
		runtimeCfg.Model,
	)
	return srv.Run(context.Background())
}

func runSeed(args []string) error {
	fs := flag.NewFlagSet("seed", flag.ContinueOnError)
	dbPath := fs.String("db", "data/inventory.db", "SQLite database path")
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
	fmt.Println("  go run ./cmd/inventory-chat serve --db data/inventory.db")
	fmt.Println("  go run ./cmd/inventory-chat seed --db data/inventory.db --force")
}

func resolveAPIKey(provider string, explicit string) string {
	if trimmed := strings.TrimSpace(explicit); trimmed != "" {
		return trimmed
	}
	normalized := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(provider), "-", "_"))
	switch normalized {
	case "OPENAI", "OPENAI_RESPONSES":
		if v := strings.TrimSpace(os.Getenv("OPENAI_API_KEY")); v != "" {
			return v
		}
	case "CLAUDE", "ANTHROPIC":
		if v := strings.TrimSpace(os.Getenv("CLAUDE_API_KEY")); v != "" {
			return v
		}
	case "GEMINI":
		if v := strings.TrimSpace(os.Getenv("GEMINI_API_KEY")); v != "" {
			return v
		}
	}
	if v := strings.TrimSpace(os.Getenv(normalized + "_API_KEY")); v != "" {
		return v
	}
	return ""
}
