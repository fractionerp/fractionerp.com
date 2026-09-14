(function () {
  'use strict';
  const root = document.getElementById('ss-data');
  if (!root) return;
  const data = JSON.parse(root.textContent);
  const model = window.FractionSpreadsheetAssessment;
  const questions = data.sections.flatMap(section => section.questions.map(question => ({...question, section: section.id, category: section.title})));
  const byId = id => document.getElementById(id);
  const storageKey = 'fraction-spreadsheet-assessment-' + data.version;
  let responses = {}, step = 0, screen = 'intro', report = null, pdfLoader = null;
  const answers = () => questions.filter(question => responses[question.id] === true).map(question => question.id);
  const complete = () => questions.every(question => typeof responses[question.id] === 'boolean');
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({responses, step, screen})); } catch (_) { /* Storage is optional. */ }
  }
  function showScreen(next, heading, focus) {
    screen = next;
    byId('ss-intro').hidden = next !== 'intro';
    byId('ss-assessment').hidden = next !== 'questions';
    byId('ss-results').hidden = next !== 'results';
    if (focus) {
      // Each answer starts at the same position; no scroll through a long questionnaire.
      window.scrollTo({top: 0, behavior: 'instant'});
      heading.focus({preventScroll: true});
    }
    persist();
  }
  function renderQuestion(focus = true) {
    const question = questions[step];
    byId('ss-question-count').textContent = `Question ${step + 1} of 12`;
    byId('ss-category').textContent = question.category;
    byId('ss-question-title').textContent = question.text;
    const completed = Object.keys(responses).length;
    byId('ss-progress-count').textContent = `${completed} of 12 answered`;
    byId('ss-progress').value = completed;
    byId('ss-live-score').textContent = answers().length;
    byId('ss-stages').querySelectorAll('li').forEach(item => {
      const section = data.sections.find(section => section.id === item.dataset.section);
      item.querySelector('small').textContent = `${section.questions.filter(q => typeof responses[q.id] === 'boolean').length} / 3`;
      if (section.id === question.section) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    byId('ss-choice-hint').textContent = step === 11 ? 'Choose an answer to see your results.' : 'Choose an answer to move to the next question.';
    byId('ss-answers').replaceChildren();
    [true, false].forEach(value => {
      const button = element('button', value ? 'Yes, this applies' : 'No, not for us', 'ss-answer');
      button.type = 'button';
      button.dataset.answer = String(value);
      button.setAttribute('aria-pressed', String(responses[question.id] === value));
      const arrow = element('span', '→');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(arrow);
      button.addEventListener('click', event => {
        // Ignore the second click of a double-click on an advancing answer.
        if (event.detail > 1) return;
        responses[question.id] = value;
        if (step < questions.length - 1) { step++; renderQuestion(); }
        else if (complete()) renderReport();
        else { step = questions.findIndex(q => typeof responses[q.id] !== 'boolean'); renderQuestion(); }
      });
      byId('ss-answers').append(button);
    });
    byId('ss-back').textContent = step === 0 ? '← Introduction' : '← Back';
    byId('ss-return').hidden = !complete();
    showScreen('questions', byId('ss-question-title'), focus);
  }
  function conclusion(result) {
    const band = data.bands.find(item => item.id === result.band);
    return {title: band.title, message: result.totalScore ? band.message : 'You haven’t identified any of these issues today. There’s no need to rush into ERP. Keep an eye on delivery, stock accuracy and job profitability as your business grows.'};
  }
  function renderReport(focus = true) {
    if (!complete()) return;
    report = model.snapshot(answers(), data);
    const thoughts = conclusion(report);
    byId('ss-result-title').textContent = report.totalScore ? 'Where work gets harder.' : 'Your operation, at a glance.';
    byId('ss-result-score').textContent = report.totalScore;
    byId('ss-result-summary').textContent = report.totalScore
      ? 'Your areas of friction, highest score first. Equal scores have equal priority.'
      : 'You haven’t identified any of these issues today. Here’s the picture across all four areas.';
    byId('ss-thoughts-title').textContent = thoughts.title;
    byId('ss-thoughts-copy').textContent = thoughts.message;
    byId('ss-result-date').textContent = new Date(report.completedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
    byId('ss-analysis').replaceChildren();
    model.analysis(report, data).forEach(area => {
      const row = element('tr', undefined, area.highest ? 'is-highest' : '');
      row.dataset.section = area.id;
      row.setAttribute('role', 'row');
      const title = element('th', area.title);
      title.scope = 'row';
      title.setAttribute('role', 'rowheader');
      if (area.highest) title.append(element('small', report.highestCategories.length > 1 ? 'Joint highest' : 'Highest friction', 'ss-priority'));
      const score = element('td', `${area.score} / 3`, 'ss-row-score');
      const friction = element('td');
      friction.dataset.label = 'Friction you identified';
      if (area.friction.length) {
        const list = element('ul', undefined, 'ss-friction-list');
        area.friction.forEach(text => list.append(element('li', text)));
        friction.append(list);
      } else friction.textContent = 'None identified in your answers.';
      const opportunity = element('td', area.opportunity);
      opportunity.dataset.label = 'The opportunity';
      [score, friction, opportunity].forEach(cell => cell.setAttribute('role', 'cell'));
      row.append(title, score, friction, opportunity);
      byId('ss-analysis').append(row);
    });
    byId('ss-answer-list').replaceChildren();
    data.sections.forEach(section => {
      const list = element('ul');
      section.questions.forEach(question => list.append(element('li', `${responses[question.id] ? 'Yes' : 'No'} — ${question.text}`)));
      byId('ss-answer-list').append(element('h3', section.title), list);
    });
    byId('ss-download-status').textContent = '';
    showScreen('results', byId('ss-result-title'), focus);
  }
  function loadPdf() {
    if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
    if (pdfLoader) return pdfLoader;
    pdfLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = window.setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        pdfLoader = null;
        reject(new Error('PDF library unavailable'));
      }
      script.src = byId('main').dataset.baseurl + '/assets/js/lib/jspdf/jspdf.umd.min.js';
      script.onload = () => {
        clearTimeout(timer);
        if (window.jspdf) resolve(window.jspdf.jsPDF);
        else fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
    return pdfLoader;
  }

  function createPdf(JsPDF, result) {
    const doc = new JsPDF({unit: 'mm', format: 'a4'});
    let y = 40;
    const clean = text => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');
    function newPage() { doc.addPage(); y = 40; }
    function room(height) { if (y + height > 271) newPage(); }
    function paragraph(text, size = 11, bold = false, after = 5) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(32, 52, 73);
      const lines = doc.splitTextToSize(clean(text), 174);
      room(lines.length * size * 0.45 + after);
      doc.text(lines, 18, y, {lineHeightFactor: 1.27});
      y += lines.length * size * 0.45 + after;
    }
    function heading(text) { room(35); paragraph(text, 17, true, 7); }
    doc.setProperties({title: 'Your Manufacturing Spreadsheet Assessment', author: 'Fraction ERP', subject: 'Personalised spreadsheet assessment report'});
    paragraph(result.totalScore ? 'Where work gets harder.' : 'Your operation, at a glance.', 23, true, 7);
    paragraph(`${result.totalScore} / 12 signs of friction identified`, 13, true, 5);
    paragraph('Highest score first. Equal scores have equal priority.', 9, false, 7);
    const widths = [41, 17, 58, 58];
    function tableRow(cells, header, highest) {
      doc.setFontSize(9);
      const lines = cells.map((cell, i) => {
        doc.setFont('helvetica', header || i < 2 ? 'bold' : 'normal');
        return doc.splitTextToSize(clean(cell), widths[i] - 8);
      });
      const height = Math.max(...lines.map(text => text.length)) * 3.9 + 6;
      room(height);
      doc.setFillColor(...(header ? [32, 52, 73] : highest ? [228, 238, 235] : [247, 248, 245]));
      doc.rect(18, y - 4, 174, height, 'F');
      doc.setTextColor(...(header ? [255, 255, 255] : [32, 52, 73]));
      let x = 18;
      lines.forEach((text, i) => {
        doc.setFont('helvetica', header || i < 2 ? 'bold' : 'normal');
        doc.text(text, x + 4, y + 1, {lineHeightFactor: 1.23});
        x += widths[i];
      });
      y += height + 1;
    }
    tableRow(['Area', 'Score', 'Friction identified', 'The opportunity'], true, false);
    model.analysis(result, data).forEach(area => tableRow([
      area.title + (area.highest ? (result.highestCategories.length > 1 ? '\nJoint highest' : '\nHighest friction') : ''),
      `${area.score} / 3`, area.friction.length ? area.friction.join('\n') : 'None identified in your answers.', area.opportunity
    ], false, area.highest));
    y += 9;
    room(53);
    paragraph('Our thoughts', 11, true, 4);
    const thoughts = conclusion(result);
    paragraph(thoughts.title, 16, true, 5);
    paragraph(thoughts.message, 10);
    paragraph('Based on your answers today. Your score counts the issues identified, not their frequency or cost.', 8);
    newPage();
    heading('Your 12 answers');
    paragraph('Yes adds one point. No adds no points.', 10);
    data.sections.forEach(section => {
      room(45);
      paragraph(section.title, 13, true);
      section.questions.forEach(question => paragraph(`${result.answers.includes(question.id) ? '[Yes]' : '[No]'} ${question.text}`, 10, false, 4));
      y += 4;
    });
    newPage();
    heading('Questions to discuss with your team');
    paragraph('Use these prompts to plan your next step. They do not affect your score.', 10);
    data.nextQuestions.forEach((text, i) => paragraph(`${i + 1}. ${text}`));
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setFillColor(32, 52, 73);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Fraction ERP', 18, 16);
      doc.setFontSize(9);
      doc.text('THE SPREADSHEET ASSESSMENT', 192, 16, {align: 'right'});
      doc.setTextColor(82, 99, 112);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`${new Date(result.completedAt).toLocaleDateString('en-GB')} | Version ${result.version}`, 18, 282);
      doc.text(`${page} / ${pages}`, 192, 282, {align: 'right'});
      doc.textWithLink('fractionerp.com/spreadsheet-assessment/', 18, 288, {url: 'https://fractionerp.com/spreadsheet-assessment/'});
    }
    return doc;
  }
  byId('ss-start').addEventListener('click', () => renderQuestion());
  byId('ss-back').addEventListener('click', () => {
    if (step > 0) { step--; renderQuestion(); }
    else { byId('ss-start').textContent = 'Continue assessment →'; showScreen('intro', byId('ss-start'), true); }
  });
  byId('ss-return').addEventListener('click', () => renderReport());
  byId('ss-edit').addEventListener('click', () => { step = 0; renderQuestion(); });
  byId('ss-download').addEventListener('click', async () => {
    const button = byId('ss-download');
    button.disabled = true;
    byId('ss-download-status').textContent = 'Preparing your PDF…';
    try {
      const JsPDF = await loadPdf();
      await createPdf(JsPDF, report).save('fraction-spreadsheet-assessment.pdf', {returnPromise: true});
      byId('ss-download-status').textContent = 'Your PDF is ready. Check your downloads.';
    } catch (_) {
      byId('ss-download-status').textContent = 'The PDF download could not be prepared. Please try again, or use Print / save as PDF.';
    } finally { button.disabled = false; }
  });
  const details = [byId('ss-answer-details'), byId('ss-next')];
  let openDetails = null;
  window.addEventListener('beforeprint', () => {
    if (screen !== 'results') return;
    if (!openDetails) openDetails = details.map(item => item.open);
    details.forEach(item => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!openDetails) return;
    details.forEach((item, i) => { item.open = openDetails[i]; });
    openDetails = null;
  });
  byId('ss-print').addEventListener('click', () => window.print());
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch (_) { /* Recover gracefully. */ }
  if (saved && typeof saved === 'object') {
    responses = model.sanitiseResponses(saved.responses, data);
    const firstUnanswered = questions.findIndex(q => typeof responses[q.id] !== 'boolean');
    step = Number.isInteger(saved.step) && saved.step >= 0 && saved.step < 12 ? saved.step : Math.max(0, firstUnanswered);
    if (firstUnanswered >= 0) step = Math.min(step, firstUnanswered);
    if (saved.screen === 'results' && complete()) renderReport(false);
    else if (saved.screen === 'questions' || saved.screen === 'results') renderQuestion(false);
    if (Object.keys(responses).length) byId('ss-start').textContent = 'Continue assessment →';
  }
  byId('ss-start').hidden = false;
})();
