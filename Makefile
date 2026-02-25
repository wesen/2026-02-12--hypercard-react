.PHONY: launcher-frontend launcher-ui-sync launcher-build launcher-smoke

launcher-frontend:
	npm run launcher:frontend:build

launcher-ui-sync:
	npm run launcher:ui:sync

launcher-build: launcher-frontend launcher-ui-sync
	bash ./scripts/build-go-go-os-launcher.sh

launcher-smoke:
	bash ./scripts/smoke-go-go-os-launcher.sh
