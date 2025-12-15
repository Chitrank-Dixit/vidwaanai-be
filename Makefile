.PHONY: setup up down build logs shell test clean help

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

## Help: Show this help message
help:
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${YELLOW}%-20s${RESET} ${GREEN}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Setup: Install local dependencies
setup:
	bun install

## Up: Start the application in Docker
up:
	docker-compose up -d

## Down: Stop the application
down:
	docker-compose down

## Build: Rebuild Docker images
build:
	docker-compose build

## Logs: Follow Docker logs
logs:
	docker-compose logs -f

## Shell: Access the backend container shell
shell:
	docker-compose exec backend /bin/sh

## Test: Run tests locally
test:
	bun test

## Docker Test: Run tests inside Docker container
test-docker:
	docker-compose run --rm backend bun test tests/integration/oauth.test.ts

## Clean: Stop containers and remove volumes
clean:
	docker-compose down -v
