/**
 * Parâmetros próprios de cada componente construtivo.
 * Cada interface é a "ficha de fabricação" daquele componente isolado.
 */
import type { EdgeKind, GrainDirection } from "../engineering/types";

export type HingeType = "caneco-35" | "slim" | "invisivel" | "piano";
export type SwingSide = "esquerda" | "direita" | "superior" | "inferior";
export type HandleType = "tubular" | "perfil-gola" | "cava" | "botao" | "push";
export type SlideType = "telescopica" | "oculta-softclose" | "tandem" | "roldana";
export type OpeningType = "manual" | "softclose" | "push-to-open" | "eletrica";
export type FrontSubstrate = "mdf" | "vidro" | "espelho" | "aluminio-vidro";

export interface CommonMakeParams {
  readonly materialId: string;
  readonly finishId: string;
  readonly edge: EdgeKind;
  readonly grain: GrainDirection;
}

export interface DoorSwingParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly swing: SwingSide;
  readonly hinge: HingeType;
  /** 0 = calcular automaticamente pela altura/peso. */
  readonly hingeCount: number;
  readonly handle: HandleType;
  readonly opening: OpeningType;
  readonly substrate: FrontSubstrate;
  /** Folgas perimetrais (mm). */
  readonly gapTopMm: number;
  readonly gapBottomMm: number;
  readonly gapSideMm: number;
  readonly maxAngleDeg: number;
}

export interface DoorSlidingParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  /** Nº de folhas do conjunto. */
  readonly leaves: number;
  /** Nº de trilhos (2 folhas em 2 trilhos = passagem de 50%). */
  readonly tracks: number;
  readonly system: "embutido" | "aparente" | "suspenso" | "sobreposto";
  readonly handle: HandleType;
  readonly substrate: FrontSubstrate;
  /** Sobreposição entre folhas vizinhas (mm). */
  readonly overlapMm: number;
  readonly softClose: boolean;
  readonly gapTopMm: number;
  readonly gapBottomMm: number;
}

export interface DrawerParams extends CommonMakeParams {
  /** Vão interno disponível (mm). */
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
  readonly bottomThicknessMm: number;
  readonly slide: SlideType;
  readonly slideLengthMm: number;
  readonly opening: OpeningType;
  /** Gera a frente junto (false = frente montada por `frente-gaveta`). */
  readonly withFront: boolean;
  /**
   * Como a frente se apoia no vão:
   *  - "sobreposta": cobre a estrutura (padrão histórico, gaveteiro);
   *  - "embutida": permanece DENTRO do envelope do módulo (gaveta interna),
   *    sem invadir divisórias nem o plano das portas.
   */
  readonly frontFit: "sobreposta" | "embutida";
  readonly handle: HandleType;
  readonly capacityKg: number;
}

export interface DrawerFrontParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly handle: HandleType;
  readonly substrate: FrontSubstrate;
  readonly gapSideMm: number;
  readonly gapTopMm: number;
  /** Frente sobreposta ao corpo ou embutida no vão. */
  readonly mounting: "sobreposta" | "embutida";
}

export interface ShelfParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
  /** Altura da prateleira dentro do módulo (mm, a partir da base). */
  readonly positionMm: number;
  readonly fixed: boolean;
  /** 0 = calcular pelo vão. */
  readonly supportCount: number;
  readonly supportType: "pino" | "suporte-oculto" | "cremalheira" | "cavilha";
  readonly loadKg: number;
}

export interface DividerParams extends CommonMakeParams {
  readonly heightMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
  /** Posição X dentro do módulo (mm). */
  readonly positionMm: number;
  readonly fullHeight: boolean;
}

export interface HangerRodParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthOffsetMm: number;
  readonly profile: "oval" | "redondo" | "retangular" | "led";
  readonly diameterMm: number;
  readonly finish: "inox" | "preto" | "aluminio" | "latao";
  readonly supports: number;
  readonly loadKg: number;
}

export interface TopBoxParams extends CommonMakeParams {
  /** Maleiro: caixa superior independente. */
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
  readonly doors: number;
  readonly withShelf: boolean;
}

export interface NicheParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
  readonly withBack: boolean;
  readonly ledStrip: boolean;
  readonly shelves: number;
}

export interface PlinthParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  /** Recuo em relação à frente (mm) — pé-palito visual. */
  readonly recessMm: number;
  readonly removable: boolean;
}

export interface PanelLikeParams extends CommonMakeParams {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly thicknessMm: number;
}

/** Tampo — chapa horizontal superior, com opção de saliência. */
export interface TopParams extends PanelLikeParams {
  readonly overhangFrontMm: number;
  readonly overhangSideMm: number;
  readonly postformado: boolean;
}

/** Lateral — chapa vertical estrutural. */
export interface SideParams extends PanelLikeParams {
  readonly side: "esquerda" | "direita";
  readonly furada: boolean;
  readonly rowPitchMm: number;
}

/** Fundo — chapa traseira. */
export interface BackParams extends PanelLikeParams {
  readonly mounting: "pregado" | "encaixado" | "canal" | "rebaixado";
}

/** Base — chapa horizontal inferior. */
export interface BaseParams extends PanelLikeParams {
  readonly support: "rodape" | "pe-regulavel" | "suspenso";
}

/** Painel — chapa livre (ripado, TV, cabeceira, revestimento). */
export interface PanelParams extends PanelLikeParams {
  readonly treatment: "liso" | "ripado" | "canelado" | "shaker";
  readonly slats: number;
  readonly slatDepthMm: number;
  readonly orientation: "vertical" | "horizontal";
}
