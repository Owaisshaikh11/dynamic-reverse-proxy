const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const logger = require("./logger");
require("dotenv").config();

class NginxManager {
  constructor() {
    this.templatePath = "/etc/nginx/manual-templates/upstream.conf.template"; // inside Docker
    this.configPath = "/etc/nginx/conf.d"; // live config dir
    this.dnsApiUrl = process.env.DNS_API_URL || "http://dns-server:3000";
  }
  async updateConfiguration(subdomain, containerIp, port = 3000) {
    try {
      const template = await fs.readFile(this.templatePath, "utf8");
      const config = template //replacing string with regex. ressults in Nginx config block for that user/container.
        .replace(/{{subdomain}}/g, subdomain)
        .replace(/{{container_ip}}/g, containerIp)
        .replace(/{{port}}/g, port);

      const configFile = path.join(this.configPath, `${subdomain}.conf`); // building the path to the config file
      await fs.writeFile(configFile, config);

      await this.reloadNginx();
      await this.updateDnsRecord(subdomain, containerIp);

      logger.info(`✅ NGINX config updated for ${subdomain}`);
    } catch (err) {
      logger.error("❌ Failed to update NGINX config:", err);
    }
  }
  async reloadNginx() {
  try {
      // Create reload trigger file inside shared volume
      await fs.writeFile('/etc/nginx/conf.d/../trigger-reload', '');
      logger.info(`🔄 Requested NGINX reload`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to trigger NGINX reload: ${error}`);
      return false;
    }
  
}

  async updateDnsRecord(subdomain, ipAddress) {
    try {
      await axios.post(`${this.dnsApiUrl}/api/dns/subdomains`, {
        // POST request to DNS API to update the record
        subdomain,
        domain: "ide.local",
        ipAddress,
        ttl: 3600,
      });
      logger.info(`📡 DNS updated forr ${subdomain}`);
    } catch (err) {
      logger.error("❌ DNS update failed:", err.message);
    }
  }
}
module.exports = NginxManager;
