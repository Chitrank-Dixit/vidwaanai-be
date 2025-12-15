# Stage 1: Install dependencies
FROM oven/bun:1 AS dependencies

WORKDIR /app

COPY package.json ./

RUN bun install

# Stage 2: Build and run
FROM oven/bun:1

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json .

COPY src ./src
COPY tsconfig.json .
COPY .env.example .env

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run --eval "const res = await fetch('http://localhost:3001/api/health'); process.exit(res.ok ? 0 : 1)"

CMD ["bun", "run", "src/index.ts"]
