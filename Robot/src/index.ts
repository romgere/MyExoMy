import EventBroker from "./lib/event-broker.js";
import readConfig from "./helpers/read-config.js";

async function main() {
  const config = readConfig();
  const eventBroker = new EventBroker();

  // Create nodes

  // Start them 
}

await main();