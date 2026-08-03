import { countOf } from "./spec";
const norm = (s) => s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const EDIT_VERB = /\b(?:troqu\w*|troca\w*|mud\w*|alter\w*|aument\w*|diminu\w*|reduz\w*|colo[cq]\w*|adicion\w*|poe|ponha|tir[ae]\w*|remov\w*|deix\w*|pass[ae]\w*|ajust\w*|defin\w*|convert\w*|transform\w*)\b/;
/** Criação explícita de um móvel novo — não é edição. */
const CREATE_VERB = /\b(?:cri[ae]|criar|faz|faca|fazer|monte|montar|gere|gerar|projete|projetar)\b|\bquero (?:um|uma)\b/;
function toMm(value, unit) {
    if (unit === "mm")
        return Math.round(value);
    if (unit === "cm")
        return Math.round(value * 10);
    if (unit === "m")
        return Math.round(value * 1000);
    if (value < 10)
        return Math.round(value * 1000);
    if (value < 100)
        return Math.round(value * 10);
    return Math.round(value);
}
function dimension(t, labels) {
    const label = labels.join("|");
    const re = new RegExp(`(?:${label})\\s*(?:para|pra|em|de|a)?\\s*(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?`);
    const alt = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?\\s*(?:de\\s*)?(?:${label})`);
    const m = t.match(re) ?? t.match(alt);
    if (!m)
        return null;
    const value = Number(m[1].replace(",", "."));
    if (!Number.isFinite(value))
        return null;
    const mm = toMm(value, m[2]);
    return mm >= 40 && mm <= 6000 ? mm : null;
}
const COLORS = [
    { color: "Louro Freijó", re: /louro\s*freijo/ },
    { color: "Freijó", re: /freijo/ },
    { color: "Nogueira", re: /nogueira/ },
    { color: "Carvalho", re: /carvalho/ },
    { color: "Off White", re: /off\s*-?\s*white/ },
    { color: "Branco Fosco", re: /branco\s*fosco/ },
    { color: "Branco TX", re: /branco|branca/ },
    { color: "Preto Fosco", re: /preto\s*fosco|preta\s*fosca/ },
    { color: "Preto Absoluto", re: /preto|preta/ },
    { color: "Grafite", re: /grafite|chumbo/ },
    { color: "Cinza Cristal", re: /cinza/ },
    { color: "Cumaru", re: /cumaru/ },
    { color: "Imbuia", re: /imbuia/ },
];
const HANDLES = [
    { handle: "perfil-gola", label: "perfil gola", re: /perfil\s*gola|\bgola\b|perfil\s*linha/ },
    { handle: "cava", label: "cava usinada", re: /\bcava\b|usinad/ },
    { handle: "tubular", label: "tubular", re: /tubular|barra|\balca\b/ },
    { handle: "botao", label: "botão", re: /botao/ },
    { handle: "none", label: "push (sem puxador)", re: /push|toque|sem\s*puxador/ },
];
/**
 * Extrai as alterações citadas. Retorna lista vazia quando a frase não é
 * um comando de edição — nesse caso o interpretador segue o fluxo normal.
 */
export function parseEdits(input) {
    const t = norm(input);
    if (!EDIT_VERB.test(t))
        return [];
    if (CREATE_VERB.test(t))
        return [];
    const out = [];
    const mod = {};
    const changes = [];
    // ── abertura das portas ──
    if (/de\s*correr|deslizante/.test(t)) {
        mod.opening = "correr";
        changes.push("portas de correr");
    }
    else if (/sanfonad|dobravel/.test(t)) {
        mod.opening = "sanfonada";
        changes.push("portas sanfonadas");
    }
    else if (/basculante|aventos/.test(t)) {
        mod.opening = "basculante";
        changes.push("portas basculantes");
    }
    else if (/de\s*abrir|batente/.test(t)) {
        mod.opening = "abrir";
        changes.push("portas de abrir");
    }
    // ── contagem de portas ──
    const doors = countOf(t, "porta");
    if (doors != null && /(\d+|uma|duas|tres|quatro|cinco|seis)\s*porta/.test(t)) {
        mod.doors = doors;
        changes.push(`${doors} porta(s)`);
    }
    // ── gavetas ──
    const drawers = countOf(t, "gaveta");
    if (drawers != null) {
        mod.drawers = drawers;
        changes.push(`${drawers} gaveta(s)`);
    }
    // ── prateleiras / divisões / nichos / cabideiros ──
    const shelves = countOf(t, "prateleir");
    if (shelves != null) {
        mod.shelves = shelves;
        changes.push(`${shelves} prateleira(s)`);
    }
    const divisions = countOf(t, "(?:divis|modul)");
    if (divisions != null) {
        mod.divisions = divisions;
        changes.push(`${divisions} divisão(ões)`);
    }
    if (/nicho/.test(t)) {
        const n = countOf(t, "nicho") ?? 1;
        mod.nichos = /tire|remova|remover|sem\s*nicho/.test(t) ? 0 : n;
        changes.push(mod.nichos === 0 ? "sem nichos" : `${n} nicho(s)`);
    }
    if (/cabideir/.test(t)) {
        const n = countOf(t, "cabideir") ?? 1;
        mod.cabideiros = /tire|remova|remover|sem\s*cabideir/.test(t) ? 0 : n;
        changes.push(mod.cabideiros === 0 ? "sem cabideiro" : `${n} cabideiro(s)`);
    }
    // ── maleiro ──
    if (/maleir/.test(t)) {
        const remove = /tire|remova|remover|sem\s*maleir/.test(t);
        mod.maleiro = !remove;
        changes.push(remove ? "sem maleiro" : "maleiro superior");
    }
    // ── espelho ──
    if (/espelho|espelhad/.test(t)) {
        const remove = /tire|remova|remover|sem\s*espelho/.test(t);
        if (remove) {
            mod.mirror = false;
            changes.push("sem espelho");
        }
        else {
            mod.mirror = true;
            mod.mirrorPosition = /central|do\s*meio/.test(t)
                ? "central"
                : /todas/.test(t)
                    ? "todas"
                    : /interna|por\s*dentro/.test(t)
                        ? "interna"
                        : "central";
            changes.push(`espelho (${String(mod.mirrorPosition)})`);
        }
    }
    // ── puxador ──
    const handle = HANDLES.find((h) => h.re.test(t));
    if (handle && /puxador|ferragem|gola|cava|push|botao|tubular/.test(t)) {
        mod.handle = handle.handle;
        changes.push(`puxador ${handle.label}`);
    }
    if (Object.keys(mod).length > 0) {
        out.push({
            tool: "set_module_params",
            args: mod,
            change: changes.join(", "),
        });
    }
    // ── dimensões (tool própria, preserva posição) ──
    const width = dimension(t, ["largura", "larg", "comprimento"]);
    const height = dimension(t, ["altura", "alto"]);
    const depth = dimension(t, ["profundidade", "prof", "fundo"]);
    if (width != null || height != null || depth != null) {
        const args = {};
        const label = [];
        if (width != null) {
            args.width = width;
            label.push(`largura ${width} mm`);
        }
        if (height != null) {
            args.height = height;
            label.push(`altura ${height} mm`);
        }
        if (depth != null) {
            args.depth = depth;
            label.push(`profundidade ${depth} mm`);
        }
        out.push({ tool: "resize", args, change: label.join(", ") });
    }
    // ── acabamento / cor ──
    if (/acabamento|cor\b|pintur|laca|cores/.test(t)) {
        const color = COLORS.find((c) => c.re.test(t));
        if (color) {
            out.push({
                tool: "change_color",
                args: { color: color.color },
                change: `acabamento ${color.color}`,
            });
        }
    }
    // ── frente em vidro / canelado ──
    if (/vidro\s*canelad|reeded|canelad/.test(t)) {
        out.push({ tool: "set_front_type", args: { type: "reeded" }, change: "frente canelada" });
    }
    else if (/vidro/.test(t)) {
        out.push({ tool: "set_front_type", args: { type: "vidro" }, change: "frente em vidro" });
    }
    return out;
}
/** Resumo natural das alterações aplicadas (uma frase). */
export function describeEdits(edits) {
    return edits.map((e) => e.change).filter(Boolean).join(", ");
}
