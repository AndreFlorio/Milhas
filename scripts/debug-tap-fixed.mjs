import { launchBrowser, normalizeLastName } from '../server/browser.js';

const locator = 'ZN48VF';
const surname = normalizeLastName('Ananery Rochadonascimento');

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(3000);

await page.getByText('Utilizar a minha Referência de reserva', { exact: true }).click();
await page.waitForTimeout(2000);

async function setInput(selector, value) {
  await page.locator(selector).click({ force: true });
  await page.locator(selector).fill('');
  await page.locator(selector).pressSequentially(value, { delay: 30 });
}

await setInput('#form_input_2', locator.toUpperCase());
await setInput('#form_input_0', surname);

console.log('Values:', await page.locator('#form_input_2').inputValue(), await page.locator('#form_input_0').inputValue());
console.log('Button disabled:', await page.locator('#buttonId_0_0').getAttribute('disabled'));

await page.locator('#buttonId_0_0').click({ force: true });
await page.waitForTimeout(10000);

console.log('URL:', page.url());
const body = await page.locator('body').innerText();
console.log('Body:\n', body.slice(0, 2500));
await page.screenshot({ path: 'debug-correct-fields.png', fullPage: true });
await browser.close();
