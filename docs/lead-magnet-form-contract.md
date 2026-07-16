# Lead magnet and enquiry form contract

The website uses two conversion tiers plus an email-only newsletter form. New forms should reuse the relevant include rather than introduce page-specific field names.

## Submission method

Forms are native HTML owned and styled by this site. `_includes/forms/hubspot-content.html` renders the fields, `assets/css/forms.css` styles them, and `assets/js/hubspot-forms.js` sends submissions to HubSpot's unauthenticated Forms API:

`POST https://api.hsforms.com/submissions/v3/integration/submit/9456893/{formId}`

Do not reintroduce `js.hsforms.net`, `hbspt.forms.create`, an API key, or a private-app token. The browser submission contains the HubSpot field internal names, page context, and the `hubspotutk` cookie when available. HubSpot remains responsible for contact storage, workflows, notifications, and delivery emails.

## Tier 1: HubSpot content forms

Every lead magnet form in HubSpot must contain these required contact properties:

- `firstname` — First Name
- `lastname` — Last Name
- `email` — Work Email
- `company` — Company Name

Each form must also contain a hidden single-line text property with the internal name `lead_source_detail`. The website's `forms/hubspot-content.html` include submits this property with an asset- and placement-specific value. Do not add telephone, company size, or qualification dropdowns to Tier 1 forms.

Current HubSpot form mapping:

| Asset | HubSpot form ID | Website source detail |
|---|---|---|
| ERP Implementation Guide | `4a432a7b-16c2-4734-8a20-3c2b4af74246` | `Downloaded: ERP Implementation Guide` plus placement suffixes |
| ERP Manufacturing Workflow | `62895e64-92ee-49af-9cf0-8a491fc47e1f` | `Downloaded: ERP Manufacturing Workflow` |
| Spreadsheet Readiness Checklist | `f80f4546-168f-478a-83e3-d8515921d53a` | `spreadsheet-readiness-checklist` |
| 5 Signs Your ERP Is Failing You | `35b77591-64ce-417f-9ce9-2c0e5af30419` | `erp-failing-signs-checklist` |

Configure HubSpot delivery and nurture workflows to branch on `lead_source_detail`. HubSpot rejects unknown fields, so this property and every other submitted property must be included in the corresponding published HubSpot form with exactly the internal names listed here.

All Tier 1 forms redirect to `/lead-magnet-success/`, which tells visitors to expect the requested resource by email shortly.

## Tier 2: demo and strategy enquiries

The HubSpot forms must use these property-aligned fields:

- `firstname` — required
- `lastname` — required
- `email` — required
- `company` — required
- `phone` — optional unless Telephone is the selected contact method
- `preferred_contact_method` — required, Email or Telephone
- `message` — optional
- `company_size` — optional
- `lead_source_detail` — hidden placement value

Current Tier 2 HubSpot form mapping:

| Conversion | HubSpot form ID | Website source detail |
|---|---|---|
| Request Demo | `072de23b-0398-4bb2-85b6-c88115fe276b` | Placement-specific demo source |
| ERP Strategy Call | `efc11f49-51aa-4312-bbef-4945ae45aeae` | `Book an ERP Strategy Call` |

Both forms are rendered through `_includes/forms/hubspot-content.html` and submitted through the API. Keep their HubSpot field definitions aligned with the schema above and include the hidden `lead_source_detail` property. The `company_size` option values and `preferred_contact_method` values in HubSpot must match the values rendered by the include.

Request Demo forms redirect to `/success/`. ERP Strategy Call forms redirect to `/strategy-call-success/`. Newsletter forms show a website-controlled inline completion message after HubSpot accepts the submission.

## Newsletter

The newsletter form uses form ID `63ddf8b0-3b4f-49a7-8ed2-d457c2f07ace` and submits `email` plus the hidden `lead_source_detail` placement value. It is not a lead-magnet gate and does not affect the ungated demo video.
