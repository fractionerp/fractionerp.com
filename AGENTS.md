# AI Agent Instructions

## Working in TenX Environment

You are currently working in a **TenX-managed terminal session** for this project.

### Terminal Session
- **Tmux session name**: Matches this project's folder name
- **Working directory**: This project's root directory
- **Copilot**: Auto-started with `--allow-all-tools --allow-all-urls`

### Git Workflow

**MANDATORY: Check for uncommitted changes at the START of each new task:**
```bash
git status --short
```

If uncommitted changes exist from a previous task:
1. **Same topic**: Continue working, commit when fully complete
2. **New topic**: Ask user whether to commit, stash, or discard previous changes

**Commit only when complete:**
- Fix is **verified working** (tested)
- Feature is **complete** (not partial)
- Tests pass (if applicable)

**Commit command:**
```bash
git add -A && git commit -m "prefix: description" && git push
```

**Commit prefixes:**
- `fix:` - Bug fixes
- `feat:` - New features
- `refactor:` - Code improvements
- `style:` - UI/CSS changes
- `docs:` - Documentation
- `test:` - Test changes

**Commit message format:**
- Use imperative mood ("add feature" not "added feature")
- Keep first line under 72 characters
- Include summary of what changed and why

---

# FractionERP Marketing Site - Jekyll

## Overview
Marketing website for FractionERP manufacturing ERP software.

## Access
- **Production**: https://fractionerp.com
- **Local Dev**: http://localhost:8080/fractionerp

## Build Commands
```bash
# Build for local development
docker compose exec jekyll jekyll build --config _config.yml,_config_dev.yml

# Watch mode (auto-rebuild)
docker compose exec jekyll jekyll build --config _config.yml,_config_dev.yml --watch
```

## Structure
```
_data/                     # YAML data files
  features.yml             # Product features
  pricing.yml              # Pricing tiers
  testimonials.yml         # Customer testimonials
  faq.yml                  # FAQ content
  navigation.yml           # Site navigation
_includes/                 # Reusable HTML partials
  header.html, footer.html, cta.html
*.html                     # Page content (index, pricing, features, etc.)
```

## Key Files
- `_config.yml` - Main config (baseurl: "" for GitHub Pages)
- `_config_dev.yml` - Dev override (baseurl: "/fractionerp")
- `_data/*.yml` - Content data files

## Forms
- Demo requests: Formspree (`formspree_demo`)
- Contact form: Formspree (`formspree_contact`)
