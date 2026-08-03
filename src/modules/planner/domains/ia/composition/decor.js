import { styleProfile } from "./styles";
const MARGIN = 250;
function rectsOverlap(a, b, pad = 0) {
    return (a.x - pad < b.x + b.w &&
        a.x + a.w + pad > b.x &&
        a.y - pad < b.y + b.d &&
        a.y + a.d + pad > b.y);
}
function fits(candidate, occupied, pad) {
    return !occupied.some((o) => rectsOverlap(candidate, o, pad));
}
/** Distribuicao alvo por papel, em funcao da area util e do estilo. */
function decorBudget(analysis) {
    const density = styleProfile(analysis.style).density;
    const base = Math.max(3, Math.min(11, Math.round(analysis.areaM2 / 2.1)));
    const total = Math.max(2, Math.round(base * density));
    const verde = Math.max(1, Math.round(total * 0.28));
    const objeto = Math.max(1, Math.round(total * 0.26));
    const arte = Math.max(1, Math.round(total * 0.16));
    const iluminacao = Math.max(1, Math.round(total * 0.18));
    const conforto = analysis.areaM2 >= 12 ? 1 : 0;
    const ancora = analysis.areaM2 >= 6 ? 1 : 0;
    return { ancora, iluminacao, verde, arte, objeto, conforto };
}
/** Zonas proibidas: giro de porta e faixa de circulacao central. */
function forbiddenZones(analysis) {
    const zones = [];
    const c = analysis.circulationMin;
    for (const o of analysis.openings) {
        if (o.role !== "door")
            continue;
        const span = o.width + 600;
        switch (o.wall) {
            case "bottom":
                zones.push({ x: o.center - span / 2, y: 0, w: span, d: c + 300 });
                break;
            case "top":
                zones.push({ x: o.center - span / 2, y: analysis.depth - c - 300, w: span, d: c + 300 });
                break;
            case "left":
                zones.push({ x: 0, y: o.center - span / 2, w: c + 300, d: span });
                break;
            case "right":
                zones.push({ x: analysis.width - c - 300, y: o.center - span / 2, w: c + 300, d: span });
                break;
        }
    }
    return zones;
}
function buildCandidates(analysis) {
    const step = 250;
    const cx = analysis.width / 2;
    const cy = analysis.depth / 2;
    const out = [];
    for (let x = MARGIN; x <= analysis.width - MARGIN; x += step) {
        for (let y = MARGIN; y <= analysis.depth - MARGIN; y += step) {
            out.push({
                x,
                y,
                wallDist: Math.min(x, y, analysis.width - x, analysis.depth - y),
                centerDist: Math.hypot(x - cx, y - cy),
                quadrant: (x < cx ? 0 : 1) + (y < cy ? 0 : 2),
            });
        }
    }
    return out;
}
/** Preferencia espacial de cada papel decorativo. */
function affinity(role, c, analysis) {
    const maxDist = Math.hypot(analysis.width, analysis.depth) / 2;
    const centered = 1 - c.centerDist / maxDist;
    const peripheral = Math.min(1, c.wallDist / 1200);
    switch (role) {
        case "ancora":
            return centered * 2;
        case "iluminacao":
            return centered * 1.4 + (1 - peripheral) * 0.3;
        case "verde":
            return (1 - peripheral) * 1.6; // cantos e junto as paredes
        case "arte":
            return (1 - peripheral) * 2; // encostada na parede
        case "objeto":
            return (1 - peripheral) * 1.2 + centered * 0.2;
        case "conforto":
            return centered * 0.8 + peripheral * 0.6;
    }
}
/**
 * Escolhe e posiciona a decoracao. Retorna posicoes ja validadas contra
 * moveis, portas e faixa de circulacao — o Engine so precisa inserir.
 */
export function composeDecor(input) {
    const { analysis, sizeOf } = input;
    const profile = styleProfile(analysis.style);
    const budget = decorBudget(analysis);
    const zones = forbiddenZones(analysis);
    const candidates = buildCandidates(analysis);
    const placed = [];
    const occupied = [...input.occupied, ...zones];
    const quadrantCount = [0, 0, 0, 0];
    const usedIds = new Map();
    const maxRepeat = input.maxRepeat ?? 2;
    const roles = ["ancora", "conforto", "iluminacao", "verde", "arte", "objeto"];
    for (const role of roles) {
        const quota = budget[role];
        const pool = profile.pools[role];
        if (quota <= 0 || pool.length === 0)
            continue;
        for (let n = 0; n < quota; n++) {
            // Repertorio do estilo, evitando repeticao excessiva do mesmo objeto.
            const id = pool.find((candidateId) => (usedIds.get(candidateId) ?? 0) < maxRepeat) ??
                pool[n % pool.length];
            const size = sizeOf(id);
            if (!size)
                continue;
            // Ancora (tapete) pode ficar sob os moveis soltos — folga menor.
            const pad = role === "ancora" ? -200 : role === "objeto" ? 60 : 120;
            let best = null;
            for (const c of candidates) {
                const rect = { x: c.x - size.w / 2, y: c.y - size.d / 2, w: size.w, d: size.d };
                if (rect.x < 60 || rect.y < 60)
                    continue;
                if (rect.x + rect.w > analysis.width - 60 || rect.y + rect.d > analysis.depth - 60)
                    continue;
                if (!fits(rect, occupied, pad))
                    continue;
                // Equilibrio: penaliza quadrante ja carregado de decoracao.
                const balance = 1 / (1 + quadrantCount[c.quadrant]);
                const score = affinity(role, c, analysis) + balance * 0.8;
                if (!best || score > best.score)
                    best = { c, score };
            }
            if (!best)
                break;
            const rect = {
                x: best.c.x - size.w / 2,
                y: best.c.y - size.d / 2,
                w: size.w,
                d: size.d,
            };
            // Ancora nao bloqueia os proximos itens (fica no piso).
            if (role !== "ancora")
                occupied.push(rect);
            quadrantCount[best.c.quadrant] += 1;
            usedIds.set(id, (usedIds.get(id) ?? 0) + 1);
            placed.push({
                catalogItemId: id,
                role,
                x: Math.round(best.c.x),
                y: Math.round(best.c.y),
                reason: `${role} · estilo ${analysis.style} (${profile.language})`,
            });
        }
    }
    return placed;
}
