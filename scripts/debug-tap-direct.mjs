import { launchBrowser } from '../server/browser.js';
import fs from 'fs';

const locator = 'ZN48VF';
const surname = 'ROCHADONASCIMENTO';

console.log(`[DIRECT] Iniciando acesso direto para: ${locator} / ${surname}`);
const browser = await launchBrowser();
const page = await browser.newPage();

const apiCalls = [];
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('api') || url.includes('json') || url.includes('graphql') || response.headers()['content-type']?.includes('application/json')) {
    try {
      const json = await response.json();
      apiCalls.push({ url, status: response.status(), method: response.request().method() });
      console.log(`[API] Encontrada: ${response.request().method()} ${url} (Status: ${response.status()})`);
      // If it looks like a booking response, save it
      if (JSON.stringify(json).includes(locator)) {
         console.log('>>> Possível payload com dados da reserva capturado!');
         fs.writeFileSync('debug-api-response.json', JSON.stringify(json, null, 2));
      }
    } catch (e) {
    }
  }
});

const targetUrl = `https://myb.flytap.com/my-bookings/details/${locator}/${surname}`;
console.log(`Navegando para: ${targetUrl}`);
await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('Timeout on goto'));

await page.waitForTimeout(10000);

await page.screenshot({ path: 'debug-direct-result.png', fullPage: true });

console.log('\n--- APIs Relevantes ---');
apiCalls.forEach(call => console.log(`${call.method} ${call.url} - ${call.status}`));

await browser.close();
console.log('Finalizado.');
