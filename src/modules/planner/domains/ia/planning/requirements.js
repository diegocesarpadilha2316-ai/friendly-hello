import { detectRoomType } from "./classify";
const norm = (s) => s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const STYLES = [
    "moderno",
    "minimalista",
    "classico",
    "industrial",
    "escandinavo",
    "rustico",
    "contemporaneo",
    "luxo",
];
const MATERIALS = [
    "freijo",
    "carvalho",
    "nogueira",
    "off white",
    "branco",
    "grafite",
    "preto",
    "amendoa",
    "cinza",
    "ripado",
];
/** Converte um número com unidade em milímetros inteiros. */
function toMm(value, unit) {
    const u = (unit ?? "m").toLowerCase();
    if (u.startsWith("mm"))
        return Math.round(value);
    if (u.startsWith("cm"))
        return Math.round(value * 10);
    return Math.round(value * 1000);
}
/** "3 por 4 metros", "3x4 m", "300 x 400 cm". */
function parseDimensions(text) {
    const re = /(\d+(?:[.,]\d+)?)\s*(?:x|por)\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|metros?)?/i;
    const m = text.match(re);
    if (!m)
        return null;
    const a = Number(m[1].replace(",", "."));
    const b = Number(m[2].replace(",", "."));
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return null;
    const unit = m[3]?.toLowerCase().startsWith("metro") ? "m" : m[3];
    const width = toMm(a, unit);
    const depth = toMm(b, unit);
    if (width < 600 || depth < 600 || width > 30000 || depth > 30000)
        return null;
    return { width, depth };
}
function parseHeight(text) {
    const m = text.match(/(?:pe[- ]?direito|altura)\D{0,12}(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
    if (!m)
        return null;
    const value = Number(m[1].replace(",", "."));
    if (!Number.isFinite(value))
        return null;
    const mm = toMm(value, m[2]);
    return mm >= 1800 && mm <= 6000 ? mm : null;
}
export function extractFacts(message, project, memory, hasSelection) {
    const t = norm(message);
    const dims = parseDimensions(t);
    // Comparação por radical: "contemporânea" também casa com "contemporaneo".
    const style = STYLES.find((s) => t.includes(s) || t.includes(s.slice(0, Math.max(5, s.length - 1)))) ??
        memory?.style ??
        null;
    const material = MATERIALS.find((m) => t.includes(m)) ??
        memory?.materials[0]?.value ??
        project?.briefing?.style ??
        null;
    const wall = t.match(/\bparede\s+(esquerda|direita|frontal|fundo|norte|sul|leste|oeste)\b/)?.[1] ?? null;
    return {
        widthMm: dims?.width ?? null,
        depthMm: dims?.depth ?? null,
        heightMm: parseHeight(t),
        style,
        material,
        wall,
        hasSelection,
    };
}
const REFERS_TO_WALL = /\b(nessa|nesta|essa|esta|aquela)\s+parede\b/i;
/**
 * Regras:
 *  - medidas críticas, parede alvo e material específico NUNCA são
 *    assumidos em silêncio;
 *  - pé-direito, profundidade padrão e estilo podem ser inferidos com
 *    segurança, mas a suposição fica sempre visível ao usuário.
 */
export function analyzeRequirements(input) {
    const { message, kind, facts, roomHasDimensions } = input;
    const missing = [];
    const assumptions = [];
    if (kind === "projeto_completo") {
        // Único dado realmente indispensável: qual ambiente projetar.
        if (!detectRoomType(message)) {
            missing.push({
                key: "ambiente",
                question: "Qual ambiente você deseja criar: cozinha, quarto, sala ou closet?",
                level: "obrigatoria",
            });
        }
        // Medidas, estilo e material nunca travam: viram suposições visíveis.
        if (!facts.widthMm && !facts.depthMm && !roomHasDimensions) {
            assumptions.push({
                key: "dimensoes",
                label: "Como você não informou as medidas, usei 3,50 m x 3,00 m como base.",
                value: "3500x3000",
                editable: true,
            });
        }
        if (!facts.style) {
            assumptions.push({
                key: "estilo",
                label: "Como você não informou o estilo, usei contemporâneo neutro.",
                value: "moderno",
                editable: true,
            });
        }
        if (!facts.material) {
            assumptions.push({
                key: "material",
                label: "Acabamento padrão inteligente aplicado (madeira clara com off white).",
                value: "off white",
                editable: true,
            });
        }
    }
    if (kind === "plano_intermediario" && REFERS_TO_WALL.test(message) && !facts.wall && !facts.hasSelection) {
        missing.push({
            key: "parede",
            question: "Em qual parede? (esquerda, direita, frontal ou fundo)",
            level: "obrigatoria",
        });
    }
    if (!facts.heightMm) {
        assumptions.push({
            key: "pe_direito",
            label: "Vou considerar pé-direito de 2,70 m porque a altura não foi informada.",
            value: "2700",
            editable: true,
        });
    }
    if (kind === "projeto_completo" && facts.style) {
        assumptions.push({
            key: "estilo",
            label: `Estilo aplicado: ${facts.style}.`,
            value: facts.style,
            editable: true,
        });
    }
    if (facts.material) {
        assumptions.push({
            key: "material",
            label: `Acabamento base: ${facts.material} (confirmado no catálogo antes de aplicar).`,
            value: facts.material,
            editable: true,
        });
    }
    // Perguntas por turno: no máximo 2, priorizando obrigatórias.
    const ordered = [...missing].sort((a, b) => (a.level === "obrigatoria" ? -1 : 1));
    return { missing: ordered.slice(0, 2), assumptions };
}
