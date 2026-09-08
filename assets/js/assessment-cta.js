(function () {
  'use strict';
  var placements = ['home_hero', 'home_resources', 'replace_excel', 'compare_erp', 'mrp_vs_erp', 'what_is_mrp', 'pricing', 'simple_erp', 'blog_article'];
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-assessment-cta]');
    if (!link || placements.indexOf(link.dataset.assessmentCta) === -1) return;
    if (!document.cookie.split(';').some(function (cookie) { return cookie.trim() === 'cookie_consent=accepted'; })) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'assessment_cta_click', { cta_placement: link.dataset.assessmentCta });
    }
  });
})();
