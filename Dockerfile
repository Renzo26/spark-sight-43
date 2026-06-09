# syntax=docker/dockerfile:1

############################
# Etapa 1 — Build
############################
FROM node:22-slim AS builder
WORKDIR /app

# Dependências (inclui devDependencies necessárias ao build).
# Usamos `npm install` para garantir os binários nativos corretos do Linux
# (ex.: lightningcss/oxide do Tailwind v4) independente da plataforma do lockfile.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Código-fonte + build do servidor Node standalone (preset node-server do Nitro).
COPY . .
ENV BUILD_TARGET=node
RUN npm run build

############################
# Etapa 2 — Runtime
############################
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# App autossuficiente gerado pelo Nitro (servidor SSR + assets estáticos).
COPY --from=builder /app/.output ./.output

# Executa como usuário não-root.
USER node

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
