/**
 * CATÁLOGO DE MÓDULOS INTERNOS.
 *
 * Cada módulo é uma RECEITA: descreve limites, regras e como se traduz em
 * componentes já existentes da Biblioteca Construtiva. Nenhuma geometria é
 * escrita aqui — prateleira continua sendo `prateleira`, gaveta continua
 * sendo `gaveta`, barra continua sendo `cabideiro`.
 */
import type { ConstructionBox } from "../construction";
import type { InteriorDims, InteriorModuleDef, InteriorRule } from "./types";

const ALL_FAMILIES = [
  "roupeiro",
  "closet",
  "cozinha",
  "banheiro",
  "lavanderia",
  "escritorio",
  "home-office",
  "painel",
  "cristaleira",
] as const;

const dims = (widthMm: number, heightMm: number, depthMm: number): InteriorDims => ({
  widthMm,
  heightMm,
  depthMm,
});

const noClearance = { sideMm: 0, frontMm: 0, verticalMm: 0 };

function minHeightRule(mm: number, what: string): InteriorRule {
  return {
    code: "altura-minima",
    level: "error",
    message: `${what} exige pelo menos ${mm} mm de altura livre.`,
    check: (fit) => fit.height >= mm,
  };
}

function minDepthRule(mm: number, what: string): InteriorRule {
  return {
    code: "profundidade-minima",
    level: "error",
    message: `${what} exige pelo menos ${mm} mm de profundidade.`,
    check: (fit) => fit.depth >= mm,
  };
}

/** Deve encostar no topo do vão (maleiro). */
const anchorTopRule: InteriorRule = {
  code: "ancoragem-topo",
  level: "error",
  message: "Este módulo precisa ficar na parte superior do vão.",
  check: (fit, cavity) => fit.y + fit.height >= cavity.y + cavity.heightMm - 60,
};

/** Deve encostar na base do vão (sapateira baixa, módulos apoiados). */
const anchorBaseRule: InteriorRule = {
  code: "ancoragem-base",
  level: "warn",
  message: "Este módulo trabalha melhor apoiado na base do vão.",
  check: (fit, cavity) => fit.y <= cavity.y + 80,
};

/* ─────────────── mapeadores para a Biblioteca Construtiva ─────────────── */

const shelfParams = (fit: ConstructionBox, def: InteriorModuleDef, extra = {}) => ({
  widthMm: fit.width,
  depthMm: fit.depth,
  thicknessMm: def.thicknessMm,
  positionMm: 0,
  ...extra,
});

const drawerParams = (fit: ConstructionBox, extra = {}) => ({
  widthMm: fit.width,
  heightMm: fit.height,
  depthMm: fit.depth,
  ...extra,
});

const rodParams = (fit: ConstructionBox, extra = {}) => ({
  widthMm: fit.width,
  heightMm: fit.height,
  depthOffsetMm: Math.max(50, Math.round(fit.depth / 2 - 20)),
  ...extra,
});

const nicheParams = (fit: ConstructionBox, def: InteriorModuleDef, extra = {}) => ({
  widthMm: fit.width,
  heightMm: fit.height,
  depthMm: fit.depth,
  thicknessMm: def.thicknessMm,
  ...extra,
});

/* ────────────────────────────── MÓDULOS ────────────────────────────────── */

export const INTERIOR_MODULES: readonly InteriorModuleDef[] = [
  {
    id: "prateleira",
    name: "Prateleira",
    category: "armazenagem",
    type: "prateleira",
    min: dims(150, 18, 100),
    max: dims(1200, 60, 900),
    preferred: dims(600, 18, 500),
    clearances: { sideMm: 0, frontMm: 5, verticalMm: 180 },
    thicknessMm: 18,
    anchor: "livre",
    rules: [
      {
        code: "vao-prateleira",
        level: "warn",
        message: "Vão acima de 1000 mm sem apoio central tende a fletir.",
        check: (fit) => fit.width <= 1000,
      },
    ],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      { key: "chapa", component: "prateleira", params: (fit, def) => shelfParams(fit, def) },
    ],
  },
  {
    id: "divisoria-vertical",
    name: "Divisória vertical",
    category: "estrutura",
    type: "divisoria",
    min: dims(15, 200, 100),
    max: dims(40, 3000, 900),
    preferred: dims(18, 2000, 500),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [minHeightRule(200, "A divisória vertical")],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "chapa",
        component: "divisoria-vertical",
        params: (fit, def) => ({
          heightMm: fit.height,
          depthMm: fit.depth,
          thicknessMm: def.thicknessMm,
          positionMm: 0,
          fullHeight: true,
        }),
      },
    ],
  },
  {
    id: "divisoria-horizontal",
    name: "Divisória horizontal",
    category: "estrutura",
    type: "prateleira",
    min: dims(150, 18, 100),
    max: dims(1400, 40, 900),
    preferred: dims(600, 18, 500),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "chapa",
        component: "prateleira",
        params: (fit, def) => shelfParams(fit, def, { fixed: true, supportType: "cavilha" }),
      },
    ],
  },
  {
    id: "cabideiro",
    name: "Cabideiro",
    category: "penduracao",
    type: "barra",
    min: dims(300, 900, 400),
    max: dims(1400, 2200, 800),
    preferred: dims(900, 1600, 550),
    clearances: { sideMm: 0, frontMm: 30, verticalMm: 60 },
    thicknessMm: 30,
    anchor: "livre",
    rules: [minHeightRule(900, "O cabideiro longo"), minDepthRule(400, "O cabideiro")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet", "lavanderia", "escritorio"],
    parts: [
      { key: "barra", component: "cabideiro", params: (fit) => rodParams(fit, { profile: "oval" }) },
    ],
  },
  {
    id: "calceiro",
    name: "Calceiro",
    category: "penduracao",
    type: "barra",
    min: dims(300, 500, 400),
    max: dims(1000, 1200, 700),
    preferred: dims(600, 700, 550),
    clearances: { sideMm: 0, frontMm: 30, verticalMm: 40 },
    thicknessMm: 25,
    anchor: "livre",
    rules: [minHeightRule(500, "O calceiro"), minDepthRule(400, "O calceiro")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet"],
    parts: [
      {
        key: "barra",
        component: "cabideiro",
        params: (fit) => rodParams(fit, { profile: "retangular", diameterMm: 25, loadKg: 15 }),
      },
    ],
  },
  {
    id: "sapateira",
    name: "Sapateira",
    category: "armazenagem",
    type: "prateleira",
    min: dims(300, 150, 250),
    max: dims(1400, 400, 700),
    preferred: dims(800, 200, 350),
    clearances: { sideMm: 0, frontMm: 10, verticalMm: 150 },
    thicknessMm: 18,
    anchor: "base",
    rules: [minDepthRule(250, "A sapateira"), anchorBaseRule],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: true },
    incompatibleWith: [],
    families: ["roupeiro", "closet", "banheiro"],
    parts: [
      {
        key: "chapa",
        component: "prateleira",
        params: (fit, def) => shelfParams(fit, def, { fixed: true, loadKg: 25 }),
      },
    ],
  },
  {
    id: "maleiro",
    name: "Maleiro",
    category: "armazenagem",
    type: "caixa",
    min: dims(300, 200, 250),
    max: dims(3000, 900, 900),
    preferred: dims(1200, 400, 600),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "topo",
    rules: [anchorTopRule],
    limits: { maxPerCavity: 1, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet", "lavanderia"],
    parts: [
      {
        key: "caixa",
        component: "maleiro",
        params: (fit, def) => ({
          widthMm: fit.width,
          heightMm: fit.height,
          depthMm: fit.depth,
          thicknessMm: def.thicknessMm,
          doors: 0,
        }),
      },
    ],
  },
  {
    id: "nicho",
    name: "Nicho",
    category: "armazenagem",
    type: "nicho",
    min: dims(150, 150, 100),
    max: dims(1400, 1600, 800),
    preferred: dims(400, 400, 350),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [{ key: "nicho", component: "nicho", params: (fit, def) => nicheParams(fit, def) }],
  },
  {
    id: "gaveta-interna",
    name: "Gaveta interna",
    category: "armazenagem",
    type: "gaveta",
    min: dims(250, 80, 300),
    max: dims(1200, 400, 700),
    preferred: dims(600, 180, 500),
    clearances: { sideMm: 0, frontMm: 0, verticalMm: 20 },
    thicknessMm: 15,
    anchor: "livre",
    rules: [minDepthRule(300, "A gaveta"), minHeightRule(80, "A gaveta")],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "gaveta",
        component: "gaveta",
        params: (fit) => drawerParams(fit, { withFront: true, slide: "oculta-softclose" }),
      },
    ],
  },
  {
    id: "cesto-aramado",
    name: "Cesto aramado",
    category: "armazenagem",
    type: "cesto",
    min: dims(250, 100, 300),
    max: dims(1000, 350, 650),
    preferred: dims(600, 180, 450),
    clearances: { sideMm: 0, frontMm: 0, verticalMm: 20 },
    thicknessMm: 12,
    anchor: "livre",
    rules: [minDepthRule(300, "O cesto aramado")],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet", "cozinha", "lavanderia", "banheiro"],
    parts: [
      {
        key: "cesto",
        component: "gaveta",
        params: (fit) =>
          drawerParams(fit, {
            withFront: false,
            slide: "telescopica",
            thicknessMm: 12,
            capacityKg: 20,
          }),
      },
    ],
  },
  {
    id: "porta-calcas",
    name: "Porta-calças extraível",
    category: "organizacao",
    type: "barra",
    min: dims(300, 200, 400),
    max: dims(900, 600, 700),
    preferred: dims(600, 300, 500),
    clearances: { sideMm: 0, frontMm: 20, verticalMm: 40 },
    thicknessMm: 20,
    anchor: "livre",
    rules: [minDepthRule(400, "O porta-calças extraível")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet"],
    parts: [
      {
        key: "barra",
        component: "cabideiro",
        params: (fit) => rodParams(fit, { profile: "retangular", diameterMm: 20, loadKg: 12 }),
      },
    ],
  },
  {
    id: "porta-gravatas",
    name: "Porta-gravatas",
    category: "organizacao",
    type: "acessorio",
    min: dims(150, 100, 300),
    max: dims(600, 300, 600),
    preferred: dims(350, 150, 450),
    clearances: { sideMm: 0, frontMm: 20, verticalMm: 30 },
    thicknessMm: 16,
    anchor: "livre",
    rules: [minDepthRule(300, "O porta-gravatas")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet"],
    parts: [
      {
        key: "barra",
        component: "cabideiro",
        params: (fit) => rodParams(fit, { profile: "redondo", diameterMm: 16, loadKg: 8 }),
      },
    ],
  },
  {
    id: "porta-cintos",
    name: "Porta-cintos",
    category: "organizacao",
    type: "acessorio",
    min: dims(150, 100, 300),
    max: dims(600, 300, 600),
    preferred: dims(300, 150, 450),
    clearances: { sideMm: 0, frontMm: 20, verticalMm: 30 },
    thicknessMm: 16,
    anchor: "livre",
    rules: [minDepthRule(300, "O porta-cintos")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet"],
    parts: [
      {
        key: "barra",
        component: "cabideiro",
        params: (fit) => rodParams(fit, { profile: "redondo", diameterMm: 16, loadKg: 8 }),
      },
    ],
  },
  {
    id: "porta-joias",
    name: "Porta-joias",
    category: "organizacao",
    type: "gaveta",
    min: dims(250, 60, 300),
    max: dims(900, 150, 600),
    preferred: dims(600, 90, 450),
    clearances: { sideMm: 0, frontMm: 0, verticalMm: 20 },
    thicknessMm: 12,
    anchor: "livre",
    rules: [minDepthRule(300, "O porta-joias")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: ["roupeiro", "closet"],
    parts: [
      {
        key: "bandeja",
        component: "gaveta",
        params: (fit) =>
          drawerParams(fit, {
            withFront: false,
            thicknessMm: 12,
            slide: "oculta-softclose",
            capacityKg: 10,
          }),
      },
    ],
  },
  {
    id: "organizador-interno",
    name: "Organizador interno",
    category: "organizacao",
    type: "gaveta",
    min: dims(200, 60, 250),
    max: dims(1000, 200, 650),
    preferred: dims(500, 100, 450),
    clearances: { sideMm: 0, frontMm: 0, verticalMm: 20 },
    thicknessMm: 12,
    anchor: "livre",
    rules: [minDepthRule(250, "O organizador interno")],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "bandeja",
        component: "gaveta",
        params: (fit) =>
          drawerParams(fit, { withFront: false, thicknessMm: 12, slide: "telescopica" }),
      },
    ],
  },
  {
    id: "prateleira-inclinada",
    name: "Prateleira inclinada",
    category: "armazenagem",
    type: "prateleira",
    min: dims(250, 100, 200),
    max: dims(1200, 350, 700),
    preferred: dims(700, 180, 350),
    clearances: { sideMm: 0, frontMm: 10, verticalMm: 120 },
    thicknessMm: 18,
    anchor: "livre",
    rules: [minDepthRule(200, "A prateleira inclinada")],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: true },
    incompatibleWith: [],
    families: ["roupeiro", "closet", "cozinha", "banheiro", "cristaleira"],
    parts: [
      {
        key: "chapa",
        component: "prateleira",
        params: (fit, def) => shelfParams(fit, def, { fixed: true, loadKg: 20 }),
      },
    ],
  },
  {
    id: "adega",
    name: "Adega",
    category: "especial",
    type: "nicho",
    min: dims(300, 300, 300),
    max: dims(1200, 1500, 700),
    preferred: dims(600, 700, 400),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [minDepthRule(300, "A adega")],
    limits: { maxPerCavity: 2, requiresBack: false, tiltable: true },
    incompatibleWith: [],
    families: ["cozinha", "cristaleira", "painel", "escritorio"],
    parts: [
      {
        key: "colmeia",
        component: "nicho",
        params: (fit, def) =>
          nicheParams(fit, def, { shelves: Math.max(1, Math.floor(fit.height / 200) - 1) }),
      },
      {
        key: "divisoria",
        component: "divisoria-vertical",
        at: (fit) => [Math.round(fit.width / 2), 0, 0],
        params: (fit, def) => ({
          heightMm: fit.height,
          depthMm: fit.depth,
          thicknessMm: def.thicknessMm,
          positionMm: 0,
          fullHeight: true,
        }),
      },
    ],
  },
  {
    id: "modulo-aberto",
    name: "Módulo aberto",
    category: "armazenagem",
    type: "nicho",
    min: dims(200, 200, 150),
    max: dims(1400, 2000, 800),
    preferred: dims(600, 600, 500),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [],
    limits: { maxPerCavity: 0, requiresBack: false, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "caixa",
        component: "nicho",
        params: (fit, def) => nicheParams(fit, def, { withBack: true, shelves: 0 }),
      },
    ],
  },
  {
    id: "modulo-fechado",
    name: "Módulo fechado",
    category: "armazenagem",
    type: "caixa",
    min: dims(250, 250, 200),
    max: dims(1200, 2000, 800),
    preferred: dims(600, 700, 500),
    clearances: noClearance,
    thicknessMm: 18,
    anchor: "livre",
    rules: [minDepthRule(200, "O módulo fechado")],
    limits: { maxPerCavity: 0, requiresBack: true, tiltable: false },
    incompatibleWith: [],
    families: [...ALL_FAMILIES],
    parts: [
      {
        key: "caixa",
        component: "nicho",
        params: (fit, def) => nicheParams(fit, def, { withBack: true, shelves: 0 }),
      },
      {
        key: "porta",
        component: "porta-abrir",
        at: (fit) => [0, 0, fit.depth],
        params: (fit) => ({
          widthMm: fit.width,
          heightMm: fit.height,
          swing: "esquerda",
          handle: "cava",
        }),
      },
    ],
  },
];