import { lookupTapReservation } from './server/scrapers/tap.js';

async function test() {
  try {
    const result = await lookupTapReservation('ZN48VF', 'ROCHADONASCIMENTO');
    console.log('\nFINAL RESULT:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\nERROR:', error);
  }
}

test();
