FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default welcome config
RUN rm /etc/nginx/conf.d/default.conf

# Copy main config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy template to safe location
COPY manual-templates/ /etc/nginx/manual-templates/

# Create config directory
RUN mkdir -p /etc/nginx/conf.d

#reload-watcher starting
COPY reload-watcher.sh /reload-watcher.sh
RUN chmod +x /reload-watcher.sh

CMD ["/bin/sh", "-c", "/reload-watcher.sh & nginx -g 'daemon off;'"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/health || exit 1
