const ContainerWatcher = require("./container-watcher");
const logger = require("./logger");

async function main() {
  try {
    const watcher = new ContainerWatcher();
    await watcher.start();
  } catch (err) {
    logger.error("❌ Failed to start config manager:", err.message);
    process.exit(1);
  }
}

main();
