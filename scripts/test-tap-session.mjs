import { launchBrowser } from '../server/browser.js';
import fs from 'fs';

const locator = 'ZN48VF';
const surname = 'ROCHADONASCIMENTO';

console.log(`[DIRECT] Iniciando acesso direto para: ${locator} / ${surname}`);
const browser = await launchBrowser();
const page = await browser.newPage();

page.on('request', request => {
  const url = request.url();
  if (url.includes('session/create')) {
     console.log('>>> Request to session/create');
     console.log(request.method());
     console.log(request.headers());
     console.log(request.postData());
  }
});
page.on('response', async response => {
  const url = response.url();
  if (url.includes('session/create')) {
     console.log('>>> Response from session/create');
     console.log(response.status());
     console.log(response.headers());
     try {
       console.log(await response.text());
     } catch (e) {}
  }
});

const targetUrl = `https://myb.flytap.com/my-bookings/details/${locator}/${surname}`;
console.log(`Navegando para: ${targetUrl}`);
await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('Timeout on goto'));

await browser.close();
console.log('Finalizado.');
