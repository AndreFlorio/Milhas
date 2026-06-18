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

async function visible(id) {
  return page.evaluate((i) => {
    const el = document.querySelector(i);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { visible: el.offsetParent !== null && r.width > 0 && r.height > 0, value: el.value };
  }, id);
}

console.log('Initial:', await visible('#form_input_0'), await visible('#form_input_1'));

// Expand booking reference accordion
const header = page.locator('button:has-text("Utilizar a minha Referência de reserva"), [role="button"]:has-text("Utilizar a minha Referência de reserva"), .accordion-toggle:has-text("Referência de reserva")').first();
const altHeader = page.getByText('Utilizar a minha Referência de reserva', { exact: true });
await altHeader.click();
await page.waitForTimeout(2000);
console.log('After click ref:', await visible('#form_input_0'), await visible('#form_input_1'));

// Try clicking again if input1 not visible
if (!(await visible('#form_input_1'))?.visible) {
  await altHeader.click();
  await page.waitForTimeout(1500);
  console.log('After 2nd click:', await visible('#form_input_0'), await visible('#form_input_1'));
}

// List labels near inputs
const labels = await page.evaluate(() =>
  [...document.querySelectorAll('label, .form-label, .control-label, span')].slice(0, 40).map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().slice(0, 80),
    for: el.getAttribute('for'),
  }))
);
console.log('Labels sample:', labels.filter(l => l.text && l.text.length > 2).slice(0, 15));

// Fill visible inputs using evaluate with angular trigger
await page.evaluate(({ loc, sn }) => {
  function setNgValue(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    const scope = window.angular?.element(input).scope?.();
    if (scope) {
      scope.$apply(() => {
        scope.ngModel = value;
      });
    }
  }
  const i0 = document.querySelector('#form_input_0');
  const i1 = document.querySelector('#form_input_1');
  if (i0) setNgValue(i0, loc);
  if (i1) setNgValue(i1, sn);
}, { loc: locator, sn: surname });

await page.waitForTimeout(1000);
console.log('Values:', await visible('#form_input_0'), await visible('#form_input_1'));

const btnDisabled = await page.locator('#buttonId_0_0').getAttribute('disabled');
console.log('Button disabled:', btnDisabled);

if (btnDisabled === null) {
  await page.locator('#buttonId_0_0').click();
  await page.waitForTimeout(8000);
  console.log('URL:', page.url());
  console.log('Body:', (await page.locator('body').innerText()).slice(0, 1500));
}

await page.screenshot({ path: 'debug-accordion.png', fullPage: true });
await browser.close();
