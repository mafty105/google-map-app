# Makefile for backend development
# Makes it easy to run commands without setting PATH manually

# Set UV path
UV := $(HOME)/.local/bin/uv
PYTHON := .venv/bin/python
PYTEST := .venv/bin/pytest

.PHONY: help install dev test lint format clean run

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies with uv"
	@echo "  make dev        - Install dev dependencies"
	@echo "  make run        - Start development server"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linter (ruff)"
	@echo "  make format     - Format code (black + ruff)"
	@echo "  make clean      - Remove cache files"

install:
	$(UV) pip install -e .

dev:
	$(UV) pip install -e ".[dev]"

run:
	$(PYTHON) run.py

test:
	$(PYTEST)

test-verbose:
	$(PYTEST) -v

test-coverage:
	$(PYTEST) --cov=app --cov-report=html

lint:
	.venv/bin/ruff check app

format:
	.venv/bin/black app
	.venv/bin/ruff check --fix app

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	rm -rf htmlcov .coverage
