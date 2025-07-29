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
        category: 'GitHub Action E2E',
        details
      }),
    });
    console.log(`Status sent: ${level} - ${message}`);
  } catch (err) {
    console.error('Webhook send failed:', err);
  }
}

(async () => {
  if (!APP_URL || !APP_PASSWORD) {
    console.error('APP_URL or APP_PASSWORD missing');
    await sendStatus('ERROR', 'Missing required environment variables');
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${APP_URL} ...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    console.log('Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.type('input[type="password"]', APP_PASSWORD);
    await page.click('button[type="submit"]');

    const buttonXPath = "//h2[text()='Generate Post Batch']/following-sibling::div/button";
    console.log('Waiting for the automation button...');
    await page.waitForSelector(`xpath/${buttonXPath}`, { timeout: 60000 });

    const [button] = await page.$x(buttonXPath);
    if (!button) {
        throw new Error('Automation button not found using XPath.');
    }
    
    console.log('Clicking the automation button...');
    await button.click();

    console.log('Automation started. Waiting for completion (button to be re-enabled)...');
    // Wait for the button to no longer be disabled. This is more robust than checking for text.
    await page.waitForFunction(
      (xpath) => {
        const buttonElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        // The button must exist and not be disabled.
        return buttonElement && !buttonElement.disabled;
      },
      { timeout: 900000 }, // 15 minutes timeout
      buttonXPath
    );
    console.log('Automation process appears to be complete.');

    const hasErrors = await page.evaluate(() => !!document.querySelector('.border-red-500'));
    console.log(hasErrors ? 'Detected errors during run.' : 'Automation process completed successfully.');

    await sendStatus(hasErrors ? 'ERROR' : 'SUCCESS', hasErrors ? 'Batch completed with one or more errors.' : 'Batch completed successfully.');
  } catch (err) {
    console.error('E2E automation script failed:', err);
    await sendStatus('ERROR', err.message, { stack: err.stack });
    process.exit(1);
  } finally {
    console.log('Closing browser.');
    await browser.close();
  }
})();
