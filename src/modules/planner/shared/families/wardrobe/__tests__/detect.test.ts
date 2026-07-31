import { describe, expect, it } from "vitest";
import { resolveFurnitureRenderer, isWardrobeSubtype, normalizeSubtype } from "../detect";

const wardrobe = (i: Parameters<typeof resolveFurnitureRenderer>[0]) =>
  resolveFurnitureRenderer(i).renderer;

describe("roteamento de renderer — nomes legados", () => {
  it("aceita roupeiro, guarda-roupa, guarda roupa e wardrobe", () => {
    for (const s of ["roupeiro", "Roupeiro", "guarda-roupa", "guarda roupa", "Guarda_Roupa", "wardrobe"]) {
      expect(wardrobe({ subtype: s })).toBe("wardrobe");
    }
  });

  it("closet fechado vira roupeiro; closet aberto continua legado", () => {
    expect(wardrobe({ subtype: "closet", params: { "mod:doors": 4 } })).toBe("wardrobe");
    expect(wardrobe({ subtype: "closet", params: { "eng:front": "aberto" } })).toBe("cabinet");
    expect(wardrobe({ subtype: "closet", params: { "mod:opening": "sem-porta" } })).toBe("cabinet");
  });

  it("armário genérico com catálogo de roupeiro é convertido", () => {
    expect(wardrobe({ subtype: "armario", catalogItemId: "mod-roupeiro-3-portas" })).toBe("wardrobe");
    // "balcao-600" agora é família cozinha (convertida), não mais legado.
    expect(wardrobe({ subtype: "armario", catalogItemId: "balcao-600" })).toBe("kitchen");
  });

  it("nó antigo com mod:* é marcado como conversão legada", () => {
    const d = resolveFurnitureRenderer({
      subtype: "guarda roupa",
      params: { "mod:doors": 3, "mod:drawers": 4, "eng:thicknessMm": 18 },
    });
    expect(d.renderer).toBe("wardrobe");
    expect(d.legacyConverted).toBe(true);
  });

  it("nó novo com ficha paramétrica não é marcado como legado", () => {
    const d = resolveFurnitureRenderer({ subtype: "roupeiro", params: { doors: 2, opening: "abrir" } });
    expect(d.renderer).toBe("wardrobe");
    expect(d.legacyConverted).toBe(false);
  });

  it("balcão passa a ser família cozinha", () => {
    const d = resolveFurnitureRenderer({ subtype: "balcao" });
    expect(d.renderer).toBe("kitchen");
  });

  it("outras famílias seguem no CabinetMesh com motivo de fallback", () => {
    const d = resolveFurnitureRenderer({ subtype: "estante" });
    expect(d.renderer).toBe("cabinet");
    expect(d.reason).toMatch(/não pertence/);
  });

  it("normalização e alias público", () => {
    expect(normalizeSubtype(" Guarda  Roupa ")).toBe("guarda-roupa");
    expect(isWardrobeSubtype("guarda roupa")).toBe(true);
    expect(isWardrobeSubtype("balcao")).toBe(false);
  });
});