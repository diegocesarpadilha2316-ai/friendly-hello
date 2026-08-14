const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export function classifyPiece(description) {
  const t = norm(description);
  if (/(torre|roupeir|closet|armario alto|despenseir|estante|panelei)/.test(t)) return "alto";
  if (/(aereo|aéreo|basculante|suspens)/.test(t)) return "aereo";
  if (/(geladeir|cooktop|forno|coifa|micro|lava|cook|fogao)/.test(t)) return "eletro";
  if (/(balcao|balcão|gaveteir|bancada|pia|cuba|painel|rack|cristaleir)/.test(t)) return "base";
  return "apoio";
}
/** Peso visual aproximado do modulo (usado para equilibrar as paredes). */
function visualWeight(cls) {
  switch (cls) {
    case "alto":
      return 3;
    case "eletro":
      return 2.2;
    case "base":
      return 1.6;
    case "aereo":
      return 1;
    default:
      return 0.6;
  }
}
/** Largura estimada quando o pedido nao traz medida (para reservar parede). */
function estimateWidth(p, cls) {
  if (p.width) return p.width;
  const m = /(\d{3,4})\s*mm/.exec(p.description);
  if (m) return Number(m[1]);
  switch (cls) {
    case "alto":
      return 900;
    case "eletro":
      return 700;
    case "base":
      return 800;
    case "aereo":
      return 800;
    default:
      return 600;
  }
}
/** Ordem de montagem dentro da parede: volumes altos ancoram nas pontas. */
const CLASS_ORDER = {
  alto: 0,
  eletro: 1,
  base: 2,
  apoio: 3,
  aereo: 4,
};
/**
 * Compoe as pecas: escolhe a parede de cada modulo respeitando aberturas,
 * ergonomia (aereos sempre acima da linha de bancada da MESMA parede),
 * continuidade (mesma classe agrupada) e equilibrio de peso entre paredes.
 */
export function composeLayout(analysis, pieces) {
  const notes = [];
  if (pieces.length === 0) {
    return { shape: analysis.shape, pieces: [], notes };
  }
  const enriched = pieces.map((p, index) => {
    const cls = classifyPiece(p.description);
    return { p, cls, index, width: estimateWidth(p, cls) * Math.max(1, p.count ?? 1) };
  });
  // Paredes candidatas: as uteis da analise, na ordem de aptidao.
  const candidates = analysis.workWalls.slice(0, 4);
  const budgets = new Map();
  for (const w of candidates) {
    const info = analysis.walls[w];
    budgets.set(w, {
      wall: w,
      capacity: Math.max(0, info.longestRun - 80),
      used: 0,
      weight: 0,
      allowsTall: info.allowsTall,
    });
  }
  const primary = candidates[0];
  // Parede "de servico/alta": a de menor luz natural e sem abertura.
  const tallWall =
    candidates.find((w) => analysis.walls[w].allowsTall && w !== primary) ??
    candidates.find((w) => analysis.walls[w].allowsTall) ??
    primary;
  // Parede da bancada principal: melhor aptidao que nao seja a das torres,
  // ou a propria primaria quando so ha uma parede util.
  const baseWall = candidates.find((w) => w !== tallWall) ?? primary;
  const pick = (cls, width, requested) => {
    const prefer = [];
    if (requested && budgets.has(requested)) prefer.push(requested);
    if (cls === "alto" || cls === "eletro") prefer.push(tallWall);
    if (cls === "base" || cls === "aereo") prefer.push(baseWall);
    prefer.push(...candidates);
    const seen = new Set();
    const ordered = prefer.filter((w) => budgets.has(w) && !seen.has(w) && seen.add(w));
    // 1a passada: respeita capacidade, aberturas e equilibrio de peso.
    let best = null;
    for (const w of ordered) {
      const b = budgets.get(w);
      if (cls === "alto" && !b.allowsTall) continue;
      if (b.used + width > b.capacity) continue;
      if (!best) {
        best = b;
        continue;
      }
      // Entre paredes viaveis, prefere a menos carregada (equilibrio visual),
      // mantendo a preferencia funcional como desempate suave.
      if (b.weight + 0.4 < best.weight) best = b;
    }
    if (best) return best.wall;
    // 2a passada: aceita a parede com mais folga restante.
    const fallback = [...budgets.values()].sort(
      (a, b) => b.capacity - b.used - (a.capacity - a.used),
    )[0];
    return fallback?.wall ?? primary;
  };
  // Ordena por classe para gerar continuidade de volumes na parede,
  // preservando a ordem original dentro de cada classe (alinhamento).
  const sorted = [...enriched].sort(
    (a, b) => CLASS_ORDER[a.cls] - CLASS_ORDER[b.cls] || a.index - b.index,
  );
  const out = [];
  const aereoWallByBase = new Map();
  for (const e of sorted) {
    let wall;
    if (e.cls === "aereo") {
      // Ergonomia: aereo acompanha a parede que recebeu as bases.
      wall = aereoWallByBase.get("base") ?? pick(e.cls, e.width, e.p.wall);
    } else {
      wall = pick(e.cls, e.width, e.p.wall);
      if (e.cls === "base" && !aereoWallByBase.has("base")) aereoWallByBase.set("base", wall);
    }
    const b = budgets.get(wall);
    if (b) {
      // Aereos nao competem por metro linear com as bases (planos distintos).
      if (e.cls !== "aereo") b.used += e.width;
      b.weight += visualWeight(e.cls) * Math.max(1, e.p.count ?? 1);
    }
    out.push({ ...e.p, wall });
  }
  // Forma final: se a composicao usou mais paredes do que a forma prevista,
  // promove linear -> L -> U para o motor abrir as paredes necessarias.
  const usedWalls = new Set(out.map((p) => p.wall).filter(Boolean));
  const shape = promoteShape(analysis.shape, usedWalls.size);
  notes.push(
    `Composicao: ${out.length} grupos distribuidos em ${usedWalls.size} parede(s) (${[...usedWalls].join(", ")})`,
  );
  if (tallWall !== baseWall)
    notes.push(`volumes altos na parede ${tallWall}, bancada e aereos na parede ${baseWall}`);
  const blocked = analysis.workWalls.filter((w) => !analysis.walls[w].allowsTall);
  if (blocked.length > 0)
    notes.push(`paredes ${blocked.join(", ")} preservadas (porta/janela) — sem marcenaria alta`);
  // Espelha o peso apurado de volta na analise (usado pelo controle de qualidade).
  const totalWeight = [...budgets.values()].reduce((s, b) => s + b.weight, 0) || 1;
  for (const b of budgets.values()) analysis.walls[b.wall].load = b.weight / totalWeight;
  return { shape, pieces: out, notes };
}
function promoteShape(base, wallsUsed) {
  if (wallsUsed >= 3) return base === "paralela" ? "U" : "U";
  if (wallsUsed === 2) return base === "paralela" ? "paralela" : "L";
  return base === "U" || base === "L" ? base : "linear";
}
