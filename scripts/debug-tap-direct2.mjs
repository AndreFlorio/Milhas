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
      const method = response.request().method();
      apiCalls.push({ url, status: response.status(), method });
      
      if (url.includes('pnrs/search')) {
         console.log(`\n\n>>> Encontrou chamada pnrs/search!`);
         console.log(`Request URL: ${url}`);
         console.log(`Request Headers:`, response.request().headers());
         console.log(`Request PostData:`, response.request().postData());
         console.log(`Response Status:`, response.status());
         console.log(`Response Headers:`, response.headers());
         fs.writeFileSync('debug-pnrs-search-response.json', JSON.stringify(json, null, 2));
         fs.writeFileSync('debug-pnrs-search-request.txt', `URL: ${url}\nMethod: ${method}\nHeaders: ${JSON.stringify(response.request().headers(), null, 2)}\nBody: ${response.request().postData()}`);
      }
    } catch (e) {
    }
  }
});

const targetUrl = `https://myb.flytap.com/my-bookings/details/${locator}/${surname}`;
console.log(`Navegando para: ${targetUrl}`);
await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('Timeout on goto'));

await page.waitForTimeout(10000);

await browser.close();
console.log('Finalizado.');
