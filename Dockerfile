# -----------------------------
# Build Stage
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# -----------------------------
# Production Stage
# -----------------------------
FROM node:22-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Copy only the built app and production node_modules
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Create logs directory and set up user
RUN mkdir -p src/logs && \
    yarn cache clean && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 8080

# Command to run the application
CMD ["node", "src/index.js"]
