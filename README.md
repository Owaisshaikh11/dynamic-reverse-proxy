# Dynamic Reverse Proxy 

- A fully automated reverse proxy and DNS management syystem for containerized development environment.
- Designed mainly to be used in my cloud IDE project. This project enables dynamic subdomain routing to Docker containerrs.
- It is fully integrated with a custom-buiilt DNS server that i built which dynamically updates subdomain records. You can check out the DNS server here:
  Custom DNS Server Repo: <https://github.com/Owaisshaikh11/custom-dns-server>
- I'm working on this as a personal project to learn and use in another project I'm working on,
- Let me know if I made any mistakes I'd really appreciate it ✨

---

## Features

- **Dynamic Reverse Proxy**: Ngiinx automatically routes subdomains (like, `user.ide.local`) to the correct running container.
- **Automatic Nginx Config Generation**: As containers start/stop, configs are created/removed in real time.
- **Custom DNS Server**: RESTful API for dynamic subdomain management, with DNS records updated on-the-fly.
- **Docker Event Watcher**: Listens for container lifecycle events to trigger config and DNS updates
- **Label-based Routing**: Assign subdomains to containers using Docker labels (e.g., `ide.subdomain: testuser`).
- **Health Checks**: Built-in health endpoints for Nginx and test apps.
- **Centralized Logging**: Winston-based logging to console and files.
- **Easy Local Development**: All services orchestrated via Docker Compose.

---

## Architecture

```
+-------------------+        +-------------------+        +-------------------+
|   User Browser    | <----> |      Nginx        | <----> |   Docker Network  |
+-------------------+        +-------------------+        +-------------------+
                                         ^
                                         |
                                 +-------------------+
                                 |  Config Manager   |
                                 +-------------------+
                                         |
                                 +-------------------+
                                 |   DNS Server      |
                                 +-------------------+
```

- **Nginx**: Routes requests to containers based on subdomain.
- **Config Manager**: Watches Docker events, updates Nginx configs, and manages DNS records.
- **DNS Server**: Custom server with REST API for dynamic subdomain management.

---

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Owaisshaikh11/dynamic-reverse-proxy
   cd dynamic-reverse-proxy
   ```

2. **Build and start all services:**

   ```sh
   docker-compose up --build
   ```

   - Nginx listens on port `80`.
   - DNS HTTP API on port `8053` (UDP DNS on `5354`).
   - Test app on dynamic subdomain (e.g., `testuser.ide.local`).

---

## Usage

- **Add a new app:**
  - Add a new service to `docker-compose.yml` with a unique `ide.subdomain` label.
  - The config manager will auto-generate Nginx and DNS configs.
- **Access your app:**
  - Visit `http://<subdomain>.ide.local` in your browser (ensure your system DNS points to the custom DNS server, or add a hosts entry for testing).
- **Logs:**
  - Logs are stored in the `logs/` directory and output to the console.

---

## Configuration

- **Nginx templates:**
  - Located in `nginx/manual-templates/upstream.conf.template`.
- **Nginx configs:**
  - Generated in `nginx/conf.d/`.
- **DNS server:**
  - Expects records in a JSON file (see your DNS server project for details).
- **Environment variables:**
  - `DNS_API_URL` (used by config-manager, default: `http://dns-server:8053`).

---

## API Endpoints

### DNS Server (REST API)

- **List subdomains:**
  - `GET /api/dns/subdomains`
- **Add subdomain:**
  - `POST /api/dns/subdomains` `{ subdomain, domain, ipAddress, ttl }`
- **Remove subdomain:**
  - `DELETE /api/dns/subdomains` `{ subdomain, domain }`
- **List all DNS records:**
  - `GET /api/dns/records`

### Config Manager

- No direct API, operates via Docker events and updates Nginx/DNS automatically.

---

## Project Structure

```
dynamic-reverse-proxy/
├── config-manager/           # Watches Docker, manages Nginx & DNS
│   ├── src/
│   │   ├── container-watcher.js
│   │   ├── nginx-manager.js
│   │   ├── logger.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── nginx/                   # Nginx reverse proxy
│   ├── conf.d/              # Generated configs
│   ├── manual-templates/    # Nginx config templates
│   ├── nginx.conf           # Main config
│   ├── reload-watcher.sh    # Watches for reload trigger
│   └── Dockerfile
├── test-app/                # Example app (auto-routed)
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # Orchestration
├── logs/                    # Log files
└── README.md                # Project documentation
```

---

## Limitations

- **DNS server is No production ready**: The custom DNS server is basic and intended for development/learning, No persistence for dynamic DNS records all changes are lost on DNS server restart,No authentication or access control on the DNS API,Only supports UDP for DNS queries (no TCP fallback),Limited IPv6 support and basic validation
- **No HTTPS**: Only HTTP is supported out of the box. can add certbot or similar for HTTPS.
- **Local DNS setup required**: You must point your system or browser to use the custom DNS server for subdomain resolution.
- **No authentication or authorization (for now)**: Anyone on the network can access subdomains if DNS is configured.
- **No persistence for Proxy/DNS State (for now)**: Nginx configs and DNS records are generated dynamically,but DNS records are not persisted.If the DNS server or config-manager restarts, dynamic subdomains may be lost unless containers are still running and re-synced.
- **Liimited Error Handling and Validation**: Minimal input valiidation in the DNS API and config-manager.Malformed requests or unexpected Docker events may cause errors.

---

## Licensee

MIT License. See [LICENSE](LICENSE) for details.

---

## Credits

- Inspired by cloud IDE platforms and dynamic proxy architectures.
- Author: Owais Shaikh <https://github.com/Owaisshaikh11>

<!-- badges -->
![Node](https://img.shields.io/badge/Node.js-18%2B-green)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![Nginx](https://img.shields.io/badge/Nginx-reverse--proxy-brightgreen)
![Express](https://img.shields.io/badge/Express.js-5.x-red)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-lightgrey)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
