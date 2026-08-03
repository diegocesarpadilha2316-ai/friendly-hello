import { CATALOG_ITEMS, findCatalogItem, insertItemIntoProject, listPrimitives, makePrimitiveId, upsertPrimitive, removeNodes, fromPrimitive, } from "@/modules/planner/shared";
import { matchDescription } from "./matcher";
import { applyLayout } from "./layout";
import { applyFinishing, FINISHING_PRESETS } from "./finishing";
import { resolvePaint } from "./resolvePaint";
import { analyzeRoom, composeDecor, composeLayout, describeAnalysis, describeQuality, rebalanceComposition, } from "../composition";
// ─────────────────────────── helpers ───────────────────────────
function getRoom(project, ctx) {
    const env = project.environments.find((e) => e.id === ctx.environmentId);
    return env?.rooms.find((r) => r.id === ctx.roomId) ?? null;
}
function updateRoom(project, ctx, fn) {
    return {
        ...project,
        environments: project.environments.map((env) => env.id !== ctx.environmentId
            ? env
            : {
                ...env,
                rooms: env.rooms.map((r) => (r.id === ctx.roomId ? fn(r) : r)),
                updatedAt: new Date().toISOString(),
            }),
    };
}
function furnitureInRoom(room) {
    return listPrimitives(room).filter((p) => p.kind === "furniture");
}
function pickItemsBySubtype(subtype) {
    return CATALOG_ITEMS.filter((i) => i.subtype === subtype);
}
function firstItem(subtype) {
    return pickItemsBySubtype(subtype)[0] ?? null;
}
function applySelection(room, ctx) {
    const all = furnitureInRoom(room);
    if (!ctx.selectionIds || ctx.selectionIds.length === 0)
        return all;
    const set = new Set(ctx.selectionIds);
    return all.filter((f) => set.has(f.id));
}
function mutateFurniture(project, ctx, targets, mutator) {
    return updateRoom(project, ctx, (room) => {
        let r = room;
        for (const t of targets)
            r = upsertPrimitive(r, mutator(t));
        return r;
    });
}
// ─────────────────────────── inserts ───────────────────────────
export function toolInsertItem(project, ctx, args) {
    const item = (args.catalogItemId && findCatalogItem(args.catalogItemId)) ||
        (args.subtype && firstItem(args.subtype));
    if (!item) {
        return {
            project,
            summary: `Nenhum item do catálogo compatível com "${args.subtype ?? args.catalogItemId}".`,
            affectedIds: [],
        };
    }
    const count = Math.max(1, Math.min(20, args.count ?? 1));
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Selecione um cômodo antes de inserir.", affectedIds: [] };
    const startX = args.at?.x ?? room.dimensions.width / 2;
    const startY = args.at?.y ?? room.dimensions.depth / 2;
    const step = item.parametric.defaults.width + 40;
    let next = project;
    for (let i = 0; i < count; i++) {
        next = insertItemIntoProject(next, ctx, item, {
            at: { x: startX + i * step, y: startY },
        });
    }
    return {
        project: next,
        summary: `${count}× ${item.name} inserido${count > 1 ? "s" : ""} em ${room.name}.`,
        affectedIds: [],
    };
}
const ROOM_BLUEPRINTS = {
    cozinha: {
        label: "Cozinha moderna",
        shape: "L",
        pieces: [
            // Parede principal (bottom) — balcões + eletros
            { description: "balcão 800mm Louro Freijó", count: 2, wall: "bottom" },
            { description: "gaveteiro 600mm Louro Freijó", count: 1, wall: "bottom" },
            { description: "cooktop 600mm inox", count: 1, wall: "bottom" },
            { description: "balcão 600mm Louro Freijó", count: 1, wall: "bottom" },
            // Parede lateral (right) — torre alta + geladeira
            { description: "torre forno microondas 700mm", count: 1, wall: "right" },
            { description: "geladeira 700mm inox", count: 1, wall: "right" },
            // Aéreos acompanham a parede principal
            { description: "aéreo 800mm porta basculante Louro Freijó", count: 3, wall: "bottom" },
        ],
        style: "moderno",
        decor: [
            { catalogItemId: "tapete-2x1_5", xRatio: 0.55, yRatio: 0.55 },
            { catalogItemId: "vaso-planta-alto", xRatio: 0.05, yRatio: 0.9 },
            { catalogItemId: "pendente-cluster", xRatio: 0.55, yRatio: 0.55 },
            { catalogItemId: "banqueta-alta", xRatio: 0.35, yRatio: 0.4 },
            { catalogItemId: "banqueta-alta", xRatio: 0.55, yRatio: 0.4 },
            { catalogItemId: "banqueta-alta", xRatio: 0.75, yRatio: 0.4 },
            // Objetos sobre a bancada — dão vida à cozinha
            { catalogItemId: "livros-decor", xRatio: 0.15, yRatio: 0.08 },
            { catalogItemId: "planta-suculenta", xRatio: 0.25, yRatio: 0.08 },
            { catalogItemId: "vaso-planta-medio", xRatio: 0.9, yRatio: 0.08 },
            { catalogItemId: "luminaria-piso", xRatio: 0.1, yRatio: 0.5 },
        ],
    },
    closet: {
        label: "Closet completo",
        shape: "U",
        pieces: [
            { description: "closet 1200mm cabideiro duplo Louro Freijó", count: 1, wall: "left" },
            { description: "gaveteiro 800mm Louro Freijó", count: 1, wall: "left" },
            { description: "closet 1200mm prateleiras Louro Freijó", count: 1, wall: "bottom" },
            { description: "gaveteiro 800mm Louro Freijó", count: 1, wall: "bottom" },
            { description: "closet 1200mm cabideiro duplo Louro Freijó", count: 1, wall: "right" },
        ],
        style: "minimalista",
        decor: [
            { catalogItemId: "tapete-passadeira", xRatio: 0.5, yRatio: 0.5 },
            { catalogItemId: "puff", xRatio: 0.5, yRatio: 0.5 },
            { catalogItemId: "luminaria-piso", xRatio: 0.15, yRatio: 0.5 },
            { catalogItemId: "espelho-redondo", xRatio: 0.5, yRatio: 0.08 },
            { catalogItemId: "vaso-planta-medio", xRatio: 0.9, yRatio: 0.9 },
        ],
    },
    dormitorio: {
        label: "Dormitório",
        shape: "L",
        pieces: [
            { description: "roupeiro 2400mm 6 portas Louro Freijó", count: 1, wall: "bottom" },
            { description: "painel de TV 2000mm ripado", count: 1, wall: "right" },
            { description: "gaveteiro 800mm Louro Freijó", count: 1, wall: "right" },
        ],
        decor: [
            { description: "cama queen 1600mm", xRatio: 0.5, yRatio: 0.55 },
            { catalogItemId: "tapete-3x2", xRatio: 0.5, yRatio: 0.55 },
            { catalogItemId: "luminaria-mesa", xRatio: 0.32, yRatio: 0.35 },
            { catalogItemId: "luminaria-mesa", xRatio: 0.68, yRatio: 0.35 },
            { catalogItemId: "vaso-planta-medio", xRatio: 0.08, yRatio: 0.9 },
            { catalogItemId: "quadro-triptico", xRatio: 0.5, yRatio: 0.05 },
            // Criados-mudos ao lado da cama
            { catalogItemId: "criado-mudo", xRatio: 0.28, yRatio: 0.4 },
            { catalogItemId: "criado-mudo", xRatio: 0.72, yRatio: 0.4 },
        ],
    },
    sala: {
        label: "Sala integrada",
        shape: "linear",
        pieces: [
            { description: "painel de TV 2400mm ripado", count: 1, wall: "bottom" },
            { description: "cristaleira 800mm vidro", count: 1, wall: "bottom" },
            { description: "nicho 400mm", count: 3, wall: "bottom" },
        ],
        decor: [
            { catalogItemId: "sofa-ilha", xRatio: 0.5, yRatio: 0.7 },
            { catalogItemId: "mesa-centro", xRatio: 0.5, yRatio: 0.5 },
            { catalogItemId: "tapete-3x2", xRatio: 0.5, yRatio: 0.6 },
            { catalogItemId: "poltrona-decor", xRatio: 0.15, yRatio: 0.7 },
            { catalogItemId: "planta-ficus", xRatio: 0.9, yRatio: 0.85 },
            { catalogItemId: "luminaria-piso", xRatio: 0.1, yRatio: 0.5 },
            { catalogItemId: "quadro-abstrato", xRatio: 0.25, yRatio: 0.05 },
            { catalogItemId: "tv-65", xRatio: 0.5, yRatio: 0.08 },
            { catalogItemId: "livros-decor", xRatio: 0.4, yRatio: 0.5 },
            { catalogItemId: "vaso-planta-medio", xRatio: 0.6, yRatio: 0.5 },
        ],
    },
    escritorio: {
        label: "Home office",
        shape: "linear",
        pieces: [
            { description: "bancada 1600mm Louro Freijó", count: 1, wall: "bottom" },
            { description: "gaveteiro 500mm rodízio Louro Freijó", count: 1, wall: "bottom" },
            { description: "prateleira 800mm", count: 3, wall: "bottom" },
        ],
        decor: [
            { catalogItemId: "cadeira-escritorio", xRatio: 0.4, yRatio: 0.35 },
            { catalogItemId: "tapete-2x1_5", xRatio: 0.5, yRatio: 0.55 },
            { catalogItemId: "planta-costela-adao", xRatio: 0.9, yRatio: 0.85 },
            { catalogItemId: "quadro-abstrato", xRatio: 0.75, yRatio: 0.05 },
        ],
    },
    banheiro: {
        label: "Banheiro",
        shape: "linear",
        pieces: [
            { description: "gaveteiro 800mm suspenso Louro Freijó", count: 1, wall: "bottom" },
            { description: "espelho 800mm", count: 1, wall: "bottom" },
            { description: "nicho 400mm", count: 2, wall: "bottom" },
        ],
        decor: [
            { catalogItemId: "tapete-passadeira", xRatio: 0.5, yRatio: 0.55 },
            { catalogItemId: "planta-suculenta", xRatio: 0.15, yRatio: 0.35 },
        ],
    },
};
export function toolCreateRoomPreset(project, ctx, args) {
    const blueprint = ROOM_BLUEPRINTS[args.preset];
    if (!blueprint) {
        return {
            project,
            summary: `Não conheço o ambiente "${args.preset}". Tente cozinha, closet, dormitório, sala, escritório ou banheiro.`,
            affectedIds: [],
        };
    }
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Selecione um cômodo antes de criar o ambiente.", affectedIds: [] };
    const piecesToPlace = args.pieces && args.pieces.length > 0
        ? args.pieces
        : args.noBlueprintPieces
            ? []
            : blueprint.pieces;
    // ── 1) ANÁLISE PRÉ-GERAÇÃO ─────────────────────────────────────────────
    // Lê o cômodo real (área, proporção, paredes, portas, janelas, luz
    // natural, circulação exigida) ANTES de posicionar qualquer volume.
    const analysis = analyzeRoom(room, {
        environment: args.preset,
        style: args.style ?? blueprint.style ?? null,
    });
    // ── 2) COMPOSIÇÃO DOS VOLUMES ──────────────────────────────────────────
    // Distribui os módulos por equilíbrio, proporção, alinhamento,
    // continuidade, ergonomia e funcionalidade (não por espaço vazio).
    const composition = composeLayout(analysis, piecesToPlace);
    // Tolerância zero: mantém o fallback de forma quando o pedido é grande.
    const shape = args.pieces && args.pieces.length > 3 && composition.shape === "linear"
        ? "L"
        : composition.shape;
    const res = applyLayout(project, ctx, {
        shape,
        pieces: composition.pieces.length > 0 ? composition.pieces : piecesToPlace,
    });
    // ── Decoração contextual ────────────────────────────────────────────────
    // Além dos módulos de marcenaria, o ambiente ganha itens decorativos
    // (tapete, sofá, planta, luminária, quadro, etc.) posicionados por
    // frações do cômodo. Isso deixa o viewport com cara de projeto real,
    // não de biblioteca vazia.
    let next = res.project;
    // Aplica material global a todos os móveis recém-criados. Isso garante
    // que "cozinha preta" / "armário preto" fique realmente preto, sem
    // depender de qualificadores por peça.
    if (args.material) {
        const finish = args.material;
        const currentRoom = getRoom(next, ctx);
        if (currentRoom) {
            const all = furnitureInRoom(currentRoom);
            const paint = resolvePaint(finish);
            next = mutateFurniture(next, ctx, all, (f) => ({
                ...f,
                materialId: paint?.materialId ?? f.materialId,
                params: {
                    ...f.params,
                    color: finish,
                    material: finish,
                    ...(paint ? { __color: paint.colorHex } : {}),
                },
            }));
        }
    }
    let decorPlaced = 0;
    const customPieces = !!(args.pieces && args.pieces.length > 0);
    const skipDecor = customPieces && (args.skipDecorWhenCustom ?? true);
    // Do blueprint mantemos apenas os móveis FUNCIONAIS (cama, sofá, mesa,
    // criado-mudo, banquetas…). A camada puramente decorativa passa a ser
    // decidida pela Inteligência de Composição, com base em estilo, área,
    // circulação e equilíbrio visual.
    const FUNCTIONAL_SUBTYPES = new Set([
        "cama",
        "sofa",
        "mesa",
        "cadeira",
        "poltrona",
        "criado-mudo",
        "aparador",
        "estante",
        "banqueta",
    ]);
    const decorItems = skipDecor ? [] : (blueprint.decor ?? []);
    for (const spec of decorItems) {
        const item = spec.catalogItemId
            ? findCatalogItem(spec.catalogItemId)
            : spec.description
                ? (matchDescription(spec.description)?.item ?? null)
                : null;
        if (!item)
            continue;
        if (!FUNCTIONAL_SUBTYPES.has(String(item.subtype)))
            continue;
        const at = {
            x: Math.round(room.dimensions.width * spec.xRatio),
            y: Math.round(room.dimensions.depth * spec.yRatio),
        };
        next = insertItemIntoProject(next, ctx, item, {
            at,
            overrides: spec.overrides,
            params: spec.rotation != null ? { rotation: spec.rotation } : undefined,
        });
        decorPlaced += 1;
    }
    // ── 3) DECORAÇÃO AUTOMÁTICA COERENTE ───────────────────────────────────
    // Complementa o ambiente sem exagerar: âncora, iluminação, verde, arte,
    // objetos e conforto — todos dentro do repertório do estilo escolhido.
    let qualityLine = "";
    if (!skipDecor) {
        const roomAfter = getRoom(next, ctx);
        const occupied = roomAfter
            ? furnitureInRoom(roomAfter).map((f) => {
                const rot = ((f.rotation % 180) + 180) % 180;
                const swapped = rot > 45 && rot < 135;
                const w = swapped ? f.depth : f.width;
                const d = swapped ? f.width : f.depth;
                return { x: f.x, y: f.y, w, d };
            })
            : [];
        const sizeOf = (id) => {
            const it = findCatalogItem(id);
            if (!it)
                return null;
            return { w: it.parametric.defaults.width, d: it.parametric.defaults.depth };
        };
        const proposed = composeDecor({ analysis, occupied, sizeOf });
        // ── 4) CONTROLE DE QUALIDADE + REORGANIZAÇÃO AUTOMÁTICA ─────────────
        const { decor: finalDecor, report, passes } = rebalanceComposition(analysis, occupied, proposed);
        for (const d of finalDecor) {
            const item = findCatalogItem(d.catalogItemId);
            if (!item)
                continue;
            next = insertItemIntoProject(next, ctx, item, {
                at: { x: d.x, y: d.y },
                params: d.rotation != null ? { rotation: d.rotation } : undefined,
            });
            decorPlaced += 1;
        }
        qualityLine =
            `${describeQuality(report)}` + (passes > 0 ? ` (reorganizado ${passes}×)` : "");
    }
    // ── Auditoria Modo Engenharia ──────────────────────────────────────────
    // Quando o usuário informou peças específicas, contamos exatamente quantas
    // foram solicitadas por módulo e comparamos com o que o motor conseguiu
    // encaixar. O relatório final é EXPLÍCITO — nada de esconder divergências.
    const auditLines = [];
    if (args.pieces && args.pieces.length > 0) {
        let expected = 0;
        for (const p of args.pieces)
            expected += Math.max(1, p.count ?? 1);
        if (res.placed < expected) {
            auditLines.push(`⚠ Auditoria: ${res.placed}/${expected} módulos instalados. ` +
                `Cômodo ${room.dimensions.width}×${room.dimensions.depth}mm ficou apertado — ` +
                `aumente o cômodo ou reduza módulos: ${res.reasons.slice(0, 4).join("; ")}.`);
        }
        else {
            auditLines.push(`✔ Auditoria: ${res.placed}/${expected} módulos com 100% de correspondência.`);
        }
    }
    const parts = [`${res.placed} peças encostadas nas paredes de ${room.name}`];
    if (decorPlaced > 0)
        parts.push(`${decorPlaced} itens de decoração`);
    if (res.skipped > 0)
        parts.push(`${res.skipped} ignoradas`);
    const audit = auditLines.length > 0 ? ` ${auditLines.join(" ")}` : "";
    return {
        project: next,
        summary: `${blueprint.label} criado — ${parts.join(", ")}.${audit}\n` +
            `${describeAnalysis(analysis)}\n` +
            `${composition.notes.join(" · ")}.` +
            (qualityLine ? `\n${qualityLine}` : ""),
        affectedIds: [],
    };
}
// ───── mutações em lote (material/cor/estilo/abrir/etc.) ─────
export function toolChangeMaterial(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Não há móveis para alterar.", affectedIds: [] };
    const paint = resolvePaint(args.material);
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        materialId: paint?.materialId ?? f.materialId,
        params: {
            ...f.params,
            material: args.material,
            ...(paint ? { __color: paint.colorHex } : {}),
        },
    }));
    return {
        project: next,
        summary: `Material trocado para "${args.material}" em ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolChangeColor(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Não há móveis para colorir.", affectedIds: [] };
    const paint = resolvePaint(args.color);
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        materialId: paint?.materialId ?? f.materialId,
        params: {
            ...f.params,
            color: args.color,
            ...(paint ? { __color: paint.colorHex } : {}),
        },
    }));
    return {
        project: next,
        summary: `Acabamento trocado para "${args.color}" em ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolResize(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nenhum móvel selecionado.", affectedIds: [] };
    const factor = args.factor ?? 1;
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        width: Math.max(100, Math.round(args.width ?? f.width * factor)),
        depth: Math.max(100, Math.round(args.depth ?? f.depth * factor)),
        height: Math.max(100, Math.round(args.height ?? f.height * factor)),
    }));
    const label = args.factor
        ? `redimensionamento ×${factor}`
        : `dimensões ${args.width ?? "-"}×${args.depth ?? "-"}×${args.height ?? "-"} mm`;
    return {
        project: next,
        summary: `${targets.length} móvel(is) — ${label}.`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolOpenAll(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    const keyDoor = "open:doors";
    const keyDraw = "open:drawers";
    const next = mutateFurniture(project, ctx, targets, (f) => {
        const params = { ...f.params };
        if (args.target === "doors" || args.target === "all")
            params[keyDoor] = args.open;
        if (args.target === "drawers" || args.target === "all")
            params[keyDraw] = args.open;
        return { ...f, params };
    });
    const label = args.target === "doors" ? "portas" : args.target === "drawers" ? "gavetas" : "portas e gavetas";
    return {
        project: next,
        summary: `${args.open ? "Abri" : "Fechei"} ${label} de ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolToggleLED(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        params: { ...f.params, "led:on": args.on, "led:kelvin": 3000 },
    }));
    if (args.on && targets.length === 0) {
        // se não há móveis, insere fita LED como iluminação de ambiente
        const led = findCatalogItem("led-fita");
        if (led) {
            const ins = insertItemIntoProject(project, ctx, led, {
                at: { x: room.dimensions.width / 2, y: 300 },
            });
            return { project: ins, summary: "LED de ambiente adicionado.", affectedIds: [] };
        }
    }
    return {
        project: next,
        summary: `LEDs ${args.on ? "ligados" : "desligados"} em ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolChangeHardware(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    const key = `eng:hardware:${args.kind}`;
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        params: { ...f.params, [key]: args.value },
    }));
    return {
        project: next,
        summary: `${args.kind} atualizado para "${args.value}" em ${targets.length || "todos os"} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolDuplicate(project, ctx) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nada para duplicar.", affectedIds: [] };
    const next = updateRoom(project, ctx, (r) => {
        let out = r;
        for (const t of targets) {
            const clone = {
                ...t,
                id: makePrimitiveId("furniture"),
                x: t.x + 200,
                y: t.y + 100,
            };
            out = upsertPrimitive(out, clone);
        }
        return out;
    });
    return { project: next, summary: `${targets.length} móvel(is) duplicado(s).`, affectedIds: [] };
}
export function toolRotate(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nada para rotacionar.", affectedIds: [] };
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        rotation: ((f.rotation ?? 0) + args.degrees) % 360,
    }));
    return {
        project: next,
        summary: `${targets.length} móvel(is) rotacionado(s) em ${args.degrees}°.`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolMirror(project, ctx) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nada para espelhar.", affectedIds: [] };
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        params: { ...f.params, "eng:mirrored": !(f.params["eng:mirrored"] === true) },
    }));
    return {
        project: next,
        summary: `${targets.length} móvel(is) espelhado(s).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolRemove(project, ctx) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nada para remover.", affectedIds: [] };
    const next = updateRoom(project, ctx, (r) => removeNodes(r, new Set(targets.map((t) => t.id))));
    return {
        project: next,
        summary: `${targets.length} móvel(is) removido(s).`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolCenter(project, ctx) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Nada para centralizar.", affectedIds: [] };
    const cx = room.dimensions.width / 2;
    const cy = room.dimensions.depth / 2;
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        x: cx - f.width / 2,
        y: cy - f.depth / 2,
    }));
    return {
        project: next,
        summary: `${targets.length} móvel(is) centralizado(s).`,
        affectedIds: [],
    };
}
export function toolSetStyle(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const styleMap = {
        minimalista: { color: "Branco TX", material: "MDF 18mm" },
        classico: { color: "Nogueira", material: "MDF 18mm" },
        industrial: { color: "Grafite", material: "MDF 18mm" },
        luxo: { color: "Carvalho Naturale", material: "MDF 18mm" },
        moderno: { color: "Grafite", material: "MDF 18mm" },
    };
    const style = styleMap[args.style];
    if (!style)
        return { project, summary: `Estilo "${args.style}" não reconhecido.`, affectedIds: [] };
    const targets = furnitureInRoom(room);
    const paint = resolvePaint(style.color);
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        materialId: paint?.materialId ?? f.materialId,
        params: {
            ...f.params,
            color: style.color,
            material: style.material,
            "eng:style": args.style,
            ...(paint ? { __color: paint.colorHex } : {}),
        },
    }));
    return {
        project: next,
        summary: `Estilo "${args.style}" aplicado — ${targets.length} peças harmonizadas.`,
        affectedIds: targets.map((t) => t.id),
    };
}
export function toolPanelRipado(project, ctx, args) {
    const item = findCatalogItem("mod-painel-tv");
    if (!item)
        return { project, summary: "Painel indisponível no catálogo.", affectedIds: [] };
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const next = insertItemIntoProject(project, ctx, item, {
        at: { x: room.dimensions.width / 2, y: 200 },
        overrides: { width: args.width ?? 2400, height: args.height ?? 2400 },
        params: { style: "ripado", "eng:ripado": true },
    });
    return { project: next, summary: "Painel ripado adicionado.", affectedIds: [] };
}
// ───── Frente/porta (vidro, reeded, sólida, aberta) ─────
export function toolSetFrontType(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const all = applySelection(room, ctx);
    const targets = args.subtype
        ? all.filter((f) => {
            const it = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
            return it?.subtype === args.subtype;
        })
        : all;
    if (targets.length === 0) {
        return {
            project,
            summary: `Nenhum ${args.subtype ?? "móvel"} para trocar a frente.`,
            affectedIds: [],
        };
    }
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        params: { ...f.params, frontType: args.type, "eng:front": args.type },
    }));
    const label = args.type === "vidro"
        ? "vidro"
        : args.type === "reeded"
            ? "vidro canelado (reeded)"
            : args.type === "aberto"
                ? "aberto (sem porta)"
                : "sólido";
    return {
        project: next,
        summary: `Frente alterada para ${label} em ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
// ───── Converter item selecionado para outro subtipo (IA editora) ─────
/**
 * "Transforme esse armário em uma torre quente." — troca o CatalogItem
 * subjacente do móvel selecionado preservando posição, rotação e (quando
 * possível) dimensões. Sem seleção, aplica sobre TODOS os móveis do
 * cômodo (raro; útil quando o usuário fala "troque todos os aéreos por
 * cristaleira", por exemplo).
 */
export function toolConvertTo(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0) {
        return { project, summary: "Selecione um móvel para converter.", affectedIds: [] };
    }
    const target = (args.catalogItemId && findCatalogItem(args.catalogItemId)) ||
        (args.description &&
            matchDescription(args.description, {
                subtype: args.subtype,
            })?.item) ||
        (args.subtype && firstItem(args.subtype));
    if (!target) {
        return {
            project,
            summary: `Não encontrei um item compatível com "${args.description ?? args.subtype ?? args.catalogItemId}".`,
            affectedIds: [],
        };
    }
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        catalogItemId: target.id,
        label: target.name,
        // Preserva x/y/rotation; adota dimensões default do novo item quando
        // fazem sentido (torre é bem mais alta que um balcão, por exemplo).
        width: target.parametric.defaults.width ?? f.width,
        depth: target.parametric.defaults.depth ?? f.depth,
        height: target.parametric.defaults.height ?? f.height,
        params: { ...f.params, "eng:convertedFrom": f.catalogItemId ?? "" },
    }));
    return {
        project: next,
        summary: `${targets.length} móvel(is) convertido(s) para ${target.name}.`,
        affectedIds: targets.map((t) => t.id),
    };
}
// ───── Inserção paramétrica a partir de descrição livre (Parte 2) ─────
export function toolInsertDescribed(project, ctx, args) {
    const match = matchDescription(args.description, {
        subtype: args.subtype,
        catalogItemId: args.catalogItemId,
    });
    if (!match) {
        return {
            project,
            summary: `Não consegui casar "${args.description}" com nenhum item do catálogo.`,
            affectedIds: [],
        };
    }
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Selecione um cômodo antes de inserir.", affectedIds: [] };
    const count = Math.max(1, Math.min(20, args.count ?? 1));
    const startX = args.at?.x ?? room.dimensions.width / 2;
    const startY = args.at?.y ?? room.dimensions.depth / 2;
    const overrides = {
        ...match.overrides,
        ...(args.width != null ? { width: args.width } : {}),
        ...(args.height != null ? { height: args.height } : {}),
        ...(args.depth != null ? { depth: args.depth } : {}),
    };
    const params = { ...match.params, ...(args.params ?? {}) };
    const stepBase = overrides.width ?? match.item.parametric.defaults.width;
    const step = stepBase + 40;
    let next = project;
    for (let i = 0; i < count; i++) {
        next = insertItemIntoProject(next, ctx, match.item, {
            at: { x: startX + i * step, y: startY },
            overrides,
            params,
            materialId: match.materialId,
        });
    }
    return {
        project: next,
        summary: `${count}× ${match.item.name} inserido (${match.reasons.join(", ")}).`,
        affectedIds: [],
    };
}
// ───── Alteração cirúrgica de atributos do módulo ─────
/**
 * Altera EXCLUSIVAMENTE os atributos citados pelo usuário (portas, tipo de
 * abertura, gavetas, prateleiras, divisões, maleiro, cabideiros, nichos,
 * espelho, puxador). Tudo o mais no projeto — posição, dimensões, material,
 * demais módulos — permanece intacto.
 */
export function toolSetModuleParams(project, ctx, args) {
    const room = getRoom(project, ctx);
    if (!room)
        return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
    const targets = applySelection(room, ctx);
    if (targets.length === 0)
        return { project, summary: "Não há móveis para alterar.", affectedIds: [] };
    const patch = {};
    const notes = [];
    if (args.doors != null) {
        patch["mod:doors"] = args.doors;
        notes.push(`${args.doors} porta(s)`);
    }
    if (args.drawers != null) {
        patch["mod:drawers"] = args.drawers;
        notes.push(`${args.drawers} gaveta(s)`);
    }
    if (args.shelves != null) {
        patch["mod:shelves"] = args.shelves;
        notes.push(`${args.shelves} prateleira(s)`);
    }
    if (args.divisions != null) {
        patch["mod:divisions"] = args.divisions;
        notes.push(`${args.divisions} divisão(ões)`);
    }
    if (args.opening != null) {
        patch["mod:opening"] = args.opening;
        if (args.opening === "sem-porta")
            patch["eng:front"] = "aberto";
        notes.push(`abertura ${args.opening}`);
    }
    if (args.maleiro != null) {
        patch["mod:maleiro"] = args.maleiro;
        notes.push(args.maleiro ? "maleiro" : "sem maleiro");
    }
    if (args.cabideiros != null) {
        patch["mod:cabideiros"] = args.cabideiros;
        notes.push(`${args.cabideiros} cabideiro(s)`);
    }
    if (args.nichos != null) {
        patch["mod:nichos"] = args.nichos;
        notes.push(`${args.nichos} nicho(s)`);
    }
    if (args.mirror != null) {
        patch["mod:mirror"] = args.mirror;
        if (args.mirror && args.mirrorPosition)
            patch["mod:mirrorPosition"] = args.mirrorPosition;
        notes.push(args.mirror ? "espelho" : "sem espelho");
    }
    if (args.handle != null) {
        patch["mod:handle"] = args.handle;
        notes.push(`puxador ${args.handle}`);
    }
    if (Object.keys(patch).length === 0) {
        return { project, summary: "Nada a alterar.", affectedIds: [] };
    }
    const next = mutateFurniture(project, ctx, targets, (f) => ({
        ...f,
        params: { ...f.params, ...patch },
    }));
    return {
        project: next,
        summary: `Atualizei ${notes.join(", ")} em ${targets.length} móvel(is).`,
        affectedIds: targets.map((t) => t.id),
    };
}
// ───── Layout inteligente (Parte 3) ─────
export function toolLayoutRoom(project, ctx, args) {
    const res = applyLayout(project, ctx, args);
    const shapeLabel = args.shape === "linear"
        ? "linear"
        : args.shape === "L"
            ? "em L"
            : args.shape === "U"
                ? "em U"
                : "paralelo";
    const summary = res.placed === 0
        ? `Nada foi posicionado (${res.reasons.slice(0, 2).join("; ")}).`
        : `Layout ${shapeLabel} aplicado — ${res.placed} peça(s) posicionada(s)${res.skipped ? `, ${res.skipped} ignorada(s)` : ""}.`;
    return { project: res.project, summary, affectedIds: [] };
}
// ───── Acabamento automático (Parte 4) ─────
export function toolApplyFinishing(project, ctx, args) {
    const { result, error } = applyFinishing(project, { environmentId: ctx.environmentId, roomId: ctx.roomId }, { presetId: args.preset, scope: args.scope });
    if (!result) {
        const list = FINISHING_PRESETS.map((p) => `"${p.id}"`).join(", ");
        return {
            project,
            summary: `${error ?? "Preset inválido."} Disponíveis: ${list}.`,
            affectedIds: [],
        };
    }
    const scopeLabel = args.scope && args.scope !== "all" ? ` (${args.scope})` : "";
    return {
        project: result.project,
        summary: result.applied === 0
            ? `Nada no escopo${scopeLabel} para aplicar "${result.preset.label}".`
            : `Acabamento "${result.preset.label}" aplicado em ${result.applied} peça(s)${scopeLabel}.`,
        affectedIds: [],
    };
}
export const PLANNER_TOOL_REGISTRY = [
    {
        name: "insert_item",
        label: "Inserir peça",
        description: "Adiciona um item da biblioteca ao cômodo ativo.",
    },
    {
        name: "insert_described",
        label: "Inserir por descrição",
        description: "Casa uma descrição livre (ex.: 'aéreo 800 vidro reeded louro freijó') com um item real do catálogo e insere já com dimensões e acabamento aplicados.",
    },
    {
        name: "layout_room",
        label: "Layout do cômodo",
        description: "Distribui uma lista de peças ao longo das paredes em configurações linear, L, U ou paralela — respeitando dimensões e folgas.",
    },
    {
        name: "create_room_preset",
        label: "Criar ambiente",
        description: "Monta um ambiente completo (cozinha, closet, etc.).",
    },
    {
        name: "change_material",
        label: "Trocar material",
        description: "Substitui o material dos móveis.",
    },
    {
        name: "change_color",
        label: "Trocar acabamento",
        description: "Substitui a cor/acabamento dos móveis.",
    },
    { name: "resize", label: "Redimensionar", description: "Altera largura/profundidade/altura." },
    { name: "open_all", label: "Abrir/fechar", description: "Abre ou fecha portas e gavetas." },
    {
        name: "toggle_led",
        label: "Iluminação LED",
        description: "Liga/desliga LEDs ou adiciona fita.",
    },
    {
        name: "change_hardware",
        label: "Trocar ferragem",
        description: "Puxadores, dobradiças, corrediças, pistões.",
    },
    { name: "duplicate", label: "Duplicar", description: "Duplica o item selecionado." },
    { name: "rotate", label: "Rotacionar", description: "Gira os móveis em graus." },
    { name: "mirror", label: "Espelhar", description: "Espelha o móvel." },
    { name: "remove", label: "Remover", description: "Remove o móvel." },
    { name: "center", label: "Centralizar", description: "Centraliza no cômodo." },
    {
        name: "set_style",
        label: "Aplicar estilo",
        description: "Minimalista, clássico, industrial, luxo, moderno.",
    },
    {
        name: "panel_ripado",
        label: "Painel ripado",
        description: "Insere um painel decorativo ripado.",
    },
    {
        name: "set_front_type",
        label: "Trocar frente",
        description: "Troca a frente para vidro, reeded, sólido ou aberto.",
    },
    {
        name: "convert_to",
        label: "Converter em outro módulo",
        description: "Converte o móvel selecionado em outro tipo — ex.: 'transforme esse armário em torre quente', 'vira cristaleira'. Preserva posição.",
    },
    {
        name: "apply_finishing",
        label: "Acabamento automático",
        description: "Aplica um preset coordenado (cor, material, tampo, frente, ferragem, LED) em todos os móveis do cômodo — ou apenas nos aéreos, balcões, torre, painel ou tampos.",
    },
    {
        name: "set_module_params",
        label: "Ajustar atributos do módulo",
        description: "Altera apenas os atributos citados (portas, tipo de abertura, gavetas, prateleiras, divisões, maleiro, cabideiros, nichos, espelho, puxador), preservando o resto do projeto.",
    },
];
// Bindings entre nomes e funções — usados pelo executor.
export const TOOL_FUNCTIONS = {
    insert_item: toolInsertItem,
    insert_described: toolInsertDescribed,
    layout_room: toolLayoutRoom,
    create_room_preset: toolCreateRoomPreset,
    change_material: toolChangeMaterial,
    change_color: toolChangeColor,
    resize: toolResize,
    open_all: toolOpenAll,
    toggle_led: toolToggleLED,
    change_hardware: toolChangeHardware,
    duplicate: (p, c) => toolDuplicate(p, c),
    rotate: toolRotate,
    mirror: (p, c) => toolMirror(p, c),
    remove: (p, c) => toolRemove(p, c),
    center: (p, c) => toolCenter(p, c),
    set_style: toolSetStyle,
    panel_ripado: toolPanelRipado,
    set_front_type: toolSetFrontType,
    convert_to: toolConvertTo,
    apply_finishing: toolApplyFinishing,
    set_module_params: toolSetModuleParams,
};
// Sinal explícito de que `fromPrimitive` e `PlannerEnvironment` são reexportados
// apenas para conveniência de futuras tools sem tocar o barrel do domínio.
export { fromPrimitive };
