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
