# AI Agent Instructions

## Git Workflow

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
Marketing website for FractionERP manufacturing ERP software. Built with Jekyll, deployed to GitHub Pages.

## Access
- **Production**: https://fractionerp.com
- **Local Dev**: https://tenx.fraction.app/fractionerp.com/
- **Build Output**: `/home/dev/tenx/apps/websites/fractionerp.com/_site/`

## Important: Two Configuration Files

This site has **two** Jekyll config files:

### `_config.yml` (Production)
- Used by GitHub Pages
- `url: "https://fractionerp.com"`
- `baseurl: ""`
- **DO NOT modify this for local development**

### `_config_dev.yml` (Development)
- Used by local TenX environment
- `url: "https://tenx.fraction.app"`
- `baseurl: "/fractionerp.com"`
- Modify this when changing paths for local dev

## Building the Site

**IMPORTANT: After making ANY changes to site files, you MUST rebuild:**

### Manual Build (Recommended)
```bash
# Build with dev config for local testing
docker exec websites_jekyll bash -c "cd /srv/fractionerp.com && jekyll build --config _config.yml,_config_dev.yml"

# Check for build errors
docker logs websites_jekyll --tail 20
```

### Automatic Build (via container restart)
```bash
# This rebuilds all websites (slower)
cd /home/dev/tenx/apps/websites
docker compose restart jekyll
```

### Verify Build
After building, check that:
1. Build completed without errors
2. Files exist in `_sites/fractionerp.com/`
3. Site loads at https://tenx.fraction.app/fractionerp.com/

```bash
# Check build output
ls -la /home/dev/tenx/apps/websites/fractionerp.com/_site/

# Test site access
curl -I https://tenx.fraction.app/fractionerp.com/
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
_layouts/                  # Page layouts
assets/
├── css/                   # Stylesheets
├── js/                    # JavaScript files
└── img/                   # Images
*.html                     # Page content (index, pricing, features, etc.)
_config.yml                # Production config (GitHub Pages)
_config_dev.yml            # Development config (TenX)
```

## Common Tasks

### Adding/Updating Content
1. Edit HTML files or `_data/*.yml` files
2. **Rebuild site** (see "Building the Site" above)
3. Test at https://tenx.fraction.app/fractionerp.com/

### Updating CSS/JS
1. Edit files in `assets/css/` or `assets/js/`
2. **Rebuild site**
3. Hard refresh browser (Ctrl+Shift+R) to clear cache

### Adding Images
1. Add image to `assets/img/`
2. Reference with `{{ site.baseurl }}/assets/img/filename.jpg`
3. **Rebuild site**

## Troubleshooting

### Static files (CSS/JS/images) not loading
- Ensure paths use `{{ site.baseurl }}/assets/...`
- **Rebuild site** after fixing paths
- Hard refresh browser

### Build errors
```bash
# Check Jekyll logs
docker logs websites_jekyll --tail 50
```

### Changes not appearing
1. Verify you rebuilt the site
2. Check `_sites/fractionerp.com/` has updated files
3. Hard refresh browser (Ctrl+Shift+R)

## Forms
- Demo requests: Formspree (`formspree_demo`)
- Contact form: Formspree (`formspree_contact`)

## Production Deployment
Auto-deploys via GitHub Pages when pushing to main branch. Uses `_config.yml` (not `_config_dev.yml`).
