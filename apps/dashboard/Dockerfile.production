# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages ./packages

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY apps/dashboard ./apps/dashboard

# Build
RUN pnpm --filter @ghost/dashboard run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
RUN corepack enable && pnpm install --prod --frozen-lockfile

EXPOSE 5900

CMD ["pnpm", "--filter", "@ghost/dashboard", "start"]
