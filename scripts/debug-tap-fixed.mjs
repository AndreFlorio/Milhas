import { launchBrowser, normalizeLastName } from '../server/browser.js';
import fs from 'fs';

const locator = 'ZN48VF';
const surname = normalizeLastName('Ananery Rochadonascimento');

console.log(`[1] Iniciando scraper para localizador: ${locator}, sobrenome: ${surname}`);
const browser = await launchBrowser();
const page = await browser.newPage();

// Monitorar requisições de rede
const apiCalls = [];
page.on('response', async (response) => {
  const url = response.url();
  // check if it's a JSON or API call
  if (url.includes('/api/') || url.includes('json') || url.includes('graphql') || url.includes('/v1/') || url.includes('/v2/') || response.headers()['content-type']?.includes('application/json')) {
    try {
      const json = await response.json();
      apiCalls.push({ url, status: response.status(), data: json });
      console.log(`[NETWORK] Possível API encontrada: ${url} (Status: ${response.status()})`);
    } catch (e) {
      // Not JSON or cannot be parsed
    }
  }
});

await page.setViewportSize({ width: 1280, height: 900 });

console.log('[2] Navegando para a página da TAP...');
await page.goto('https://checkin.si.amadeus.net/static/PRD/TP/#/identification', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
console.log('[2] Página carregada.');

await page.waitForTimeout(3000);

// Verificar shadow DOM ou iframes
const iframes = page.frames().length;
console.log(`[3] Número de frames na página: ${iframes}`);

console.log('[4] Tirando screenshot inicial...');
await page.screenshot({ path: 'debug-01-inicial.png', fullPage: true });

console.log('[5] Expandindo accordion "Utilizar a minha Referência de reserva"...');
const accordionBtn = page.getByText('Utilizar a minha Referência de reserva', { exact: true });
await accordionBtn.waitFor({ state: 'visible', timeout: 10000 });
await accordionBtn.click();
await page.waitForTimeout(2000);

console.log('[6] Tirando screenshot após expandir o accordion...');
await page.screenshot({ path: 'debug-02-accordion.png', fullPage: true });

console.log('[7] Verificando IDs dinâmicos e campos...');
const locatorInput = page.locator('#form_input_2');
const surnameInput = page.locator('#form_input_0');

await locatorInput.waitFor({ state: 'visible', timeout: 10000 });
await surnameInput.waitFor({ state: 'visible', timeout: 10000 });

console.log('[8] Preenchendo campos...');
await locatorInput.click({ force: true });
await locatorInput.fill('');
await locatorInput.pressSequentially(locator.toUpperCase(), { delay: 30 });

await surnameInput.click({ force: true });
await surnameInput.fill('');
await surnameInput.pressSequentially(surname, { delay: 30 });

const locatorVal = await locatorInput.inputValue();
const surnameVal = await surnameInput.inputValue();
console.log(`[9] Valores preenchidos: Localizador="${locatorVal}", Sobrenome="${surnameVal}"`);

console.log('[10] Tirando screenshot após preencher campos...');
await page.screenshot({ path: 'debug-03-preenchido.png', fullPage: true });

const identifyBtn = page.locator('#buttonId_0_0');
const btnDisabled = await identifyBtn.getAttribute('disabled');
console.log(`[11] Estado do botão "Identificar": disabled=${btnDisabled}`);

console.log('[12] Aguardando botão ficar habilitado (se necessário) e clicando...');
await page.locator('body').click({ force: true });
await page.waitForTimeout(1000);
await identifyBtn.waitFor({ state: 'visible' });

await page.screenshot({ path: 'debug-04-antes-clique.png', fullPage: true });

console.log('[13] Clicando no botão...');
try {
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('identification') || resp.url().includes('/api/') || resp.url().includes('/api'), { timeout: 30000 }).catch(() => console.log('Timeout waiting for response after click')),
    identifyBtn.click({ force: true })
  ]);
} catch (e) {
  console.log('Erro ao clicar no botão:', e);
}

console.log('[14] Aguardando carregamento do resultado (rede)...');
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(5000);

console.log('[15] Tirando screenshot após clicar em Identificar...');
await page.screenshot({ path: 'debug-05-resultado.png', fullPage: true });

console.log('[16] Coletando URLs e HTML...');
console.log('URL atual:', page.url());

// Verificar blocos de sucesso ou erro
const bodyHTML = await page.locator('body').innerHTML();
fs.writeFileSync('debug-body-resultado.html', bodyHTML);
console.log('[17] HTML do body salvo em debug-body-resultado.html');

console.log('\n--- APIs Encontradas ---');
if (apiCalls.length > 0) {
  apiCalls.forEach(call => {
    console.log(`\nURL: ${call.url} (Status: ${call.status})`);
    console.log(`Dados (resumo): ${JSON.stringify(call.data).substring(0, 500)}...`);
  });
} else {
  console.log('Nenhuma chamada de API JSON identificada.');
}

await browser.close();
console.log('Finalizado.');
