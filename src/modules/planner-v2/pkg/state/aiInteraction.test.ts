import { beforeEach, describe, expect, it } from "vitest";
import "../../library";
import { usePlannerStore } from "./usePlannerStore";

describe("IA do Planner V2 — interação natural", () => {
  beforeEach(() => {
    usePlannerStore.getState().newProject();
  });

  it("interpreta uma cozinha e constrói módulos paramétricos com resposta específica", () => {
    usePlannerStore
      .getState()
      .sendMessage(
        "crie uma cozinha com balcão 800, gaveteiro 600, pia 1200, MDF 18 mm e puxador cava para marcenaria",
      );

    const state = usePlannerStore.getState();
    const assistant = state.messages.at(-1)?.content ?? "";
    expect(state.instances.length).toBeGreaterThanOrEqual(3);
    expect(assistant).toContain("Projeto atualizado");
    expect(assistant).toContain("MDF 18 mm");
    expect(assistant).toContain("handle-cava");
    expect(assistant).not.toContain("Entendi o pedido");
  });

  it("abre o Plano de Corte e responde diferente de uma criação", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors");
    expect(id).toBeTruthy();

    store.sendMessage("mostrar Plano de Corte e nesting");

    const state = usePlannerStore.getState();
    const assistant = state.messages.at(-1)?.content ?? "";
    expect(state.rightTab).toBe("fabrication");
    expect(assistant).toContain("Abri o Plano de Corte");
    expect(assistant).toContain("1 módulo");
  });

  it("não repete a resposta fixa para um comando desconhecido", () => {
    usePlannerStore.getState().sendMessage("qual é o status da minha fábrica hoje?");
    const assistant = usePlannerStore.getState().messages.at(-1)?.content ?? "";
    expect(assistant).toContain("Recebi");
    expect(assistant).toContain("operação reconhecida");
    expect(assistant).not.toBe(
      "Entendi o pedido. Posso executar materiais, ilha, iluminação, Render Final e vídeo quando o comando corresponder a uma operação disponível.",
    );
  });
});
