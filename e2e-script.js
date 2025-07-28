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
    console.log(`Status sent: ${level}`);
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
    const automationUrl = new URL(APP_URL);
    automationUrl.searchParams.set('password', APP_PASSWORD);
    automationUrl.searchParams.set('action', 'start');
    
    console.log(`Navigating to automation URL to start the process...`);
    await page.goto(automationUrl.href, { waitUntil: 'networkidle0', timeout: 60000 });

    const btnXPath = "//button[contains(., 'START AUTOMATION') or contains(., 'PROCESSING')]";
    console.log('Waiting for automation process to complete...');
    
    // Wait for the button to appear on the page
    await page.waitForSelector(`xpath/${btnXPath}`, { timeout: 60000 });
    
    // Wait for the button to become enabled again, which signifies completion.
    await page.waitForSelector(`xpath/${btnXPath}[not(@disabled)]`, { timeout: 900000 }); // 15 minute timeout

    console.log('Automation process has completed.');

    // Check for errors in the final state by looking for a task with 'Error' status.
    const hasErrors = await page.evaluate(() => !!document.querySelector('.border-red-500[data-status="Error"]'));
    if (hasErrors) {
      console.log('Detected errors on one or more tasks.');
      await sendStatus('ERROR', 'Batch completed with errors');
    } else {
      console.log('Batch completed successfully.');
      await sendStatus('SUCCESS', 'Batch completed successfully');
    }

  } catch (err) {
    console.error('Automation error:', err);
    await sendStatus('ERROR', err.message, { stack: err.stack });
    process.exit(1);
  } finally {
    console.log('Closing browser');
    await browser.close();
  }
})();
