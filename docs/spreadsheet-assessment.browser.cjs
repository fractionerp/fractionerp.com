// Run against a rebuilt development site. Set PLAYWRIGHT_MODULE if installed elsewhere.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ASSESSMENT_BASE_URL || 'https://tenx.fraction.app/fractionerp.com';
const url = base + '/spreadsheet-assessment/';
async function answer(page, value) { await page.locator(`[data-answer="${value}"]`).click(); }
async function walk(page, yesIds) {
  for (let i = 0; i < 12; i++) {
    if (await page.locator('#ss-results').isVisible()) return;
    const step = Number((await page.locator('#ss-question-count').textContent()).match(/\d+/)[0]);
    await answer(page, yesIds.includes('q' + step));
  }
  assert(await page.locator('#ss-results').isVisible());
}
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce', acceptDownloads: true});
    await context.addCookies([{name: 'cookie_consent', value: 'rejected', domain: new URL(base).hostname, path: '/'}]);
    await context.route(/googletagmanager|google-analytics/, route => route.abort());
    let submissions = 0;
    await context.route(/api\.hsforms\.com/, route => { submissions++; return route.abort(); });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    assert.equal((await page.goto(url, {waitUntil: 'networkidle'})).status(), 200);
    assert.equal(await page.locator('input[type="email"]').count(), 0);
    assert.equal(await page.locator('#ss-assessment').isVisible(), false);
    assert.equal(await page.locator('#ss-results').isVisible(), false);
    await page.screenshot({path: '/tmp/spreadsheet-focused-intro.png', fullPage: true});
    await page.locator('#ss-start').click();
    assert.equal(await page.locator('#ss-intro').isVisible(), false);
    assert.equal(await page.locator('.ss-answer:visible').count(), 2);
    assert.equal(await page.locator('#ss-question-count').textContent(), 'Question 1 of 12');
    assert.equal(await page.locator('#ss-return').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ss-question-title');
    await page.screenshot({path: '/tmp/spreadsheet-focused-question.png', fullPage: true});
    // Keyboard selection advances exactly once and focuses the next question.
    await page.locator('[data-answer="true"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#ss-question-count').textContent(), 'Question 2 of 12');
    assert.equal(await page.locator('#ss-progress-count').innerText(), '1 of 12 answered');
    await page.reload({waitUntil: 'networkidle'});
    assert.equal(await page.locator('#ss-question-count').textContent(), 'Question 2 of 12');
    await page.locator('#ss-back').click();
    assert.equal(await page.locator('[data-answer="true"]').getAttribute('aria-pressed'), 'true');
    await answer(page, false);
    assert.equal(await page.locator('#ss-live-score').innerText(), '0');
    await walk(page, []);
    assert.equal(await page.locator('#ss-result-score').innerText(), '0');
    assert.equal(await page.locator('.is-highest').count(), 0);
    assert.equal(await page.locator('#ss-analysis tr').count(), 4);
    assert.match(await page.locator('#ss-result-summary').innerText(), /haven’t identified/);
    assert.equal(await page.locator('#ss-assessment').isVisible(), false);

    await page.locator('#ss-edit').click();
    await walk(page, ['q4', 'q5', 'q7', 'q8', 'q9', 'q10']);
    assert.equal(await page.locator('#ss-result-score').innerText(), '6');
    assert.deepEqual(await page.locator('#ss-analysis tr').evaluateAll(rows => rows.map(row => row.dataset.section)), ['inventory', 'production', 'information', 'quoting']);
    assert.match(await page.locator('#ss-analysis tr').last().innerText(), /None identified/);
    assert.equal(await page.locator('#ss-band').count(), 0);
    assert.match(await page.locator('#ss-thoughts-title').innerText(), /starting to outgrow/);
    const table = await page.locator('.ss-analysis-table').boundingBox();
    const thoughts = await page.locator('.ss-thoughts').boundingBox();
    assert(thoughts.y >= table.y + table.height, 'conclusion follows analysis');
    assert.equal(await page.locator('#ss-next').getAttribute('open'), null);
    assert.equal(await page.locator('#ss-answer-details').getAttribute('open'), null);
    await page.screenshot({path: '/tmp/spreadsheet-focused-result.png', fullPage: true});
    await page.reload({waitUntil: 'networkidle'});
    assert.equal(await page.locator('#ss-result-score').innerText(), '6');
    // Editing and returning updates the report without repeating all twelve answers.
    await page.locator('#ss-edit').click();
    await answer(page, true);
    await page.locator('#ss-return').click();
    assert.equal(await page.locator('#ss-result-score').innerText(), '7');

    await page.route('**/assets/js/lib/jspdf/jspdf.umd.min.js', route => route.abort());
    await page.locator('#ss-download').click();
    await page.getByText('The PDF download could not be prepared.', {exact: false}).waitFor();
    assert(await page.locator('#ss-download').isEnabled());
    await page.unroute('**/assets/js/lib/jspdf/jspdf.umd.min.js');
    let pending = page.waitForEvent('download');
    await page.locator('#ss-download').click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), 'fraction-spreadsheet-assessment.pdf');
    await download.saveAs('/tmp/spreadsheet-focused-report.pdf');
    await page.locator('#ss-edit').click();
    await walk(page, Array.from({length: 12}, (_, i) => 'q' + (i + 1)));
    assert.equal(await page.locator('#ss-result-score').innerText(), '12');
    assert.equal(await page.locator('.is-highest').count(), 4);
    assert.equal(await page.locator('.ss-priority').first().innerText(), 'Joint highest');
    pending = page.waitForEvent('download');
    await page.locator('#ss-download').click();
    await (await pending).saveAs('/tmp/spreadsheet-focused-report-all.pdf');
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('#ss-answer-details').getAttribute('open'), '');
    assert.equal(await page.locator('#ss-next').getAttribute('open'), '');
    await page.emulateMedia({media: 'print'});
    assert(await page.locator('#ss-answer-list').isVisible());
    await page.pdf({path: '/tmp/spreadsheet-focused-print.pdf', format: 'A4'});
    await page.emulateMedia({media: 'screen'});
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('#ss-answer-details').getAttribute('open'), null);
    assert.equal(await page.locator('#ss-next').getAttribute('open'), null);

    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({path: `/tmp/spreadsheet-focused-result-${width}.png`, fullPage: true});
      await page.locator('#ss-edit').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const progress = await page.locator('.ss-progress-panel').boundingBox();
      assert(progress.y >= 0 && progress.y < 150);
      await page.screenshot({path: `/tmp/spreadsheet-focused-question-${width}.png`, fullPage: true});
      await page.locator('#ss-return').click();
    }
    assert.equal(submissions, 0);
    assert.deepEqual(errors, []);
    // Bad session data must not turn unanswered questions into No or unlock results.
    await page.evaluate(() => sessionStorage.setItem('fraction-spreadsheet-assessment-2.0.0', JSON.stringify({responses: {q1: false, q2: 'true', q99: true}, step: 11, screen: 'results'})));
    await page.reload({waitUntil: 'networkidle'});
    assert.equal(await page.locator('#ss-results').isVisible(), false);
    assert.equal(await page.locator('#ss-question-count').textContent(), 'Question 2 of 12');
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window, 'sessionStorage', {get() { throw new Error('Storage blocked'); }}));
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(url);
    await blockedPage.locator('#ss-start').click();
    await walk(blockedPage, ['q12']);
    assert.equal(await blockedPage.locator('#ss-result-score').innerText(), '1');
    const noJs = await browser.newContext({javaScriptEnabled: false});
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(url, {waitUntil: 'networkidle'});
    await noJsPage.locator('.ss-notice').waitFor({state: 'visible'});
    assert.equal(await noJsPage.locator('#ss-start').isVisible(), false);
    await page.goto(base + '/erp-assessment/', {waitUntil: 'networkidle'});
    assert(await page.locator('#as-start').isVisible());
    await page.locator('#as-start').click();
    assert(await page.locator('#as-journey').isVisible());
    console.log('PASS: sequential journey, keyboard, progress, Back, edit/return, refresh, no incomplete results, ranking, ties, zero, PDF retry/download, print, mobile, storage failure, no JS and existing ERP journey.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
