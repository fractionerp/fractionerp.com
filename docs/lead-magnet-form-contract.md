# Lead magnet and enquiry form contract

The website uses two form schemas. New forms should reuse the relevant include rather than introduce page-specific field names.

## Tier 1: HubSpot content forms

Every lead magnet form in HubSpot must contain these required contact properties:

- `firstname` — First Name
- `lastname` — Last Name
- `email` — Work Email
- `company` — Company Name

Each form must also contain a hidden single-line text property with the internal name `lead_source_detail`. The website's `forms/hubspot-content.html` include fills this property with an asset- and placement-specific value when HubSpot renders the form. Do not add telephone, company size, or qualification dropdowns to Tier 1 forms.

Current HubSpot form mapping:

| Asset | HubSpot form ID | Website source detail |
|---|---|---|
| ERP Implementation Guide | `4a432a7b-16c2-4734-8a20-3c2b4af74246` | `Downloaded: ERP Implementation Guide` plus placement suffixes |
| ERP Manufacturing Workflow | `62895e64-92ee-49af-9cf0-8a491fc47e1f` | `Downloaded: ERP Manufacturing Workflow` |
| Spreadsheet Readiness Checklist | `f80f4546-168f-478a-83e3-d8515921d53a` | `spreadsheet-readiness-checklist` |
| 5 Signs Your ERP Is Failing You | `74d026e0-338e-494a-bd6a-2c3f8c7b59cf` | `erp-failing-signs-checklist` |

Configure HubSpot delivery and nurture workflows to branch on `lead_source_detail`. The website callback cannot store that value unless the property is present in the published HubSpot form.

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

Both forms are rendered through `_includes/forms/hubspot-content.html`. Keep their HubSpot field definitions aligned with the schema above and include the hidden `lead_source_detail` property.

Request Demo forms redirect to `/success/`. ERP Strategy Call forms redirect to `/strategy-call-success/`. Newsletter forms use their HubSpot-configured inline completion message.
