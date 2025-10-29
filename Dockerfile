FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy entrypoint script first (before user switch)
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create a non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -u 1001 -G nodejs -s /bin/sh -D strapi

# Copy application files and set ownership in one layer
COPY --chown=strapi:nodejs . .

# Create .tmp directory
RUN mkdir -p .tmp && chown -R strapi:nodejs .tmp

USER strapi

# Set environment variables
ENV NODE_ENV=development \
    HOST=0.0.0.0 \
    PORT=1337

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 1337) + '/_health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application in production mode
ENTRYPOINT ["docker-entrypoint.sh"]
