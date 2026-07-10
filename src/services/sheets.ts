import { createServerFn } from "@tanstack/react-start";

import { buildSheetsData } from "@/services/sheets-source.server";
import type { SheetsData } from "@/types/sheets";

/**
 * Fonte de dados OFICIAL do dashboard: a planilha do Google Sheets alimentada
 * pelo Stract.io. O fetch + parsing acontece no servidor (`.server.ts` +
 * handler do createServerFn), o que evita CORS do endpoint gviz e mantém a
 * lógica fora do bundle do cliente.
 *
 * Para apontar para outra planilha, defina as variáveis de ambiente
 * SHEETS_SPREADSHEET_ID / SHEETS_GID_VENDAS / SHEETS_GID_ENGAJAMENTO /
 * SHEETS_GID_RECONHECIMENTO (ver src/lib/config.server.ts).
 */

/** Server function chamada pelo React Query no DashboardContext. */
export const loadSheetsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SheetsData> => buildSheetsData(),
);
