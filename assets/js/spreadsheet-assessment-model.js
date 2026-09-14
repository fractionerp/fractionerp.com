(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FractionSpreadsheetAssessment = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function sanitise(answers, data) {
    const selected = new Set(Array.isArray(answers) ? answers : []);
    return data.sections.flatMap(section => section.questions)
      .filter(question => selected.has(question.id)).map(question => question.id);
  }
  function assess(answers, data) {
    const selected = sanitise(answers, data);
    const categoryScores = data.sections.map(section => ({
      id: section.id,
      score: section.questions.filter(question => selected.includes(question.id)).length
    }));
    const totalScore = selected.length;
    const highest = Math.max(...categoryScores.map(section => section.score));
    return {
      version: data.version, answers: selected, totalScore, categoryScores,
      band: data.bands.find(band => totalScore <= band.max).id,
      highestCategories: highest > 0 ? categoryScores.filter(section => section.score === highest).map(section => section.id) : []
    };
  }
  // A transport-independent snapshot for a future, explicitly submitted lead form.
  function snapshot(answers, data, context = {}) {
    const utm = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      if (typeof context[key] === 'string') utm[key] = context[key].slice(0, 200);
    }
    return {...assess(answers, data), completedAt: new Date().toISOString(), source: 'spreadsheet-assessment', utm};
  }
  return {sanitise, assess, snapshot};
});
