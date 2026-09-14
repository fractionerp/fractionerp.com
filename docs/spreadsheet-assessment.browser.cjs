// Run against a rebuilt development site. Set PLAYWRIGHT_MODULE if installed elsewhere.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ASSESSMENT_BASE_URL || 'https://tenx.fraction.app/fractionerp.com';
const url = base + '/spreadsheet-assessment/';
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
    const response = await page.goto(url, {waitUntil: 'networkidle'});
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('input[name="statements"]').count(), 12);
    assert.equal(await page.locator('input[type="email"]').count(), 0);
    assert.equal(await page.locator('#ss-results').isVisible(), false);
    assert.equal(await page.locator('script[src*="erp-assessment.js"]').count(), 0);
    await page.screenshot({path: '/tmp/spreadsheet-desktop.png', fullPage: true});

    await page.locator('#ss-submit').click();
    assert.equal(await page.locator('#ss-result-score').innerText(), '0');
    assert.match(await page.locator('#ss-friction-title').innerText(), /No friction/);
    assert.equal(await page.locator('.is-highest').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ss-result-title');
    await page.locator('#ss-edit').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'ss-questions-title');

    // Clicking the text selects the entire card; keyboard Space toggles its native input.
    await page.locator('label[for="ss-q1"] span').click();
    assert(await page.locator('#ss-q1').isChecked());
    await page.locator('#ss-q2').focus();
    await page.keyboard.press('Space');
    for (const id of ['q4', 'q5', 'q7', 'q10', 'q11']) await page.locator('#ss-' + id).check();
    assert.equal(await page.locator('#ss-live-score').innerText(), '7');
    await page.locator('#ss-submit').click();
    assert.match(await page.locator('#ss-result-title').innerText(), /starting to outgrow/);
    assert.equal(await page.locator('.ss-diagnosis').count(), 3);
    assert.equal(await page.locator('.ss-breakdown-row.is-highest').count(), 3);
    assert.equal(await page.locator('#ss-answer-list li').count(), 12);
    await page.screenshot({path: '/tmp/spreadsheet-result.png', fullPage: true});
    await page.reload({waitUntil: 'networkidle'});
    assert.equal(await page.locator('#ss-result-score').innerText(), '7');
    assert(await page.locator('#ss-results').isVisible());

    // A PDF asset failure must leave results available and allow a retry.
    await page.route('**/assets/js/lib/jspdf/jspdf.umd.min.js', route => route.abort());
    await page.locator('#ss-download').click();
    await page.getByText('The PDF download could not be prepared.', {exact: false}).waitFor();
    assert(await page.locator('#ss-download').isEnabled());
    await page.unroute('**/assets/js/lib/jspdf/jspdf.umd.min.js');
    let downloadPromise = page.waitForEvent('download');
    await page.locator('#ss-download').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'fraction-spreadsheet-assessment.pdf');
    await download.saveAs('/tmp/spreadsheet-report.pdf');

    await page.locator('#ss-q8').check();
    assert.equal(await page.locator('#ss-result-score').innerText(), '8');
    assert.match(await page.locator('#ss-result-title').innerText(), /operational friction/);
    for (let i = 1; i <= 12; i++) await page.locator('#ss-q' + i).check();
    assert.equal(await page.locator('#ss-result-score').innerText(), '12');
    assert.equal(await page.locator('.ss-diagnosis').count(), 4);
    downloadPromise = page.waitForEvent('download');
    await page.locator('#ss-download').click();
    await (await downloadPromise).saveAs('/tmp/spreadsheet-report-all.pdf');

    // Narrow screens, sticky score visibility and print output.
    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      await page.locator('#ss-q7').scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const box = await page.locator('.ss-score-panel').boundingBox();
      assert(box.y >= 0 && box.y < 100, 'live score should remain visible');
      await page.screenshot({path: `/tmp/spreadsheet-mobile-${width}.png`, fullPage: true});
    }
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert(await page.locator('#ss-answer-details').getAttribute('open') !== null);
    await page.emulateMedia({media: 'print'});
    assert.equal(await page.locator('#ss-assessment').isVisible(), false);
    assert.equal(await page.locator('#ss-answer-list').isVisible(), true);
    await page.pdf({path: '/tmp/spreadsheet-print.pdf', format: 'A4'});
    await page.emulateMedia({media: 'screen'});
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(submissions, 0);
    assert.deepEqual(errors, []);

    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {get() { throw new Error('Storage blocked'); }});
    });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(url);
    await blockedPage.locator('#ss-q12').check();
    await blockedPage.locator('#ss-submit').click();
    assert.equal(await blockedPage.locator('#ss-result-score').innerText(), '1');
    const noJs = await browser.newContext({javaScriptEnabled: false});
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(url, {waitUntil: 'networkidle'});
    await noJsPage.locator('.ss-notice').waitFor({state: 'visible'});
    assert.match(await noJsPage.locator('.ss-notice').innerText(), /Please enable JavaScript to calculate/);
    assert.equal(await noJsPage.locator('#ss-submit').isVisible(), false);

    // The shared layout must keep the existing ERP assessment's own journey and schema.
    await page.goto(base + '/erp-assessment/', {waitUntil: 'networkidle'});
    assert(await page.locator('#as-start').isVisible());
    assert.equal(await page.locator('script[src*="spreadsheet-assessment.js"]').count(), 0);
    await page.locator('#as-start').click();
    assert(await page.locator('#as-journey').isVisible());
    console.log('PASS: scoring, ties, zero result, editing, keyboard, refresh, PDF failure/retry/download, mobile, print, blocked storage, no JS, no submissions, existing ERP journey.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
