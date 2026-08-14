import type { ConfiguratorCommand } from "../types";

const MATERIAL_ALIASES: Record<string, string> = {
  branco: "MDF Branco",
  preto: "MDF Preto",
  cinza: "MDF Cinza",
  carvalho: "MDF Carvalho",
  freijó: "MDF Freijó",
  freijo: "MDF Freijó",
  nogal: "MDF Nogal",
  mdf: "MDF Branco",
  compensado: "Compensado Naval",
  melaminico: "Melamínico",
  melamínico: "Melamínico",
};

const BRAND_ALIASES = ["Blum", "Hettich", "Häfele", "Hafele", "FGV", "Salice"] as const;

function num(re: RegExp, text: string, mult = 1): number | null {
  const m = text.match(re);
  if (!m) return null;
  const raw = m[1].replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * mult);
}

/**
 * Parser determinístico de comandos pt-BR do Chat IA / Configurador.
 * Nunca chama IA remota — apenas normaliza a intenção do usuário.
 */
export function parseConfiguratorCommand(input: string): ConfiguratorCommand | null {
  const raw = input.trim();
  if (!raw) return null;
  const text = raw.toLowerCase();

  // Resize: "aumente para 2,80" / "largura 2400" / "altura 2100"
  const meters = num(/(?:para|em|de)\s*(\d+[.,]?\d*)\s*(?:m|metros?)\b/, text, 1000);
  const millis = num(/(\d{3,4})\s*mm/, text);
  const width = /largura|comprimento/.test(text);
  const height = /altura/.test(text);
  const depth = /profundidade|fundo/.test(text);
  if (/aumente|reduza|redimensione|ajuste|coloque|configure/.test(text) && (meters || millis)) {
    const value = meters ?? millis!;
    const axis = width ? "width" : height ? "height" : depth ? "depth" : "width";
    return {
      id: `resize:${axis}:${value}`,
      matched: raw,
      intent: "resize",
      args: { axis, value },
      summary: `Ajustar ${axis === "width" ? "largura" : axis === "height" ? "altura" : "profundidade"} para ${value} mm`,
    };
  }

  // Material: "troque MDF branco por Carvalho" / "material Freijó"
  const matHit = Object.keys(MATERIAL_ALIASES).find((k) =>
    new RegExp(`\\b${k}\\b`, "i").test(text),
  );
  if (matHit && /(troque|mude|coloque|use|material)/.test(text)) {
    return {
      id: `material:${MATERIAL_ALIASES[matHit]}`,
      matched: raw,
      intent: "material",
      args: { material: MATERIAL_ALIASES[matHit] },
      summary: `Trocar material por ${MATERIAL_ALIASES[matHit]}`,
    };
  }

  // Ferragens: "troque para Blum"
  const brand = BRAND_ALIASES.find((b) => new RegExp(`\\b${b}\\b`, "i").test(raw));
  if (brand && /(troque|use|coloque|padr[aã]o|ferragem|ferragens|marca)/.test(text)) {
    return {
      id: `brand:${brand}`,
      matched: raw,
      intent: "hardware.brand",
      args: { brand: brand === "Hafele" ? "Häfele" : brand },
      summary: `Padronizar ferragens ${brand}`,
    };
  }

  // Contadores
  const countMatch = text.match(/(\d+)\s*(portas?|gavetas?|prateleiras?|divis[oó]rias?|nichos?)/);
  if (countMatch) {
    const value = Number(countMatch[1]);
    const kind = countMatch[2];
    if (/porta/.test(kind))
      return {
        id: `doors:${value}`,
        matched: raw,
        intent: "doors.count",
        args: { value },
        summary: `Definir ${value} portas`,
      };
    if (/gaveta/.test(kind))
      return {
        id: `drawers:${value}`,
        matched: raw,
        intent: "drawers.count",
        args: { value },
        summary: `Definir ${value} gavetas`,
      };
    if (/prateleira/.test(kind))
      return {
        id: `shelves:${value}`,
        matched: raw,
        intent: "shelves.count",
        args: { value },
        summary: `Definir ${value} prateleiras`,
      };
    if (/divis/.test(kind))
      return {
        id: `dividers:${value}`,
        matched: raw,
        intent: "dividers.count",
        args: { value },
        summary: `Definir ${value} divisórias`,
      };
    if (/nicho/.test(kind))
      return {
        id: `niches:${value}`,
        matched: raw,
        intent: "niches.count",
        args: { value },
        summary: `Dividir em ${value} nichos`,
      };
  }

  // Aberturas
  const pct = num(/(\d{1,3})\s*%/, text);
  if (pct !== null && /(porta|gaveta)/.test(text)) {
    return {
      id: `open.pct:${pct}`,
      matched: raw,
      intent: "open.percent",
      args: { pct, target: /porta/.test(text) ? "doors" : "drawers" },
      summary: `Abrir ${/porta/.test(text) ? "portas" : "gavetas"} em ${pct}%`,
    };
  }
  if (/abra.*todas|abrir todas|abra tudo/.test(text))
    return {
      id: "open.all",
      matched: raw,
      intent: "open.all",
      args: {},
      summary: "Abrir portas e gavetas",
    };
  if (/feche.*todas|fechar todas|feche tudo/.test(text))
    return {
      id: "close.all",
      matched: raw,
      intent: "close.all",
      args: {},
      summary: "Fechar portas e gavetas",
    };
  if (/abr[ai].*porta/.test(text))
    return {
      id: "open.doors",
      matched: raw,
      intent: "open.doors",
      args: {},
      summary: "Abrir portas",
    };
  if (/fech[ae].*porta/.test(text))
    return {
      id: "close.doors",
      matched: raw,
      intent: "close.doors",
      args: {},
      summary: "Fechar portas",
    };
  if (/abr[ai].*gaveta/.test(text))
    return {
      id: "open.drawers",
      matched: raw,
      intent: "open.drawers",
      args: {},
      summary: "Abrir gavetas",
    };
  if (/fech[ae].*gaveta/.test(text))
    return {
      id: "close.drawers",
      matched: raw,
      intent: "close.drawers",
      args: {},
      summary: "Fechar gavetas",
    };

  // LED / vidro / espelho / ripado
  if (/led/.test(text))
    return { id: "add.led", matched: raw, intent: "add.led", args: {}, summary: "Adicionar LED" };
  if (/espelho/.test(text))
    return {
      id: "add.mirror",
      matched: raw,
      intent: "add.mirror",
      args: {},
      summary: "Adicionar espelho",
    };
  if (/vidro/.test(text))
    return {
      id: "add.glass",
      matched: raw,
      intent: "add.glass",
      args: {},
      summary: "Adicionar vidro",
    };
  if (/ripado|painel ripado/.test(text))
    return {
      id: "slatted",
      matched: raw,
      intent: "slatted",
      args: {},
      summary: "Transformar em painel ripado",
    };

  return null;
}

/**
 * Sugestões prontas mostradas no Configurador — cobrem o checklist da Fase 3.16.
 */
export const CONFIGURATOR_SUGGESTIONS: readonly string[] = [
  "Aumente o armário para 2,80",
  "Troque MDF branco por Carvalho",
  "Coloque 4 gavetas",
  "Troque para Blum",
  "Abra as portas",
  "Feche as gavetas",
  "Coloque LED",
  "Transforme em painel ripado",
  "Divida em 5 nichos",
  "Adicione espelho",
];

/** Converte um comando parseado em um patch de params (mesma shape de PlannerParametricNode.params). */
export function commandToPatch(
  cmd: ConfiguratorCommand,
): Record<string, string | number | boolean> {
  switch (cmd.intent) {
    case "resize": {
      const axis = String(cmd.args.axis);
      return { [axis]: Number(cmd.args.value) };
    }
    case "material":
      return { material: String(cmd.args.material) };
    case "hardware.brand":
      return { hardwareBrand: String(cmd.args.brand) };
    case "doors.count":
      return { doors: Number(cmd.args.value) };
    case "drawers.count":
      return { drawers: Number(cmd.args.value) };
    case "shelves.count":
      return { shelves: Number(cmd.args.value) };
    case "dividers.count":
      return { dividers: Number(cmd.args.value) };
    case "niches.count":
      return { niches: Number(cmd.args.value) };
    case "open.doors":
      return { doorsOpenPct: 100 };
    case "close.doors":
      return { doorsOpenPct: 0 };
    case "open.drawers":
      return { drawersOpenPct: 100 };
    case "close.drawers":
      return { drawersOpenPct: 0 };
    case "open.all":
      return { doorsOpenPct: 100, drawersOpenPct: 100 };
    case "close.all":
      return { doorsOpenPct: 0, drawersOpenPct: 0 };
    case "open.percent": {
      const pct = Math.max(0, Math.min(100, Number(cmd.args.pct)));
      return cmd.args.target === "drawers" ? { drawersOpenPct: pct } : { doorsOpenPct: pct };
    }
    case "add.led":
      return { led: true };
    case "add.mirror":
      return { mirror: true };
    case "add.glass":
      return { glass: true };
    case "slatted":
      return { slatted: true, panel: true };
    case "color":
      return { color: String(cmd.args.color) };
  }
}
