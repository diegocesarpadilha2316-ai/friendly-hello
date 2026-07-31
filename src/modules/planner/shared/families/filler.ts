/**
 * TAPA-VÃO E ACABAMENTOS COMO PEÇA REAL.
 *
 * Antes, "sobra" era apenas um número (`fillers[].widthMm`) e nunca virava
 * marcenaria. Aqui o enchimento vira uma PEÇA de verdade: posição, medidas,
 * orientação, função, acabamento e lista de corte — montada pelo componente
 * `painel` da Biblioteca Construtiva, com a classificação correta
 * (`tapa-vao` ou `acabamento`), sem rig e fora do intertravamento de portas.
 *
 * A infraestrutura é genérica: banheiro usa hoje, cozinha e as demais
 * famílias podem usar sem nenhuma adaptação.
 */
import { buildAssembly, type AssemblyResult, type AssemblySlot } from "../construction";

export type FillerFunction =
  /** Enchimento entre o módulo e a parede/coluna. */
  | "tapa-vao"
  /** Peça vista de acabamento (rodabanca, frontão, painel lateral). */
  | "acabamento";

export type FillerOrientation = "vertical" | "horizontal";

/** Peça real de enchimento/acabamento. */
export interface FillerPiece {
  readonly id: string;
  readonly role: FillerFunction;
  /** Papel fino usado na taxonomia (`rodabanca` sai como acabamento). */
  readonly fixedRole: "tapa-vao" | "acabamento" | "rodabanca" | "painel-fixo";
  readonly xMm: number;
  readonly yMm: number;
  readonly zMm: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly orientation: FillerOrientation;
  readonly finishId: string;
  /** Por que esta peça existe (auditável no diagnóstico). */
  readonly reason: string;
}

export interface FillerInput extends Partial<Omit<FillerPiece, "id">> {
  readonly id: string;
}

/** Nunca cria tapa-vão "por sobra": só quando explicitamente pedido. */
export function makeFiller(input: FillerInput): FillerPiece {
  const role: FillerFunction = input.role ?? "tapa-vao";
  return {
    id: input.id,
    role,
    fixedRole: input.fixedRole ?? (role === "acabamento" ? "acabamento" : "tapa-vao"),
    xMm: Math.round(input.xMm ?? 0),
    yMm: Math.round(input.yMm ?? 0),
    zMm: Math.round(input.zMm ?? 0),
    widthMm: Math.max(3, Math.round(input.widthMm ?? 30)),
    heightMm: Math.max(3, Math.round(input.heightMm ?? 700)),
    depthMm: Math.max(3, Math.round(input.depthMm ?? 18)),
    orientation: input.orientation ?? "vertical",
    finishId: input.finishId ?? "branco-tx",
    reason: input.reason ?? "enchimento técnico",
  };
}

/** Slot pronto para entrar em qualquer montagem. */
export function fillerSlot(f: FillerPiece): AssemblySlot {
  return {
    id: f.id,
    component: "painel",
    at: [f.xMm, f.yMm, f.zMm],
    role: f.role === "acabamento" ? `acabamento • ${f.reason}` : `tapa-vão • ${f.reason}`,
    params: {
      widthMm: f.widthMm,
      heightMm: f.heightMm,
      depthMm: f.depthMm,
      thicknessMm: f.depthMm,
      treatment: "liso",
      fixedRole: f.fixedRole,
      orientation: f.orientation,
      finishId: f.finishId,
    },
  };
}

/** Monta um tapa-vão isolado (peça avulsa na lista de corte). */
export function buildFillerModule(f: FillerPiece): AssemblyResult {
  return buildAssembly({
    id: `tapa-vao-${f.id}`,
    label: f.role === "acabamento" ? "Painel de acabamento" : "Tapa-vão",
    slots: [fillerSlot({ ...f, xMm: 0, yMm: 0, zMm: 0 })],
    context: { finishId: f.finishId },
  });
}