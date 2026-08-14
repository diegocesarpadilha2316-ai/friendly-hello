import { describe, expect, it } from "vitest";
import { MaterialRegistry } from "./registry/MaterialRegistry";
import { DecorAssetRegistry } from "./registry/AssetRegistry";

describe("Kitchen V10 visual systems", () => {
  it("exposes physical UV profiles and stone definitions without replacing the common registry", () => {
    const freijo = MaterialRegistry.get("mdf-freijo");
    const calacatta = MaterialRegistry.get("stone-porcelain");
    expect(freijo?.physicalSizeMm?.x).toBeGreaterThan(0);
    expect(freijo?.uvTransform?.scaleX).toBeGreaterThan(0);
    expect(freijo?.maps?.baseColorUrl).toBe("/assets/v10/wood-freijo-seamless.jpg");
    expect(calacatta?.category).toBe("stone");
    expect(calacatta?.stone?.thicknessMm).toBe(12);
    expect(calacatta?.stone?.veinDirection).toBe("length");
    expect(MaterialRegistry.get("stone-quartzite")?.maps?.baseColorUrl).toBe(
      "/assets/v10/stone-quartzite-taj-seamless.jpg",
    );
    expect(MaterialRegistry.get("metal-inox")?.maps?.baseColorUrl).toBe(
      "/assets/v10/stainless-brushed-seamless.jpg",
    );
  });

  it("preserves official catalog metadata without inventing commercial verification", () => {
    const freijo = MaterialRegistry.get("mdf-freijo");
    const black = MaterialRegistry.get("mdf-black");
    const taj = MaterialRegistry.get("stone-quartzite");
    expect(freijo?.manufacturer).toBe("ARAUCO");
    expect(freijo?.pattern).toBe("Louro Freijó");
    expect(freijo?.catalogStatus).toBe("verified");
    expect(black?.catalogStatus).toBe("unverified");
    expect(taj?.catalogStatus).toBe("unverified");
  });

  it("keeps decorative/appliance assets lazy and explicit about procedural geometry", async () => {
    const assets = DecorAssetRegistry.list();
    const oven = await DecorAssetRegistry.lazyLoad("appliance-oven");
    expect(assets.some((asset) => asset.id === "decor-fruit-bowl")).toBe(true);
    expect(oven?.implementation).toBe("procedural");
    expect(oven?.tags).toContain("procedural");
    expect(oven?.tags).not.toContain("placeholder");
    expect(oven?.modelUrl).toBeNull();
    expect(oven?.dimensionsMm.height).toBe(600);
  });
});
