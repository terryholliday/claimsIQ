# STAGE 1: BUILD
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (including devDeps for build)
RUN npm ci 
COPY tsconfig.json ./
COPY src ./src
# Compile TS to JS
RUN npm run build

# STAGE 2: PRODUCTION RUNNER
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package.json again for prod install
COPY package*.json ./
# Install ONLY production dependencies
RUN npm ci --only=production

# Copy compiled source from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -S proveniq && adduser -S claimsiq -G proveniq
USER claimsiq

# Expose API Port
EXPOSE 3000

# Start Command
CMD ["node", "dist/src/api/server.js"]
