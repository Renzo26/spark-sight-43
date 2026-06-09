# Deploy — VPS com Easypanel + Docker Compose

Este projeto é um app **TanStack Start (SSR)**. Para rodar fora do Lovable, o build
usa o preset **`node-server`** do Nitro (ativado por `BUILD_TARGET=node`), que gera um
servidor Node autossuficiente em `.output/server/index.mjs` (SSR + assets estáticos),
escutando na porta definida por `PORT` (padrão `3000`).

Arquivos relevantes:

- `Dockerfile` — build multi-stage (Node 22) → imagem só com o `.output`.
- `docker-compose.yml` — sobe o serviço `dashboard` na porta `3000`.
- `.dockerignore` — mantém o contexto de build enxuto.

---

## 1. Pré-requisito: enviar os arquivos para o Git

O Easypanel constrói a imagem a partir do repositório. Faça commit e push do
`Dockerfile`, `docker-compose.yml` e `.dockerignore`:

```bash
git add Dockerfile docker-compose.yml .dockerignore vite.config.ts DEPLOY.md
git commit -m "Adiciona deploy Docker (preset node-server) para Easypanel"
git push
```

---

## 2. Deploy no Easypanel (via Compose)

1. No Easypanel, abra o **Project** desejado → **+ Service** → **Compose**.
2. Em **Source**, selecione **GitHub** e aponte para o repositório/branch do projeto.
   - O `Dockerfile`/`docker-compose.yml` ficam na **raiz** do repositório, então o
     Build Path padrão (`/`) já funciona.
3. O Easypanel detecta o `docker-compose.yml` e faz o build do `Dockerfile`.
4. Clique em **Deploy**.

### Domínio e HTTPS

- Em **Domains**, adicione seu domínio e aponte para o serviço **`dashboard`** na
  porta **`3000`**. O Easypanel cuida do proxy reverso e do SSL (Let's Encrypt).

### Variáveis de ambiente (opcional)

- `PORT` — porta interna (padrão `3000`). Se mudar aqui, ajuste o domínio para a
  mesma porta.

---

## 3. Alternativa: rodar manualmente na VPS

Se preferir subir direto pelo terminal da VPS (sem a UI do Easypanel):

```bash
# na pasta do projeto (onde está o docker-compose.yml)
docker compose up -d --build

# logs
docker compose logs -f

# parar
docker compose down
```

A aplicação ficará em `http://SEU_IP:3000`. Coloque um proxy (Nginx/Traefik/Easypanel)
na frente para domínio + HTTPS.

---

## 4. Teste local da imagem (opcional)

```bash
docker build -t wnbf-dashboard .
docker run --rm -p 3000:3000 -e PORT=3000 wnbf-dashboard
# abra http://localhost:3000
```

---

## Notas

- O build usa `npm install` (em vez de `npm ci`) para garantir os binários nativos
  corretos do Linux (ex.: `lightningcss` do Tailwind v4), independente da plataforma
  onde o `package-lock.json` foi gerado.
- O runtime é **somente JS** (o Nitro vendoriza o necessário em `.output`), então a
  imagem final é leve e não reinstala dependências.
- A fonte de dados hoje é **mock** (`src/services/sheets.ts`). Ao conectar a planilha
  real do Google Sheets, lembre-se de configurar variáveis de ambiente no Easypanel,
  se necessário.
