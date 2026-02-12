# Production Stage ONLY
# Note: You MUST run 'npm run build' locally before building this image
FROM nginx:alpine

# Copy local dist folder to container
COPY ./dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
