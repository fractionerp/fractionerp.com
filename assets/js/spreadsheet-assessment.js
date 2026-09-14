(function () {
  'use strict';
  const root = document.getElementById('ss-data');
  if (!root) return;
  const data = JSON.parse(root.textContent);
  const model = window.FractionSpreadsheetAssessment;
  const byId = id => document.getElementById(id);
  const form = byId('ss-form');
  const inputs = [...form.querySelectorAll('input[name="statements"]')];
  const storageKey = 'fraction-spreadsheet-assessment-' + data.version;
  let report = null;
  let pdfLoader = null;
  const answers = () => inputs.filter(input => input.checked).map(input => input.value);
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({answers: answers(), revealed: !byId('ss-results').hidden})); } catch (_) { /* Storage is optional. */ }
  }
  function updateScore() {
    const count = answers().length;
    byId('ss-live-score').textContent = count;
    byId('ss-live-message').textContent = count === 0
      ? 'No statements ticked yet. Tick any that apply.'
      : `You've identified ${count} ${count === 1 ? 'sign' : 'signs'} of possible friction in your current systems.`;
  }
  function focusSection(heading, section) {
    heading.focus({preventScroll: true});
    section.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
  }
  function renderReport() {
    report = model.snapshot(answers(), data);
    const band = data.bands.find(item => item.id === report.band);
    byId('ss-result-score').textContent = report.totalScore;
    byId('ss-band').textContent = band.label;
    byId('ss-result-title').textContent = band.title;
    byId('ss-result-date').textContent = new Date(report.completedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
    byId('ss-result-copy').replaceChildren(...band.paragraphs.map(text => element('p', text)));
    byId('ss-key-message').textContent = band.message;
    byId('ss-breakdown').replaceChildren();
    byId('ss-diagnoses').replaceChildren();
    byId('ss-answer-list').replaceChildren();
    byId('ss-friction-title').textContent = report.highestCategories.length > 1 ? 'Your areas of greatest friction' : report.totalScore > 0 ? 'Your biggest area of friction' : 'No friction identified by your answers';
    if (report.totalScore === 0) {
      byId('ss-diagnoses').append(element('p', 'None of these statements apply to your business today, so there is no highest-scoring problem area. Keep an eye on delivery, stock accuracy and job profitability as your operation changes.'));
    }
    data.sections.forEach(section => {
      const score = report.categoryScores.find(item => item.id === section.id).score;
      const highest = report.highestCategories.includes(section.id);
      const row = element('div', undefined, 'ss-breakdown-row' + (highest ? ' is-highest' : ''));
      const label = element('div', undefined, 'ss-breakdown-label');
      label.append(element('span', section.title), element('strong', `${score} / 3`));
      const bar = element('div', undefined, 'ss-bar');
      bar.setAttribute('aria-hidden', 'true');
      const fill = element('span');
      fill.style.width = (score / 3 * 100) + '%';
      bar.append(fill);
      row.append(label, bar);
      byId('ss-breakdown').append(row);
      if (highest) {
        const diagnosis = element('article', undefined, 'ss-diagnosis');
        diagnosis.append(element('h4', `${section.title} — ${score} / 3`), element('p', section.diagnosis));
        const opportunity = element('p');
        opportunity.append(element('strong', 'The opportunity: '), document.createTextNode(section.opportunity));
        diagnosis.append(opportunity);
        byId('ss-diagnoses').append(diagnosis);
      }
      const list = element('ul');
      section.questions.forEach(question => list.append(element('li', `${report.answers.includes(question.id) ? 'Ticked' : 'Not ticked'} — ${question.text}`)));
      byId('ss-answer-list').append(element('h3', section.title), list);
    });
    byId('ss-results').hidden = false;
    byId('ss-download-status').textContent = '';
    persist();
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
    const band = data.bands.find(item => item.id === result.band);
    let y = 40;
    const clean = text => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/→/g, ' to ');
    function newPage() { doc.addPage(); y = 40; }
    function room(height) { if (y + height > 271) newPage(); }
    function paragraph(text, size = 11, bold = false, after = 5) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(32, 52, 73);
      const lines = doc.splitTextToSize(clean(text), 174);
      const lineHeight = size * 0.45;
      room(lines.length * lineHeight + after);
      doc.text(lines, 18, y, {lineHeightFactor: 1.27});
      y += lines.length * lineHeight + after;
    }
    function heading(text) { room(35); paragraph(text, 17, true, 7); }
    doc.setProperties({title: 'Your Manufacturing Spreadsheet Assessment', author: 'Fraction ERP', subject: 'Personalised spreadsheet assessment report'});
    paragraph('Your manufacturing spreadsheet assessment', 24, true, 9);
    paragraph(`${result.totalScore} / 12 statements ticked`, 22, true, 8);
    paragraph(band.title, 17, true, 7);
    band.paragraphs.forEach(text => paragraph(text));
    paragraph(band.message, 11, true, 9);
    heading('Your operational breakdown');
    result.categoryScores.forEach(category => {
      const section = data.sections.find(item => item.id === category.id);
      room(22);
      paragraph(`${section.title}: ${category.score} / 3${result.highestCategories.includes(category.id) ? ' (highest)' : ''}`, 10, true, 2);
      doc.setFillColor(215, 221, 216);
      doc.roundedRect(18, y, 174, 3, 1, 1, 'F');
      if (category.score) {
        doc.setFillColor(19, 107, 136);
        doc.roundedRect(18, y, 174 * category.score / 3, 3, 1, 1, 'F');
      }
      y += 11;
    });
    paragraph('Based on the statements you ticked today. This assessment highlights possible process problems; it does not measure their frequency, cost or severity.', 9);
    newPage();
    heading(result.highestCategories.length > 1 ? 'Your areas of greatest friction' : result.totalScore ? 'Your biggest area of friction' : 'No friction identified by your answers');
    if (!result.totalScore) paragraph('None of these statements apply to your business today, so there is no highest-scoring problem area. Keep an eye on delivery, stock accuracy and job profitability as your operation changes.');
    result.highestCategories.forEach(id => {
      const section = data.sections.find(item => item.id === id);
      const score = result.categoryScores.find(item => item.id === id).score;
      room(50);
      paragraph(`${section.title} - ${score} / 3`, 13, true);
      paragraph(section.diagnosis);
      paragraph('The opportunity: ' + section.opportunity, 11, true, 9);
    });
    room(120);
    heading('What next?');
    paragraph("Having spreadsheet problems doesn't automatically mean you need ERP tomorrow. Before looking at software, discuss these questions with your team. They do not affect your score.");
    data.nextQuestions.forEach((text, i) => paragraph(`${i + 1}. ${text}`));
    newPage();
    heading('Your assessment answers');
    paragraph('Each ticked statement adds one point. Unticked statements add no points.', 10);
    data.sections.forEach(section => {
      room(45);
      paragraph(section.title, 13, true);
      section.questions.forEach(question => paragraph(`${result.answers.includes(question.id) ? '[Ticked]' : '[Not ticked]'} ${question.text}`, 10, false, 4));
      y += 4;
    });
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

  form.addEventListener('change', () => {
    updateScore();
    if (!byId('ss-results').hidden) renderReport();
    else persist();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    renderReport();
    focusSection(byId('ss-result-title'), byId('ss-results'));
  });
  byId('ss-edit').addEventListener('click', () => focusSection(byId('ss-questions-title'), byId('ss-assessment')));
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
  let wasOpen = false;
  window.addEventListener('beforeprint', () => {
    if (!report) return;
    wasOpen = byId('ss-answer-details').open;
    byId('ss-answer-details').open = true;
  });
  window.addEventListener('afterprint', () => { byId('ss-answer-details').open = wasOpen; });
  byId('ss-print').addEventListener('click', () => window.print());
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch (_) { /* Recover gracefully. */ }
  if (saved && typeof saved === 'object') {
    const selected = model.sanitise(saved.answers, data);
    inputs.forEach(input => { input.checked = selected.includes(input.value); });
    if (saved.revealed === true) renderReport();
  }
  updateScore();
  form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = false; });
  byId('ss-submit').hidden = false;
})();
