# Multi-stage Dockerfile for Cable Scanner PWA (TanStack Start + Vite)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definition
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build application bundle
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

# Copy application and built artifacts
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 5173

CMD ["npx", "vite", "dev", "--host", "0.0.0.0", "--port", "5173"]
