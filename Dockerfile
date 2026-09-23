# --- Build Stage ---
FROM node:24-alpine AS builder

WORKDIR /app


COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies required for build)
RUN npm ci

# Copy application source
COPY . .

# Build Nuxt application
# This variable could be empty, but having some value helps during debugging.
ENV NUXT_LOGISTICSHUB_BACKEND_API_BASE='STUB-backend-api-for-build-time'
RUN npm run build

# --- Production Stage ---
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment variables for Nitro
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy bundled standalone output from builder stage
COPY --from=builder /app/.output ./.output

# Expose HTTP port
EXPOSE 3000

# Use non-root node user for enhanced security
USER node

# Run the Nitro server
CMD ["node", ".output/server/index.mjs"]