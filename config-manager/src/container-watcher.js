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
    if (!subdomain) return;

    const ipAddress = containerInfo.NetworkSettings.IPAddress; //gets the IP of the container
    await this.nginxManager.updateConfiguration(subdomain, ipAddress); // genrerates the Nginx config for that container
    logger.info(`🟢 Started: ${subdomain} → ${ipAddress}`);
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
      const containers = await this.docker.listContainers({ all: true });

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
