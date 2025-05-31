const Docker = require("dockerode");
const fs = require("fs").promises;
const NginxManager = require("./nginx-manager");
const logger = require("./logger");
class ContainerWatcher {
  constructor() {
    this.docker = new Docker(); // Connects to Docker socket
    this.nginxManager = new NginxManager(); // Manages NGiNX configuration
  }
  async start() {
    try {
      const eventStream = await this.docker.getEvents(); // Subscribes to Docker events like die,sstart etc.

      eventStream.on("data", async (chunk) => {
        const event = JSON.parse(chunk.toString()); // Parsing the event data
        await this.handleContainerEvent(event);
      });

      await this.syncExistingContainers(); // Syncing existing containers with Nginx

      logger.info("🚀 Docker event watcher started");
    } catch (err) {
      logger.error("❌ Failed to start watcher:", err.message);
    }
  }
  async handleContainerEvent(event) {
    if (event.Type !== "container") return; // only handle container events

    try {
      const container = this.docker.getContainer(event.id);
      const info = await container.inspect();

      if (event.Action === "start") {
        await this.handleContainerStart(info);
      } else if (event.Action === "die") {
        await this.handleContainerStop(info);
      }
    } catch (err) {
      logger.error("❌ Failed to handle event:", err.message);
    }
  }

  async handleContainerStart(containerInfo) {
    const subdomain = containerInfo.Config.Labels["ide.subdomain"];
    if (!subdomain) return; // if no subdomain label, skippp

    /* Get the correct network name (from docker-compose),
     or fallback to the first network if not found */
    const networkName =
      Object.keys(containerInfo.NetworkSettings.Networks).find((name) =>
        name.includes("ide-network")
      ) || Object.keys(containerInfo.NetworkSettings.Networks)[0];

    const ipAddress =
      containerInfo.NetworkSettings.Networks[networkName]?.IPAddress;
    if (!ipAddress) {
      this.logger.error(`⚠️ Couldd not get IP for ${subdomain}`);
      return;
    }

    // Try to detect the exposed port, fallback to 80
    let port = 80;
    const exposedPorts = containerInfo.Config.ExposedPorts;
    if (exposedPorts) {
      const firstPort = Object.keys(exposedPorts)[0];
      if (firstPort) {
        port = parseInt(firstPort.split("/")[0], 10);
      }
    }

    await this.nginxManager.updateConfiguration(subdomain, ipAddress, port); // updates Nginx config

    logger.info(`🟢 Started: ${subdomain} → ${ipAddress}:${port}`);
  }

  async handleContainerStop(containerInfo) {
    const subdomain = containerInfo.Config.Labels["ide.subdomain"];
    if (!subdomain) return;

    try {
      const configPath = `/etc/nginx/conf.d/${subdomain}.conf`;
      await fs.unlink(configPath);
      await this.nginxManager.reloadNginx();

      logger.info(`🔴 Stopped: ${subdomain} → config removed`);
    } catch (err) {
      logger.error(
        "❌ Failed to remove config for stopped container:",
        err.message
      );
    }
  }
  async syncExistingContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true }); // listing all containers including stopped ones

      for (const container of containers) {
        if (container.Labels["ide.subdomain"]) {
          const info = await this.docker.getContainer(container.Id).inspect();
          await this.handleContainerStart(info);
        }
      }

      logger.info("🔁 Synced existing containers");
    } catch (err) {
      logger.error("❌ Sync failed:", err.message);
    }
  }
}
module.exports = ContainerWatcher;
