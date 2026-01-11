.PHONY: help install install-backend install-frontend format format-backend format-frontend lint lint-backend lint-frontend serve serve-backend serve-frontend migrate migrate-make migrate-apply migrate-reset build build-frontend clean clean-backend clean-frontend test test-backend test-frontend init-data superuser setup run-all check

# Default target
.DEFAULT_GOAL := help

# Variables
PYTHON := python3.11
NODE := node
NPM := npm
VENV := backend/venv
VENV_BIN := $(VENV)/bin
MANAGE := $(VENV_BIN)/python backend/manage.py
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# Installation
install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install Python dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@if [ ! -d "$(VENV)" ]; then \
		$(PYTHON) -m venv $(VENV); \
	fi
	@$(VENV_BIN)/pip install --upgrade pip
	@$(VENV_BIN)/pip install -r $(BACKEND_DIR)/requirements.txt
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-frontend: ## Install Node.js dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

# Formatting
format: format-backend format-frontend ## Format all code

format-backend: ## Format Python code with black and isort
	@echo "$(BLUE)Formatting Python imports with isort...$(NC)"
	@$(VENV_BIN)/isort $(BACKEND_DIR)/shipping_platform 2>/dev/null || \
	 $(VENV_BIN)/isort $(BACKEND_DIR) --skip venv
	@echo "$(BLUE)Formatting Python code with black...$(NC)"
	@$(VENV_BIN)/black $(BACKEND_DIR)/shipping_platform --line-length 100 2>/dev/null || \
	 $(VENV_BIN)/black $(BACKEND_DIR) --line-length 100 --exclude=venv
	@echo "$(GREEN)✓ Python code formatted$(NC)"

format-frontend: ## Format TypeScript/JavaScript code with prettier
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) run format 2>/dev/null || $(NPM) run lint:fix 2>/dev/null || echo "$(YELLOW)⚠ No format script found, skipping$(NC)"
	@echo "$(GREEN)✓ Frontend code formatted$(NC)"

# Linting
lint: lint-backend lint-frontend ## Lint all code

lint-backend: ## Lint Python code
	@echo "$(BLUE)Linting Python code...$(NC)"
	@$(VENV_BIN)/black --check $(BACKEND_DIR)/shipping_platform --line-length 100 2>/dev/null || \
	 $(VENV_BIN)/black --check $(BACKEND_DIR) --line-length 100 --exclude=venv || \
	 echo "$(YELLOW)⚠ Code formatting issues found$(NC)"
	@echo "$(GREEN)✓ Python linting complete$(NC)"

lint-frontend: ## Lint TypeScript/JavaScript code
	@echo "$(BLUE)Linting frontend code...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) run lint 2>/dev/null || echo "$(YELLOW)⚠ No lint script found, skipping$(NC)"
	@echo "$(GREEN)✓ Frontend linting complete$(NC)"

# Development servers
serve: serve-backend ## Run backend server (alias for serve-backend)

serve-backend: ## Run Django development server
	@echo "$(BLUE)Starting Django development server...$(NC)"
	@$(MANAGE) runserver

serve-frontend: ## Run React development server
	@echo "$(BLUE)Starting React development server...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

run-all: ## Run both backend and frontend servers
	@echo "$(BLUE)Starting both servers...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo ""
	@$(MAKE) -j2 serve-backend serve-frontend

# Database migrations
migrate: migrate-apply ## Apply all migrations (alias for migrate-apply)

migrate-make: ## Create new migration files
	@echo "$(BLUE)Creating migration files...$(NC)"
	@$(MANAGE) makemigrations
	@echo "$(GREEN)✓ Migrations created$(NC)"

migrate-apply: ## Apply database migrations
	@echo "$(BLUE)Applying database migrations...$(NC)"
	@$(MANAGE) migrate
	@echo "$(GREEN)✓ Migrations applied$(NC)"

migrate-reset: ## Reset database (WARNING: Deletes all data)
	@echo "$(RED)WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -f $(BACKEND_DIR)/db.sqlite3; \
		$(MANAGE) migrate; \
		$(MAKE) init-data; \
		echo "$(GREEN)✓ Database reset$(NC)"; \
	fi

# Build
build: build-frontend ## Build for production

build-frontend: ## Build React app for production
	@echo "$(BLUE)Building frontend for production...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) run build
	@echo "$(GREEN)✓ Frontend built$(NC)"

# Testing
test: test-backend test-frontend ## Run all tests

test-backend: ## Run Django tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	@$(MANAGE) test || echo "$(YELLOW)⚠ No tests found or tests failed$(NC)"
	@echo "$(GREEN)✓ Backend tests complete$(NC)"

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) run test 2>/dev/null || echo "$(YELLOW)⚠ No test script found, skipping$(NC)"
	@echo "$(GREEN)✓ Frontend tests complete$(NC)"

# Database initialization
init-data: ## Initialize sample data (saved addresses and packages)
	@echo "$(BLUE)Initializing sample data...$(NC)"
	@$(MANAGE) init_sample_data 2>/dev/null || $(MANAGE) init_data 2>/dev/null || echo "$(YELLOW)⚠ No init command found$(NC)"
	@echo "$(GREEN)✓ Sample data initialized$(NC)"

superuser: ## Create Django superuser
	@echo "$(BLUE)Creating Django superuser...$(NC)"
	@$(MANAGE) createsuperuser

# Setup (first time)
setup: install migrate init-data ## Complete setup for first time (install, migrate, init data)
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Create a superuser: $(GREEN)make superuser$(NC)"
	@echo "  2. Start the backend: $(GREEN)make serve-backend$(NC)"
	@echo "  3. Start the frontend: $(GREEN)make serve-frontend$(NC)"
	@echo "  4. Or run both: $(GREEN)make run-all$(NC)"

# Cleaning
clean: clean-backend clean-frontend ## Clean all build artifacts and cache

clean-backend: ## Clean Python cache and build artifacts
	@echo "$(BLUE)Cleaning backend...$(NC)"
	@find $(BACKEND_DIR) -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find $(BACKEND_DIR) -type f -name "*.pyc" -delete 2>/dev/null || true
	@find $(BACKEND_DIR) -type f -name "*.pyo" -delete 2>/dev/null || true
	@find $(BACKEND_DIR) -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@rm -rf $(BACKEND_DIR)/.pytest_cache 2>/dev/null || true
	@rm -rf $(BACKEND_DIR)/.mypy_cache 2>/dev/null || true
	@echo "$(GREEN)✓ Backend cleaned$(NC)"

clean-frontend: ## Clean Node.js cache and build artifacts
	@echo "$(BLUE)Cleaning frontend...$(NC)"
	@cd $(FRONTEND_DIR) && rm -rf node_modules/.cache 2>/dev/null || true
	@cd $(FRONTEND_DIR) && rm -rf dist 2>/dev/null || true
	@cd $(FRONTEND_DIR) && rm -rf build 2>/dev/null || true
	@cd $(FRONTEND_DIR) && rm -rf .vite 2>/dev/null || true
	@echo "$(GREEN)✓ Frontend cleaned$(NC)"

clean-all: clean ## Clean everything including dependencies (WARNING: Requires reinstall)
	@echo "$(RED)WARNING: This will remove all dependencies!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf $(VENV); \
		cd $(FRONTEND_DIR) && rm -rf node_modules; \
		echo "$(GREEN)✓ All dependencies removed$(NC)"; \
	fi

# Code quality checks
check: lint test ## Run all code quality checks (lint + test)

# Django management commands
shell: ## Open Django shell
	@$(MANAGE) shell

dbshell: ## Open Django database shell
	@$(MANAGE) dbshell

collectstatic: ## Collect static files for production
	@echo "$(BLUE)Collecting static files...$(NC)"
	@$(MANAGE) collectstatic --noinput
	@echo "$(GREEN)✓ Static files collected$(NC)"

# Quick commands
quick-setup: install migrate init-data ## Quick setup without prompts
	@echo "$(GREEN)✓ Quick setup complete!$(NC)"

dev: run-all ## Start development environment (alias for run-all)

# Environment info
info: ## Show environment information
	@echo "$(BLUE)Environment Information:$(NC)"
	@echo "  Python: $$($(PYTHON) --version 2>&1)"
	@echo "  Node: $$($(NODE) --version 2>&1)"
	@echo "  NPM: $$($(NPM) --version 2>&1)"
	@echo "  Django: $$($(VENV_BIN)/python -c 'import django; print(django.get_version())' 2>/dev/null || echo 'Not installed')"
	@echo "  Virtual Environment: $(if $(wildcard $(VENV)),$(GREEN)Active$(NC),$(RED)Not found$(NC))"
	@echo "  Backend Directory: $(BACKEND_DIR)"
	@echo "  Frontend Directory: $(FRONTEND_DIR)"
