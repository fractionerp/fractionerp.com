# Homepage design review and preview

Reviewed 17 November 2026 against the current homepage and supplied Fraction Brand Palette v1.0.

Preview: https://tenx.fraction.app/fractionerp.com/newhomepage/

## Assessment

The existing homepage has strong material: connected manufacturing workflows, genuine customer stories and direct experience running a manufacturing business. Its presentation gives too many messages similar emphasis.

| Area | Current observation | Preview response |
| --- | --- | --- |
| Hierarchy | A long hero, checklist, assessment link and prominent AI announcement compete before product evidence. | A short proposition, one primary demo action and a product exploration route. AI moves into supporting content. |
| Typography | Jost, Poppins and Open Sans combine with uppercase section headings and multiple inline size rules. | Inter 400/500/600, sentence case headings and a consistent size hierarchy. |
| Colour | Mid-blue backgrounds, cyan, orange and green compete across sections and feature icons. | Supplied midnight, navy, canvas, white and secondary text tokens; selective blue for active controls and focus. |
| Layout | Repeated centred introductions and bordered cards give many sections similar visual weight. | Open columns, a full-width product figure, linked workflow rows and a distinct customer proof section. |
| Spacing | Dense hero content and variable card spacing create an uneven reading rhythm. | Shared content width, 112px desktop section spacing and 62–72px on smaller screens. |
| Evidence | An angled monitor image is followed by multiple claims before detailed product information. | Actual product screenshots early in the page, with full-size image links, followed by established customer evidence. |
| Usability | Several competing next steps and many expanded FAQs require scanning. | Consistent “Book a demo” action, descriptive links, collapsible FAQs and a mobile menu with Escape handling. |

These are design observations, not conclusions from user testing or conversion data. Review the complete page on a phone and desktop before deciding whether the shorter copy gives buyers enough detail.

## Preview implementation

- Isolated page, CSS and JavaScript; existing homepage, shared layouts, navigation and production configuration are unchanged.
- `/newhomepage/` is unlinked, has `noindex, nofollow` and is excluded from the generated sitemap. It is accessible to anyone with the URL, rather than password protected.
- Existing product images, customer names, testimonials and capability descriptions are reused. No invented performance statistics.
- Product view selectors become ordinary feature links without JavaScript. Mobile navigation remains visible without JavaScript; FAQs use native details/summary controls.
- No analytics, tracking scripts or new forms on this review page. Demo links go to the existing booking flow.
- The palette’s #3489DB is retained for focus and selection. Small blue text uses #2269AD to meet contrast requirements on white/canvas.

## Validation

- Jekyll development build passed in the running `websites` container (the documented `websites_jekyll` container does not exist in this environment).
- Preview loaded in the browser at desktop and phone widths; no horizontal overflow at 1280px and 390px.
- Mobile menu open/close, Escape focus return, all three screenshot selectors and FAQ expansion passed browser checks.
- Internal links and assets resolve to existing build output; sitemap omission verified.
- JavaScript syntax passed. Muted text and small text link colour combinations exceed 4.5:1 contrast.

## Review focus

Assess whether the darker opening feels confident, whether the product evidence arrives early enough, and whether the page gives the right balance of manufacturing detail and breathing room. Subsequent changes to other pages should follow approval of this direction.
