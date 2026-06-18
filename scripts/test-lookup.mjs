import { launchBrowser, normalizeLastName } from '../server/browser.js';
import { lookupTapReservation } from '../server/scrapers/tap.js';

const locator = 'ZN48VF';
const lastName = 'Ananery Rochadonascimento';

console.log('Testing lookupTapReservation...');
try {
  const result = await lookupTapReservation(locator, lastName);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Error:', err.message);
}
