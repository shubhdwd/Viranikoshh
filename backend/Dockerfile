# Viranikosh backend — runs the TypeScript server directly via tsx.
FROM node:20-slim

WORKDIR /app

# Prisma's query engine needs OpenSSL on Debian slim images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (devDeps included — tsx and the Prisma CLI are needed at runtime).
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and generate the Prisma client.
COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5000

# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
