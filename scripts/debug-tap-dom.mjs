import { launchBrowser } from '../server/browser.js';

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

const dom = await page.evaluate(() => {
  const panel = document.querySelector('#form_input_0')?.closest('.panel, .collapse, .accordion-body, [class*="panel"], section, form, div');
  const container = document.querySelector('#form_input_0')?.closest('div');
  function describe(el, depth = 0) {
    if (!el || depth > 8) return null;
    return {
      tag: el.tagName,
      id: el.id,
      class: el.className?.toString?.().slice(0, 120),
      text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent?.trim().slice(0, 60) : undefined,
      inputs: [...el.querySelectorAll(':scope > input, :scope > label')].map(i => ({ tag: i.tagName, id: i.id, text: i.textContent?.trim().slice(0, 40), for: i.getAttribute('for') })),
      children: [...el.children].slice(0, 8).map(c => describe(c, depth + 1)).filter(Boolean),
    };
  }
  const allInputs = [...document.querySelectorAll('input')].map(i => {
    const label = i.id ? document.querySelector(`label[for="${i.id}"]`) : null;
    const parentText = i.parentElement?.textContent?.trim().slice(0, 100);
    return {
      id: i.id,
      visible: i.offsetParent !== null,
      rect: i.getBoundingClientRect(),
      label: label?.textContent?.trim(),
      parentText,
      aria: i.getAttribute('aria-label'),
    };
  });
  return { allInputs, tree: describe(container) };
});

console.log(JSON.stringify(dom, null, 2));
await page.screenshot({ path: 'debug-expanded.png', fullPage: true });
await browser.close();
