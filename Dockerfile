# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init

# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 1. Install ONLY Production Dependencies
COPY package*.json ./

RUN npm ci && npm cache clean --force

# 2. Copy Source Code (Be specific!)
COPY --from=builder /app/src ./src

COPY --from=builder /app/server.js ./

# Permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]