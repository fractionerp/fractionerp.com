# Manufacturing spreadsheet assessment

Public URL: `/spreadsheet-assessment/`. The assessment is standalone and ungated: no contact form, login, database or answer submission. It shares the existing ERP assessment layout, palette and controls; its questions, scripts and results are separate. The existing document landing page and ERP assessment gate are unchanged.

## Content and scoring

`_data/spreadsheet_assessment.json` contains the versioned statements, per-answer friction summaries, conclusion bands, opportunities and discussion prompts. A short introduction leads to one statement at a time. Explicit Yes / No answer buttons advance to the next question; Back restores the previous answer. The last answer opens results. Progress counts answered questions (including No), while the live score counts Yes answers. All 12 questions need an answer.

Each Yes adds one point: 0–3 broadly working, 4–7 starting to outgrow, 8–12 operational friction. Results show one table ranked by score, with friction based only on the Yes answers and an opportunity per area. Equal scores keep their original relative order and have equal priority; all highest-scoring areas are labelled, and zero has no highest category. A concise “Our thoughts” conclusion follows the evidence. Discussion prompts and the full answer list are collapsed by default. The shared browser/Node model is `assets/js/spreadsheet-assessment-model.js`.

Boolean responses, current question and active screen are recovered within the tab using optional sessionStorage, under a versioned key. Version 2.0 uses explicit No answers rather than treating unticked statements as No; version 1 sessions are not reused. Invalid saved responses are discarded, the current question cannot skip the first unanswered question, and incomplete sessions cannot restore results. Review my answers opens the question flow; once all answers exist, Return to results recalculates the report without requiring another full pass. Blocked storage does not prevent completion. No assessment answer analytics are sent; the layout retains the site's existing consent-controlled page analytics.

## Reports

The Download button creates a real PDF locally with the score, ranked analysis table, then the “Our thoughts” conclusion. All 12 labelled Yes / No answers and team discussion prompts follow as appendices. The PDF library loads from the site's own assets only when requested. Failure offers retry and the independent Print / save as PDF option. Print opens the answer details and discussion prompts, then restores their previous states afterwards.

Vendored dependency: [jsPDF 4.2.1](https://github.com/parallax/jsPDF/releases/tag/v4.2.1), downloaded from the pinned npm distribution at `https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js`. Its MIT licence is retained in `assets/js/lib/jspdf/LICENSE`. No HTML rendering plugins or remote PDF service are used. Upgrade the library and rerun browser/PDF checks when maintaining it.

## Future lead gate

`renderReport()` is the current report reveal boundary. A future explicitly submitted name/email form can sit before that boundary without changing the scoring rules. `model.snapshot(answers, data, context)` returns version, validated answer IDs, total, category scores, result band, highest categories, ISO completion time, source and allowlisted UTM fields. UTM context is currently empty; the page does not collect or transmit it. Add consent copy, attribution capture and the intended CRM transport when introducing the form. A future client-side marketing gate is not authentication.

For contextual promotion, use the existing assessment CTA's paper/navy styling and make the spreadsheet destination, button and free-report promise explicit. Do not reuse its current `data-assessment-cta` tracking attribute without updating analytics to distinguish the two assessments.

## Verification

- `node --test docs/erp-assessment.test.cjs docs/spreadsheet-assessment.test.cjs` covers all 4,096 spreadsheet answer combinations, invalid state, explicit No versus unanswered, answer edits, ranked analysis based on selected issues and the future snapshot contract.
- Rebuild with `jekyll build --config _config.yml,_config_dev.yml` inside the website container. The active container is currently `websites`; the older `websites_jekyll` name in AGENTS.md is absent.
- Run `docs/spreadsheet-assessment.browser.cjs` with Playwright installed. Optional `PLAYWRIGHT_MODULE` and `ASSESSMENT_BASE_URL` variables configure the module and site. The script intercepts HubSpot rather than making form submissions. Screenshots and PDF samples go to `/tmp`.
- Inspect downloaded PDFs for all answers and page breaks, and confirm development and production URL prefixes. Production `_config.yml` needs no changes.
