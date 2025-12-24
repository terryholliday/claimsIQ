# ============================================
# PROVENIQ CLAIMSIQ - DOCKERFILE
# Enterprise Claims Intelligence Engine
# ============================================

# STAGE 1: BUILD
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# STAGE 2: RUNNER
FROM node:20-alpine AS runner
WORKDIR /app

# Production environment
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Security: Run as non-root user
RUN addgroup -S proveniq && adduser -S claimsiq -G proveniq
USER claimsiq

# ClaimsIQ runs on 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
