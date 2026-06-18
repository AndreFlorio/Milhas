import { launchBrowser, normalizeLastName } from '../server/browser.js';

const locator = process.argv[2] || 'ZN48VF';
const lastName = process.argv[3] || 'Ananery Rochadonascimento';
const surname = normalizeLastName(lastName);
console.log('Locator:', locator, '| Surname:', surname);

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(5000);

for (const sel of [
  'text=Utilizar a minha Referência de reserva',
  'text=Referência de reserva',
]) {
  try {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 })) {
      console.log('Clicking:', sel);
      await el.click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch { /* next */ }
}

await page.locator('#form_input_0').waitFor({ state: 'attached', timeout: 15000 });
await page.locator('#form_input_0').fill(locator.toUpperCase(), { force: true });
await page.locator('#form_input_1').fill(surname, { force: true });

console.log('Form values:', await page.locator('#form_input_0').inputValue(), await page.locator('#form_input_1').inputValue());
await page.screenshot({ path: 'debug-before-submit.png', fullPage: true });

const submitBtn = page.locator('button:has-text("Identificar")').first();
console.log('Submit visible:', await submitBtn.isVisible());
await submitBtn.click({ force: true });

await page.waitForTimeout(8000);
console.log('URL after submit:', page.url());
const bodyText = await page.locator('body').innerText();
console.log('Body preview:\n', bodyText.slice(0, 2000));
await page.screenshot({ path: 'debug-after-submit.png', fullPage: true });

await browser.close();
