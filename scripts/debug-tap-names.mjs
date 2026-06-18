import { launchBrowser, normalizeLastName } from '../server/browser.js';

const locator = 'ZN48VF';
const variants = [
  'ROCHADONASCIMENTO',
  'Rochadonascimento',
  'Ananery Rochadonascimento',
  'ROCHA',
  'DONASCIMENTO',
  'NASCIMENTO',
];

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

for (const lastName of variants) {
  await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', {
    waitUntil: 'networkidle',
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
  await page.getByText('Utilizar a minha Referência de reserva', { exact: true }).click();
  await page.waitForTimeout(1500);

  const surname = normalizeLastName(lastName) === lastName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    ? lastName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : normalizeLastName(lastName);

  await page.locator('#form_input_2').fill(locator);
  await page.locator('#form_input_0').fill(surname);
  await page.locator('#buttonId_0_0').click();
  await page.waitForTimeout(6000);

  const body = await page.locator('body').innerText();
  const ok = !body.includes('Não nos está a ser possível') && !body.includes('ERRO:');
  const onNext = !page.url().includes('identification') || body.includes('Resumo da viagem') || body.includes('RESUMO DA VIAGEM');
  console.log(JSON.stringify({ lastName, surname, ok, onNext, url: page.url(), snippet: body.slice(0, 200).replace(/\n/g, ' ') }));
}

await browser.close();
