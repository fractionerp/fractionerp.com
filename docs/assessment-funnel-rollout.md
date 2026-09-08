# ERP assessment funnel integration — 8 September 2026

## Messaging change

Before: visitors moved mainly from educational content or product pages into a demo, a strategy call, or a downloadable checklist.

After: visitors uncertain about investing in ERP can take the manufacturing assessment, see an initial outcome, and submit their details for the full printable report. The assessment can advise keeping an existing system, improving processes first, or considering a different kind of system. ERP need and Fraction fit are separate. Demo and pricing routes remain available to visitors with confirmed requirements.

## Placements

| Location | Role and change |
| --- | --- |
| Homepage hero | Replace the secondary spreadsheet-checklist link with a short ERP-assessment invitation. Demo remains primary. |
| Homepage resources | Add the assessment as the first of three resource cards. Retain both existing checklists. |
| Replace Excel in Manufacturing | Replace the mid-page checklist strip with a contextual question about ERP versus process improvement. Keep the existing checklist link near the final demo CTA. |
| Compare ERP | Replace the checklist strip before the closing demo CTA with a prompt to assess the need for a system change. |
| MRP vs ERP | Add an assessment CTA after the “When MRP / When ERP” discussion. |
| What is MRP? | Add an assessment CTA after the section on when MRP is needed. |
| Educational blog articles | Make the assessment the post-article next step and retain a secondary demo link. Product-update and tour articles retain their existing product CTA. |
| Pricing | Replace the secondary strategy-call prompt at the bottom with a short assessment link. Plan-selection and demo CTAs are unchanged. |
| Simple ERP | Add a short assessment link below the final demo/pricing buttons. |
| Header/footer Resources | Existing assessment links remain available. |

## SEO, sitemap and AI descriptions

- Refresh the assessment title, meta/social description and visible introduction to identify the free manufacturing ERP assessment and the report gate accurately.
- Add WebApplication structured data linked to the assessment WebPage and Fraction organisation. Describe the assessment rather than presenting it as the ERP product itself. No ratings, ROI claims or independent-advice claims are added.
- Set the assessment's actual modification date to 2026-09-08. Jekyll generates the sitemap; verify one canonical `/erp-assessment/` entry with lastmod. Do not list browser question states or `#report` as separate pages.
- Update `llms.txt` and `llms-full.txt` with the assessment URL, possible directions, separate ERP/Fraction conclusions, report gate, submitted-answer capture and its role before demos. Do not promise automatic email delivery.
- Existing robots rules already allow the page and identify the canonical sitemap and both AI briefing files; no robots changes are needed.

References checked: [Schema.org WebApplication](https://schema.org/WebApplication), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Sitemap publication does not guarantee immediate indexing.

## Measurement

New consent-aware `assessment_cta_click` events use `cta_placement`: home_hero, home_resources, replace_excel, compare_erp, mrp_vs_erp, what_is_mrp, pricing, simple_erp, blog_article. These are fixed identifiers; no contact details, answer text or arbitrary URLs are sent. Register `cta_placement` as an event-scoped GA4 custom dimension to compare placements. The listener does not interfere with normal link navigation.

Existing assessment start, completion and report events continue. Actual accepted HubSpot submissions still use `generate_lead` with `method: erp_assessment`. CTA clicks are not lead conversions. This rollout does not change HubSpot fields or workflows.

## Validation note

The pricing page already measures 401px wide at a 390px viewport on production, before this rollout. Its pre-existing 11px overflow was reproduced on the development page. The new assessment link is checked independently for fit; the unrelated pricing layout is not changed in this rollout.
