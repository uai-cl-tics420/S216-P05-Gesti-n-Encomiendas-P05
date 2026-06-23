FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate

EXPOSE 3000
ENV NODE_ENV=production

CMD DATABASE_URL=$DATABASE_URL bunx prisma db push && bun run start