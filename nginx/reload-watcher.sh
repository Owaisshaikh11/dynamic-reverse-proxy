#!/bin/sh

echo "[reload-watcher] Watching for reload signal..."

while true; do
  if [ -f /etc/nginx/trigger-reload ]; then
    echo "[reload-watcher] Reload signal detected. Reloading NGINX..."
    nginx -s reload
    rm /etc/nginx/trigger-reload
  fi
  sleep 2
done
