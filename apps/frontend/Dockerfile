# Simple nginx server serving pre-built frontend
FROM nginx:stable-alpine
RUN apk add jq

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html
EXPOSE 3000

# This will inject environment variables into env.js at runtime
CMD export && \
    echo "window.env = $(jq -n env | grep -E '^(BACKEND_|APP_)')" > /usr/share/nginx/html/env.js && \
    nginx -g 'daemon off;'