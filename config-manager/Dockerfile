FROM nginx:alpine

RUN apk add --no-cache curl

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY templates/ /etc/nginx/manual-templates/
COPY conf.d/ /etc/nginx/conf.d/

RUN mkdir -p /etc/nginx/conf.d

HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/health || exit 1
