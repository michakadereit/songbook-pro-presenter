.PHONY: help dev build preview test clean

help:
	@echo "songbook-pro-presenter Makefile"
	@echo "Usage: make <target>"
	@echo "  dev      Start Vite dev server"
	@echo "  build    Production build"
	@echo "  preview  Preview production build"
	@echo "  test     Run unit tests (Vitest)"
	@echo "  clean    Remove dist/"

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

test:
	npm test

clean:
	rm -rf dist/
