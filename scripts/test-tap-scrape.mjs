import { chromium } from 'playwright';

const locator = 'ZN48VF';
const lastName = 'ROCHADONASCIMENTO';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);

await page.locator('#form_input_0').fill(locator, { force: true });
await page.locator('#form_input_1').fill(lastName, { force: true });
await page.locator('button:has-text("Identificar")').first().click({ force: true });

await page.waitForTimeout(8000);
console.log('After submit URL:', page.url());
const text = await page.locator('body').innerText();
console.log(text.slice(0, 3000));

await page.screenshot({ path: 'tap-result.png', fullPage: true });
await browser.close();
