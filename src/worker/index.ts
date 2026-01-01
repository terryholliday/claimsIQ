
import { startWorker } from './ledgerListener';

// dotenv import removed for cloud build

console.log('='.repeat(50));
console.log(' PROVENIQ CLAIMSIQ - ADJUDICATION WORKER');
console.log('='.repeat(50));

startWorker().catch(err => {
    console.error('Fatal Worker Error:', err);
    process.exit(1);
});
