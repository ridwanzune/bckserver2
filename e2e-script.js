// e2e-script.js
import puppeteer from 'puppeteer';

const APP_URL = process.env.APP_URL;
const APP_PASSWORD = process.env.APP_PASSWORD;
const WEBHOOK_URL = 'https://hook.eu2.make.com/0ui64t2di3wvvg00fih0d32qp9i9jgme';

async function sendStatus(level, message = '', details = {}) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        category: 'Paka Kotha E2E',
        details
      }),
    });
    console.log(`Status sent: ${level}`);
    await new Promise(res => setTimeout(res, 1000));
  } catch (err) {
    console.error('Webhook send failed:', err);
  }
}

(async () => {
  console.log('Starting E2E script');
  await new Promise(res => setTimeout(res, 1000));

  if (!APP_URL || !APP_PASSWORD) {
    console.error('APP_URL or APP_PASSWORD missing');
    await new Promise(res => setTimeout(res, 1000));
    await sendStatus('ERROR', 'Missing required environment variables');
    process.exit(1);
  }

  console.log('Launching browser...');
  await new Promise(res => setTimeout(res, 1000));
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${APP_URL} ...`);
    await new Promise(res => setTimeout(res, 1000));
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    console.log('Entering password...');
    await new Promise(res => setTimeout(res, 1000));
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.type('input[type="password"]', APP_PASSWORD);

    console.log('Submitting password form...');
    await new Promise(res => setTimeout(res, 1000));
    await page.click('button[type="submit"]');

    const btnXPath = "//button[contains(., 'START AUTOMATION')]";
    console.log('Waiting for START AUTOMATION button...');
    await new Promise(res => setTimeout(res, 1000));
    await page.waitForSelector(`xpath/${btnXPath}`, { timeout: 60000 });

    console.log('Pressing START AUTOMATION button...');
    await new Promise(res => setTimeout(res, 1000));
    const btn = await page.$(`xpath/${btnXPath}`);
    if (!btn) throw new Error('START AUTOMATION button not found');
    await btn.click();

    console.log('Waiting 200 seconds before checking button state...');
    await new Promise(res => setTimeout(res, 1000));
    await new Promise(res => setTimeout(res, 200000)); // 200 s

    console.log('Checking if START button is re-enabled...');
    await new Promise(res => setTimeout(res, 1000));
    const isButtonEnabled = await page.evaluate((xpath) => {
      const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                          .singleNodeValue;
      return node && !node.disabled;
    }, btnXPath);

    if (isButtonEnabled) {
      console.log('Button is enabled again—verifying errors...');
      await new Promise(res => setTimeout(res, 1000));
      const hasErrors = await page.evaluate(() => !!document.querySelector('.border-red-500'));
      console.log(hasErrors ? 'Detected errors' : 'Completed successfully');
      await sendStatus(hasErrors ? 'ERROR' : 'SUCCESS',
                       hasErrors ? 'Batch had errors' : 'Batch completed');
    } else {
      console.log('Button still disabled after 200s');
      await new Promise(res => setTimeout(res, 1000));
      await sendStatus('ERROR', 'START AUTOMATION button still disabled after 200s');
    }

  } catch (err) {
    console.error('Automation error:', err);
    await sendStatus('ERROR', err.message, { stack: err.stack });
    process.exit(1);
  } finally {
    console.log('Closing browser');
    await new Promise(res => setTimeout(res, 1000));
    await browser.close();
  }
})();
