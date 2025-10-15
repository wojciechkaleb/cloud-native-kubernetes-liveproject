FROM node:22-alpine3.21

WORKDIR /opt/sns

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /opt/sns/logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sns -u 1001

# Change ownership of the app directory
RUN chown -R sns:nodejs /opt/sns

# Switch to non-root user
USER sns

# Expose port
EXPOSE 3001


# Start the application
CMD ["node", "server.js"]
