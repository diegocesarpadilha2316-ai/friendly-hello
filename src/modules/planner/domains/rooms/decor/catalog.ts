/**
 * Fase 3.8 — IA Decoradora: catálogo semente de itens decorativos.
 *
 * Templates paramétricos determinísticos usados pelas sugestões. Cobrem
 * as 18 categorias exigidas pelo escopo (sofás, poltronas, cadeiras,
 * mesas, tapetes, quadros, espelhos, vasos, plantas, luminárias,
 * pendentes, abajures, cortinas, persianas, eletrodomésticos, objetos
 * decorativos, livros, utensílios).
 *
 * Este catálogo NÃO substitui a Biblioteca Inteligente (fase 3.4) —
 * complementa-a para o domínio decoração/finish, mantendo os mesmos
 * princípios (imutável, portável, sem estado global).
 */
import type { DecorItem, DecorItemKind, DecorStyleId } from "./types";

function d(
  id: string,
  name: string,
  kind: DecorItemKind,
  defaults: DecorItem["defaults"],
  styles: readonly DecorStyleId[],
  role: DecorItem["role"],
  extras: Partial<DecorItem> = {},
): DecorItem {
  return {
    id,
    name,
    kind,
    description: extras.description ?? `${name} sugerido pela IA Decoradora.`,
    defaults,
    styles,
    role,
    color: extras.color,
    material: extras.material,
    tags: extras.tags ?? [],
  };
}

export const DECOR_ITEMS: readonly DecorItem[] = [
  // Sofás
  d(
    "decor.sofa.3l.linho",
    "Sofá 3 lugares linho",
    "sofa",
    { width: 2200, depth: 900, height: 800 },
    ["contemporaneo", "escandinavo", "japandi", "moderno"],
    "principal",
    { material: "linho", color: "#D8D2C5", tags: ["conforto", "sala"] },
  ),
  d(
    "decor.sofa.chester.veludo",
    "Sofá Chesterfield veludo",
    "sofa",
    { width: 2400, depth: 950, height: 820 },
    ["classico", "luxo"],
    "principal",
    { material: "veludo", color: "#4B2E2A", tags: ["chester", "sofisticado"] },
  ),
  d(
    "decor.sofa.modular.couro",
    "Sofá modular couro",
    "sofa",
    { width: 2800, depth: 1000, height: 780 },
    ["industrial", "moderno", "corporativo"],
    "principal",
    { material: "couro", color: "#3A2E27", tags: ["modular"] },
  ),

  // Poltronas
  d(
    "decor.poltrona.eames",
    "Poltrona ícone couro",
    "poltrona",
    { width: 850, depth: 900, height: 900 },
    ["moderno", "classico", "corporativo"],
    "apoio",
    { material: "couro", color: "#2C1E14" },
  ),
  d(
    "decor.poltrona.papai",
    "Poltrona papai boucle",
    "poltrona",
    { width: 900, depth: 950, height: 950 },
    ["escandinavo", "japandi", "boho"],
    "apoio",
    { material: "boucle", color: "#EFE8DA" },
  ),

  // Cadeiras
  d(
    "decor.cadeira.wishbone",
    "Cadeira Wishbone carvalho",
    "cadeira",
    { width: 550, depth: 550, height: 780 },
    ["escandinavo", "japandi", "contemporaneo"],
    "apoio",
    { material: "carvalho", color: "#C9A26B" },
  ),
  d(
    "decor.cadeira.industrial",
    "Cadeira Tolix metal",
    "cadeira",
    { width: 450, depth: 500, height: 850 },
    ["industrial"],
    "apoio",
    { material: "aço", color: "#3B3B3B" },
  ),

  // Mesas
  d(
    "decor.mesa.centro.marmore",
    "Mesa de centro mármore",
    "mesa",
    { width: 1100, depth: 700, height: 400 },
    ["luxo", "contemporaneo", "classico"],
    "apoio",
    { material: "mármore", color: "#EFE9DC" },
  ),
  d(
    "decor.mesa.lateral.madeira",
    "Mesa lateral madeira",
    "mesa",
    { width: 500, depth: 500, height: 550 },
    ["escandinavo", "japandi", "boho"],
    "apoio",
    { material: "carvalho", color: "#B8956A" },
  ),
  d(
    "decor.mesa.jantar.6l",
    "Mesa de jantar 6 lugares",
    "mesa",
    { width: 2000, depth: 1000, height: 750 },
    ["moderno", "contemporaneo", "classico"],
    "principal",
    { material: "madeira", color: "#6E5140" },
  ),

  // Tapetes
  d(
    "decor.tapete.la.claro",
    "Tapete lã claro",
    "tapete",
    { width: 2000, depth: 3000, height: 15 },
    ["escandinavo", "japandi", "minimalista"],
    "textil",
    { material: "lã", color: "#EDE7D6" },
  ),
  d(
    "decor.tapete.persa",
    "Tapete persa vintage",
    "tapete",
    { width: 1800, depth: 2500, height: 15 },
    ["boho", "classico", "rustico"],
    "textil",
    { material: "algodão", color: "#8B3A2F" },
  ),

  // Quadros
  d(
    "decor.quadro.abstrato.grande",
    "Quadro abstrato grande",
    "quadro",
    { width: 1200, depth: 40, height: 900 },
    ["moderno", "contemporaneo", "luxo"],
    "decoracao",
    { color: "#1F2937" },
  ),
  d(
    "decor.quadro.gallery.tres",
    "Composição de três quadros",
    "quadro",
    { width: 1500, depth: 30, height: 600 },
    ["escandinavo", "boho", "japandi"],
    "decoracao",
  ),

  // Espelhos
  d(
    "decor.espelho.redondo",
    "Espelho redondo bronze",
    "espelho",
    { width: 900, depth: 30, height: 900 },
    ["contemporaneo", "japandi", "classico"],
    "decoracao",
    { material: "bronze" },
  ),
  d(
    "decor.espelho.piso",
    "Espelho de piso arco",
    "espelho",
    { width: 700, depth: 40, height: 1800 },
    ["luxo", "moderno", "boho"],
    "decoracao",
  ),

  // Vasos e plantas
  d(
    "decor.vaso.ceramica.m",
    "Vaso cerâmica médio",
    "vaso",
    { width: 300, depth: 300, height: 400 },
    ["japandi", "escandinavo", "boho", "contemporaneo"],
    "decoracao",
    { material: "cerâmica", color: "#E7DCC7" },
  ),
  d(
    "decor.planta.olive.g",
    "Oliveira em vaso 1,80m",
    "planta",
    { width: 600, depth: 600, height: 1800 },
    ["moderno", "contemporaneo", "escandinavo", "japandi", "boho"],
    "verde",
    { color: "#4B6A3F" },
  ),
  d(
    "decor.planta.monstera.m",
    "Costela-de-adão média",
    "planta",
    { width: 700, depth: 700, height: 1400 },
    ["boho", "escandinavo", "contemporaneo"],
    "verde",
    { color: "#3F6B45" },
  ),

  // Luminárias e pendentes
  d(
    "decor.luminaria.piso.arco",
    "Luminária de piso arco",
    "luminaria",
    { width: 400, depth: 400, height: 1800 },
    ["moderno", "contemporaneo", "luxo"],
    "luminaria",
    { color: "#C9A227" },
  ),
  d(
    "decor.pendente.trio",
    "Trio de pendentes metálicos",
    "pendente",
    { width: 900, depth: 300, height: 300 },
    ["industrial", "moderno", "corporativo"],
    "luminaria",
    { color: "#1F2937" },
  ),
  d(
    "decor.pendente.rattan",
    "Pendente rattan grande",
    "pendente",
    { width: 700, depth: 700, height: 500 },
    ["boho", "japandi", "escandinavo"],
    "luminaria",
    { color: "#B08968" },
  ),
  d(
    "decor.abajur.mesa",
    "Abajur cerâmica linho",
    "abajur",
    { width: 350, depth: 350, height: 550 },
    ["classico", "contemporaneo", "japandi"],
    "luminaria",
    { color: "#F1E7D0" },
  ),

  // Cortinas e persianas
  d(
    "decor.cortina.linho",
    "Cortina linho translúcida",
    "cortina",
    { width: 3000, depth: 60, height: 2700 },
    ["escandinavo", "japandi", "contemporaneo", "minimalista"],
    "textil",
    { material: "linho", color: "#F1EBDD" },
  ),
  d(
    "decor.persiana.rolo.blackout",
    "Persiana rolo blackout",
    "persiana",
    { width: 1500, depth: 40, height: 2200 },
    ["moderno", "corporativo", "minimalista"],
    "textil",
    { color: "#1E293B" },
  ),

  // Eletrodomésticos (decor visual — a produção usa a Biblioteca)
  d(
    "decor.eletro.geladeira.inox",
    "Geladeira inox french door",
    "eletrodomestico",
    { width: 900, depth: 750, height: 1800 },
    ["moderno", "corporativo", "luxo"],
    "eletro",
    { material: "inox", color: "#C0C0C0" },
  ),
  d(
    "decor.eletro.cooktop",
    "Cooktop 5 bocas",
    "eletrodomestico",
    { width: 750, depth: 520, height: 40 },
    ["moderno", "contemporaneo", "industrial"],
    "eletro",
  ),

  // Objetos, livros, utensílios
  d(
    "decor.objeto.escultura",
    "Escultura decorativa",
    "objeto_decorativo",
    { width: 250, depth: 250, height: 500 },
    ["luxo", "moderno", "contemporaneo"],
    "decoracao",
  ),
  d(
    "decor.livro.pilha",
    "Pilha de livros de arte",
    "livro",
    { width: 300, depth: 250, height: 250 },
    ["classico", "contemporaneo", "japandi", "boho"],
    "decoracao",
  ),
  d(
    "decor.utensilio.jarro",
    "Jarro esmaltado",
    "utensilio",
    { width: 220, depth: 220, height: 320 },
    ["boho", "rustico", "japandi"],
    "decoracao",
    { color: "#7A6A55" },
  ),
];

export function getDecorItem(id: string): DecorItem | undefined {
  return DECOR_ITEMS.find((i) => i.id === id);
}

export function decorItemsByStyle(styleId: DecorStyleId): DecorItem[] {
  return DECOR_ITEMS.filter((i) => i.styles.includes(styleId));
}
