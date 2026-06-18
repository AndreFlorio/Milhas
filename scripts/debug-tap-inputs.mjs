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

// Click booking reference tab
const refTab = page.locator('text=Utilizar a minha Referência de reserva').first();
if (await refTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  await refTab.click();
  await page.waitForTimeout(1500);
}

// Inspect inputs
const inputInfo = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input')];
  return inputs.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    placeholder: i.placeholder,
    visible: i.offsetParent !== null,
    disabled: i.disabled,
    value: i.value,
    className: i.className,
  }));
});
console.log('Inputs:', JSON.stringify(inputInfo, null, 2));

// Try typing with keyboard
const input0 = page.locator('#form_input_0');
const input1 = page.locator('#form_input_1');

await input0.click({ force: true });
await input0.pressSequentially(locator, { delay: 50 });
await input1.click({ force: true });
await input1.pressSequentially(surname, { delay: 50 });

console.log('After type:', await input0.inputValue(), await input1.inputValue());

// Also try evaluate set value + dispatch events
await page.evaluate(({ loc, sn }) => {
  const i0 = document.querySelector('#form_input_0');
  const i1 = document.querySelector('#form_input_1');
  if (i0) {
    i0.value = loc;
    i0.dispatchEvent(new Event('input', { bubbles: true }));
    i0.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (i1) {
    i1.value = sn;
    i1.dispatchEvent(new Event('input', { bubbles: true }));
    i1.dispatchEvent(new Event('change', { bubbles: true }));
  }
}, { loc: locator, sn: surname });

await page.waitForTimeout(500);
console.log('After evaluate:', await input0.inputValue(), await input1.inputValue());

const btn = page.locator('#buttonId_0_0');
console.log('Button disabled:', await btn.getAttribute('disabled'));

await page.screenshot({ path: 'debug-inputs.png', fullPage: true });
await browser.close();
