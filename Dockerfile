# -----------------------------
# Build Stage
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# -----------------------------
# Production Stage
# -----------------------------
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /usr/src/app

# Copy only necessary files from builder stage
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/src ./src

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean && \
    # Create logs directory
    mkdir -p src/logs && \
    # Add a non-root user for security
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    # Set directory permissions
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "src/index.js"]
