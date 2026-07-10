import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Add server-only values here, e.g.:
    //   databaseUrl: process.env.DATABASE_URL,
    //   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}

/**
 * Configuração da planilha oficial do dashboard (Google Sheets alimentado
 * pelo Stract.io). Todos os valores podem ser sobrescritos por variáveis de
 * ambiente para apontar para outra planilha sem recompilar.
 *
 * Abas (gids) da planilha atual:
 *   - vendas        (OUTCOME_SALES)      → funil completo: leads, carrinho, compra, faturamento
 *   - engajamento   (OUTCOME_ENGAGEMENT) → vídeo/thruplay
 *   - reconhecimento(OUTCOME_AWARENESS)  → alcance
 */
export function getSheetsConfig() {
  return {
    spreadsheetId:
      process.env.SHEETS_SPREADSHEET_ID ?? "1lm-JkDC1BEFYcVwKOnTFGlE9n3AJX8_FVkMGdfsUyU8",
    gids: {
      vendas: process.env.SHEETS_GID_VENDAS ?? "1740879822",
      engajamento: process.env.SHEETS_GID_ENGAJAMENTO ?? "1531908467",
      reconhecimento: process.env.SHEETS_GID_RECONHECIMENTO ?? "987627349",
    },
  };
}
