
import { startWorker } from "./ledgerListener";

console.log("Initializing ClaimsIQ Settlement Worker...");
startWorker().catch(err => {
    console.error("Fatal Worker Error:", err);
    process.exit(1);
});
