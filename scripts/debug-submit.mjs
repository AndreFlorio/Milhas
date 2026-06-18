import { launchBrowser, normalizeLastName } from '../server/browser.js';
import fs from 'fs';

const cases = [
  ['ZN48VF', 'Ananery Rochadonascimento'],
  ['Z8DHYO', 'KEILA MARTINS'],
];

const browser = await launchBrowser();

for (const [locator, lastName] of cases) {
  const surname = normalizeLastName(lastName);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', {
    waitUntil: 'networkidle',
    timeout: 90000,
  });
  await page.waitForTimeout(2000);

  await page.getByText('Utilizar a minha Referência de reserva', { exact: true }).click();
  await page.waitForTimeout(1500);

  for (const [sel, val] of [['#form_input_2', locator], ['#form_input_0', surname]]) {
    await page.locator(sel).click({ force: true });
    await page.locator(sel).fill(val);
  }

  const before = {
    loc: await page.locator('#form_input_2').inputValue(),
    name: await page.locator('#form_input_0').inputValue(),
    disabled: await page.locator('#buttonId_0_0').getAttribute('disabled'),
  };
  console.log(locator, 'before submit:', before);

  await page.locator('#buttonId_0_0').click({ force: true });
  await page.waitForTimeout(8000);

  const body = await page.locator('body').innerText();
  const after = {
    url: page.url(),
    hasError: /não nos está a ser possível|erro:/i.test(body),
    hasTrip: /resumo da viagem|trip summary|passageiro/i.test(body) && !/etapa 1 de 5/i.test(body.split('Identificação')[0] || ''),
  };
  console.log(locator, 'after submit:', after);
  console.log(locator, 'error block:', body.match(/ERRO:[^\n]+/)?.[0] || 'none');
  await page.screenshot({ path: `debug-${locator}.png`, fullPage: true });
  await page.close();
}

await browser.close();
