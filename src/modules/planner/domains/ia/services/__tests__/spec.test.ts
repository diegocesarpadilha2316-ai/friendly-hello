import { describe, expect, it } from "vitest";
import { interpret } from "../interpreter";
import { buildFurnitureSpec, specToParams } from "../spec";
import { parseEdits } from "../edits";

const PEDIDO =
  "Crie um roupeiro de 2,70 m de largura, 2,40 m de altura, com 3 portas de correr, espelho na porta central, maleiro superior, duas gavetas internas e MDF Freijó.";

describe("Ficha Técnica", () => {
  it("extrai todos os atributos do pedido canônico", () => {
    const s = buildFurnitureSpec(PEDIDO);
    expect(s.type).toBe("roupeiro");
    expect(s.environment).toBe("dormitorio");
    expect(s.width).toBe(2700);
    expect(s.height).toBe(2400);
    expect(s.doors).toBe(3);
    expect(s.opening).toBe("correr");
    expect(s.drawers).toBe(2);
    expect(s.maleiro).toBe(true);
    expect(s.mirror).toEqual({ has: true, position: "central" });
    expect(s.color).toBe("Freijó");
    expect(s.material).toBe("MDF 18mm");
  });

  it("informa suposições quando faltam dados não indispensáveis", () => {
    const s = buildFurnitureSpec("quero um roupeiro de 3 portas");
    expect(s.missing).toHaveLength(0);
    expect(s.assumptions.length).toBeGreaterThan(0);
    expect(s.doors).toBe(3);
  });

  it("marca o tipo como indispensável quando ausente", () => {
    expect(buildFurnitureSpec("faz algo bonito ali").missing).toContain("tipo de móvel");
  });

  it("gera params do módulo", () => {
    const p = specToParams(buildFurnitureSpec(PEDIDO));
    expect(p["mod:doors"]).toBe(3);
    expect(p["mod:opening"]).toBe("correr");
    expect(p["mod:mirror"]).toBe(true);
    expect(p["mod:maleiro"]).toBe(true);
  });
});

describe("Interpretação", () => {
  it("cria o móvel exato pedido", () => {
    const r = interpret(PEDIDO);
    expect(r.type).toBe("command");
    if (r.type !== "command") return;
    const i = r.intents[0];
    expect(i.tool).toBe("insert_described");
    expect(i.args.width).toBe(2700);
    expect((i.args.params as Record<string, unknown>)["mod:doors"]).toBe(3);
  });

  it("mantém o fluxo de ambiente completo", () => {
    const r = interpret("Quero uma cozinha moderna");
    expect(r.type).toBe("command");
    if (r.type !== "command") return;
    expect(r.intents[0].tool).toBe("create_room_preset");
  });
});

describe("Alterações cirúrgicas", () => {
  const only = (text: string) => parseEdits(text);

  it("troca somente a abertura", () => {
    const e = only("Troque as portas por portas de correr.");
    expect(e).toHaveLength(1);
    expect(e[0].tool).toBe("set_module_params");
    expect(e[0].args).toEqual({ opening: "correr" });
  });

  it("adiciona espelho central", () => {
    const e = only("Adicione espelho na porta central.");
    expect(e[0].args).toMatchObject({ mirror: true, mirrorPosition: "central" });
  });

  it("altera somente a largura", () => {
    const e = only("Aumente a largura para 3 metros.");
    expect(e).toHaveLength(1);
    expect(e[0].tool).toBe("resize");
    expect(e[0].args).toEqual({ width: 3000 });
  });

  it("define gavetas internas", () => {
    const e = only("Coloque 4 gavetas internas.");
    expect(e[0].args).toEqual({ drawers: 4 });
  });

  it("muda apenas o acabamento", () => {
    const e = only("Mude o acabamento para preto fosco.");
    expect(e).toHaveLength(1);
    expect(e[0].tool).toBe("change_color");
    expect(e[0].args).toEqual({ color: "Preto Fosco" });
  });

  it("não confunde criação com edição", () => {
    expect(only("Crie uma cozinha moderna")).toHaveLength(0);
  });
});
