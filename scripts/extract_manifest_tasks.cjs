
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'arkive_auctions_phase_1.json');
const targetPath = path.join(__dirname, 'arkive_auction_manifest_integration.json');

try {
    const data = fs.readFileSync(sourcePath, 'utf8');
    const jsonData = JSON.parse(data);
    const relevantTasks = [];

    for (const [agentKey, agent] of Object.entries(jsonData.agents)) {
        for (const task of agent.tasks) {
            const textRef = (task.title + " " + task.description).toLowerCase();
            if (
                textRef.includes('truemanifest') ||
                textRef.includes('myark') ||
                textRef.includes('trueledger')
            ) {
                relevantTasks.push({
                    ...task,
                    assigned_agent: agent.agent_name,
                    agent_key: agentKey
                });
            }
        }
    }

    const output = {
        source: "ARKIVE Auctions Phase 1",
        extraction_reason: "Integration with TrueManifest/MyARK/TrueLedger",
        tasks: relevantTasks
    };

    fs.writeFileSync(targetPath, JSON.stringify(output, null, 2));
    console.log(`Successfully extracted ${relevantTasks.length} tasks to ${targetPath}`);

} catch (error) {
    console.error('Error processing tasks:', error);
    process.exit(1);
}
