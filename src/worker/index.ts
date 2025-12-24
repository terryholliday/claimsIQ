
import { startWorker } from './ledgerListener';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

console.log('='.repeat(50));
console.log(' PROVENIQ CLAIMSIQ - ADJUDICATION WORKER');
console.log('='.repeat(50));

startWorker().catch(err => {
    console.error('Fatal Worker Error:', err);
    process.exit(1);
});
