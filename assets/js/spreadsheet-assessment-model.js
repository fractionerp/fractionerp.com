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
  function sanitiseResponses(responses, data) {
    const valid = {};
    if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return valid;
    data.sections.flatMap(section => section.questions).forEach(question => {
      if (typeof responses[question.id] === 'boolean') valid[question.id] = responses[question.id];
    });
    return valid;
  }
  function analysis(result, data) {
    return data.sections.map(section => {
      const selected = section.questions.filter(question => result.answers.includes(question.id));
      return {id: section.id, title: section.title, score: selected.length,
        highest: result.highestCategories.includes(section.id),
        friction: selected.map(question => question.friction),
        opportunity: selected.length ? section.opportunity : 'Keep this area under review as the business grows.'};
    }).sort((a, b) => b.score - a.score);
  }
  // A transport-independent snapshot for a future, explicitly submitted lead form.
  function snapshot(answers, data, context = {}) {
    const utm = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      if (typeof context[key] === 'string') utm[key] = context[key].slice(0, 200);
    }
    return {...assess(answers, data), completedAt: new Date().toISOString(), source: 'spreadsheet-assessment', utm};
  }
  return {sanitise, sanitiseResponses, assess, analysis, snapshot};
});
