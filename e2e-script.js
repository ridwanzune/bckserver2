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
    // --- Step 1: Navigate to the main page and log in ---
    console.log(`Navigating to the main page: ${APP_URL}`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 60000 });
    
    console.log('Waiting for password screen...');
    await page.waitForSelector('input#password', { timeout: 30000 });
    
    console.log('Entering password...');
    await page.type('input#password', APP_PASSWORD);
    
    console.log('Clicking unlock...');
    await page.click('button[type="submit"]');

    // --- Step 2: Start the automation process ---
    const startBtnXPath = "//button[contains(., 'START AUTOMATION')]";
    console.log('Waiting for main application screen...');
    await page.waitForSelector(`xpath/${startBtnXPath}`, { visible: true, timeout: 30000 });
    
    console.log('Clicking START AUTOMATION button...');
    await page.click(`xpath/${startBtnXPath}`);

    // --- Step 3: Wait for the automation to complete ---
    const processingBtnXPath = "//button[contains(., 'AUTOMATION') or contains(., 'PROCESSING')]";
    console.log('Automation started. Waiting for completion...');
    
    // Wait for the button to become enabled again, which signifies completion.
    await page.waitForSelector(`xpath/${processingBtnXPath}[not(@disabled)]`, { timeout: 900000 }); // 15 minute timeout

    console.log('Automation process has completed.');
    
    console.log('Waiting an additional 5 seconds for UI to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // --- Step 4: Check the result ---
    // The run is successful if at least one piece of content was generated.
    const hasSuccess = await page.evaluate(() => !!document.querySelector('[data-status="Done"]'));

    if (hasSuccess) {
      console.log('Batch completed with at least one successful task.');
      await sendStatus('SUCCESS', 'Batch completed successfully.');
    } else {
      console.log('Detected that no tasks completed successfully.');
      await sendStatus('ERROR', 'Batch completed with no successful content.');
    }

  } catch (err) {
    console.error('E2E script automation error:', err);
    await sendStatus('ERROR', `E2E script failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  } finally {
    console.log('Closing browser');
    await browser.close();
  }
})();
