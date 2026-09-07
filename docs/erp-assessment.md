# Manufacturing assessment

Published URL: `/erp-assessment/`. Standalone Jekyll layout, explicit Back/Continue navigation, reduced-motion support, session-only answer recovery and versioned deterministic rules. Visitors see an initial outcome without providing contact details. The “Get your report” form gates the full breakdown and print view.

## Files and checks

- `_data/erp_assessment.json`: versioned questions, answer IDs, conditional follow-ups.
- `assets/js/erp-assessment-model.js`: shared browser/Node logic for branching, validation and recommendations.
- `assets/js/erp-assessment.js`: slide transitions, accessible inputs, result rendering, session storage and review enquiry.
- `node --test docs/erp-assessment.test.cjs`: diagnostic regression scenarios.
- Build using the repository Jekyll development configuration after any changes.

## Decision rules (v1)

Structural signals: 251+ active parts; 4+ production stages; subassemblies; shared resources; subcontracting; traceability. Two or more signals produce high complexity. One signal, 2–3 stages, variable stages or 50–250 parts produce moderate complexity. Headcount and manufacturing mode do not add need points.

Impact: weekly/daily disruption, 11+ team hours weekly spent chasing/re-keying/replanning, or frequent delivery changes/misses. Friction: fragmented systems, manual plan rebuilding, manual/spreadsheet/mixed material planning, or explicitly identified information/software problems.

High complexity + impact + friction gives a strong investigation case. Poor data/no owner changes this to preparation first, without lowering ERP need. Low complexity without impact or confirmed growth gives a low-need result. Remaining combinations need investigation. Growth alone cannot force a strong outcome.

Overrides, in increasing precedence: physical/external-only causes (unless administration/reporting is selected); existing ERP setup/adoption/poor data; effective existing ERP with no reason to replace and no impact/growth; uncertainty or contradictory pain answers. Two unknown core facts or no-pain combined with delivery/admin impact produces uncertainty. One unknown core fact prevents a definitive low-need recommendation.

Fraction fit is separate: ordinary discrete/moulding is potential fit; process/mixed, 251+ people, specialist/group/unknown requirements need review; explicit offline/on-premise or specialist formulation requirements produce unlikely fit. Sites/headcount alone do not disqualify. Non-manufacturers end after the routing question with ERP need unassessed.

These are commercial assessment rules, not empirically validated investment thresholds. Preserve representative-case regression tests whenever changing them. Bump the data version for material logic changes; it also isolates saved sessions and analytics cohorts.

## Lead capture and delivery

There is no dedicated assessment HubSpot form or automated report delivery workflow configured in this repository. Do not promise an automatic email. The full report opens on the same page at `/erp-assessment/#report` only after the API accepts the form submission; it can then be viewed, printed or saved as PDF. The summary and three verdict labels remain ungated.

The explicit “Get my report” form uses the existing strategy form (`efc11f49-51aa-4312-bbef-4945ae45aeae`) and its existing accepted properties: firstname, lastname, email, company, preferred_contact_method=Email, lead_source_detail, message. `message` contains the complete assessment, version and labelled answers. Source detail is `ERP Assessment: Full report request`. Find the assessment in the contact’s corresponding form-submission activity, rather than relying on the latest message contact property (which later enquiries may update). Existing strategy notifications may apply; confirm how the HubSpot workflow routes that source. No answer payload is sent during the assessment. The gate explicitly explains answer storage and follow-up.

The form has a distinct GA4 method `erp_assessment`, while the existing strategy form's method remains `strategy_call`. `generate_lead` fires only after the API accepts a real submission. Browser tests must intercept the API, not create fake contacts. Invalid, failed and honeypot submissions never unlock the report. Double clicks are blocked while submitting; acceptance hides the gate.

Version 1.1 adds a session-only acceptance signature matching the submitted answers. Refreshing the report in the same tab restores it. A changed assessment needs a fresh submission; an unsubmitted visit to #report does not bypass the gate. No contact details are saved in the browser or encoded into the URL. This is a client-side marketing gate, not secure authentication: the assessment runs locally, and there is no server-generated shareable report. If browser session storage is blocked, the immediate report works but cannot be recovered after reload.

To enable automated email reports later: create a dedicated form with the agreed contact and assessment properties, configure and verify report email delivery for each outcome using available HubSpot capabilities, then change the website form and CTA. The browser must not contain secret credentials. Form submission success is not evidence of email delivery.

## Privacy and analytics

Only selected option IDs, current step, completion dedupe state and acceptance signature are in sessionStorage. No contact details are stored there or placed in URLs. Session storage failure does not block the tool. Restart clears the active assessment. Report text uses textContent; arbitrary persisted answer values are rejected against the option schema.

Optional analytics consent enables `assessment_start`, `assessment_step_view` (step_id), `assessment_complete` (outcome), `assessment_report_request` (submission attempt), `assessment_report_view` (accepted submission unlock), `assessment_report_save`. Parameters include assessment_version; they never include contact fields or answer text. Register assessment_version, step_id and outcome as event-scoped GA4 custom dimensions if needed. Existing generate_lead is already marked as a key event; use method=erp_assessment to segment assessment leads. Do not count assessment_complete or a failed report request as a captured contact.

## Remaining external verification

Local browser acceptance uses stubbed HubSpot success/error responses and verifies the outgoing schema. A real authorised review request should confirm that the existing HubSpot form accepts the message and the team receives it. No production form submissions are made by automated tests.
