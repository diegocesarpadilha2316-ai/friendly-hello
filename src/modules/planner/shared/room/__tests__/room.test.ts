import { describe, expect, it } from "vitest";
import {
  ROOM_PRESETS,
  buildRoomArchitecture,
  buildRoomDiagnostics,
  createRoomQuery,
  roomPresetFor,
  validateRoom,
  validateRoomFurniture,
  type RoomArchitectureSpec,
  type RoomFurnitureBox,
} from "..";

const base: RoomArchitectureSpec = {
  id: "r",
  widthMm: 4000,
  depthMm: 3000,
  heightMm: 2700,
  wallThicknessMm: 150,
  doors: [{ id: "d1", wall: "front", offsetMm: 300, widthMm: 800, heightMm: 2100 }],
  windows: [
    { id: "w1", wall: "back", offsetMm: 1200, widthMm: 1400, heightMm: 1100, sillHeightMm: 1000 },
  ],
};

describe("room architecture — geometria base", () => {
  const arch = buildRoomArchitecture(base);

  it("gera 4 paredes com espessura real e encontros", () => {
    expect(arch.walls).toHaveLength(4);
    for (const w of arch.walls) {
      expect(w.thicknessMm).toBe(150);
      expect(w.joints.length).toBe(2);
    }
  });

  it("mantém o retângulo interno em 0..W × 0..D", () => {
    expect(arch.inner).toMatchObject({ minX: 0, maxX: 4000, minZ: 0, maxZ: 3000 });
  });

  it("paredes ficam FORA do retângulo interno", () => {
    const front = arch.walls.find((w) => w.side === "front")!;
    expect(front.innerFaceMm).toBe(0);
    expect(front.outerFaceMm).toBe(-150);
    const right = arch.walls.find((w) => w.side === "right")!;
    expect(right.innerFaceMm).toBe(4000);
    expect(right.outerFaceMm).toBe(4150);
  });

  it("piso tem espessura real e topo em Y=0", () => {
    expect(arch.floor.levelMm).toBe(0);
    expect(arch.floor.thicknessMm).toBeGreaterThan(0);
  });

  it("teto fica na altura livre", () => {
    expect(arch.ceiling.levelMm).toBe(2700);
  });

  it("não gera issues para uma spec válida", () => {
    expect(arch.issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});

describe("room architecture — aberturas", () => {
  const arch = buildRoomArchitecture(base);

  it("cria recorte real de porta do piso ao topo do vão", () => {
    const front = arch.walls.find((w) => w.side === "front")!;
    expect(front.cutouts).toHaveLength(1);
    expect(front.cutouts[0]).toMatchObject({ kind: "door", startMm: 300, endMm: 1100, bottomMm: 0, topMm: 2100 });
  });

  it("cria recorte de janela respeitando o peitoril", () => {
    const back = arch.walls.find((w) => w.side === "back")!;
    expect(back.cutouts[0]).toMatchObject({ kind: "window", bottomMm: 1000, topMm: 2100 });
  });

  it("gera peitoril para cada janela, avançando para dentro", () => {
    expect(arch.sills).toHaveLength(1);
    const sill = arch.sills[0]!;
    expect(sill.levelMm).toBe(1000);
    expect(sill.depthMm).toBeGreaterThan(150);
    expect(sill.widthMm).toBe(1440);
  });

  it("rejeita porta fora da parede", () => {
    const bad = buildRoomArchitecture({
      ...base,
      doors: [{ wall: "front", offsetMm: 3800, widthMm: 800, heightMm: 2100 }],
    });
    expect(bad.issues.some((i) => i.code === "door-out-of-wall")).toBe(true);
  });

  it("rejeita janela acima do teto", () => {
    const bad = buildRoomArchitecture({
      ...base,
      windows: [{ wall: "back", offsetMm: 100, widthMm: 800, heightMm: 1200, sillHeightMm: 2000 }],
    });
    expect(bad.issues.some((i) => i.code === "window-above-ceiling")).toBe(true);
  });

  it("detecta vãos sobrepostos", () => {
    const bad = buildRoomArchitecture({
      ...base,
      windows: [
        { wall: "back", offsetMm: 500, widthMm: 900, heightMm: 900, sillHeightMm: 1000 },
        { wall: "back", offsetMm: 1000, widthMm: 900, heightMm: 900, sillHeightMm: 1000 },
      ],
    });
    expect(bad.issues.some((i) => i.code === "openings-overlap")).toBe(true);
  });
});

describe("room architecture — rodapé arquitetônico", () => {
  const arch = buildRoomArchitecture(base);

  it("interrompe o rodapé no vão da porta", () => {
    const front = arch.walls.find((w) => w.side === "front")!;
    const segs = arch.baseboards.filter((b) => b.wallId === front.id);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ startMm: 0, endMm: 300 });
    expect(segs[1]).toMatchObject({ startMm: 1100, endMm: 4000 });
  });

  it("nunca atravessa uma porta", () => {
    expect(arch.issues.some((i) => i.code === "baseboard-crosses-door")).toBe(false);
  });

  it("não gera rodapé quando desativado", () => {
    const none = buildRoomArchitecture({ ...base, baseboard: null });
    expect(none.baseboards).toHaveLength(0);
  });

  it("é independente do móvel (existe sem móveis no ambiente)", () => {
    expect(arch.baseboards.length).toBeGreaterThan(0);
  });
});

describe("room architecture — teto rebaixado", () => {
  it("reduz a altura livre pelo rebaixo", () => {
    const arch = buildRoomArchitecture({
      ...base,
      heightMm: 2700,
      ceilingKind: "rebaixo",
      ceilingDropMm: 200,
    });
    expect(arch.inner.heightMm).toBe(2500);
    expect(arch.ceiling.levelMm).toBe(2500);
    expect(arch.walls[0]!.heightMm).toBe(2500);
  });
});

describe("room query — consulta dos móveis", () => {
  const q = createRoomQuery(buildRoomArchitecture(base));

  it("expõe a cota do piso e a altura do ambiente", () => {
    expect(q.floorLevelMm).toBe(0);
    expect(q.roomHeightMm).toBe(2700);
  });

  it("expõe o limite útil de cada parede", () => {
    expect(q.wallLimitMm("front")).toBe(4000);
    expect(q.wallLimitMm("left")).toBe(3000);
  });

  it("retorna faixas livres descontando a porta", () => {
    expect(q.freeRunsOnWall("front")).toEqual([
      { startMm: 0, endMm: 300 },
      { startMm: 1100, endMm: 4000 },
    ]);
  });

  it("ignora janelas altas para móveis baixos", () => {
    expect(q.freeRunsOnWall("back", { maxHeightMm: 900 })).toEqual([{ startMm: 0, endMm: 4000 }]);
  });
});

describe("room collisions — móveis dentro do ambiente", () => {
  const arch = buildRoomArchitecture(base);
  const ok: RoomFurnitureBox = {
    id: "m1",
    x: 1500,
    z: 0,
    widthMm: 2000,
    depthMm: 600,
    heightMm: 2400,
    bottomMm: 0,
  };

  it("aceita móvel apoiado no piso e encostado na parede", () => {
    expect(validateRoomFurniture(arch, [ok])).toEqual([]);
  });

  it("acusa móvel atravessando a parede", () => {
    const issues = validateRoomFurniture(arch, [{ ...ok, x: 3800 }]);
    expect(issues.some((i) => i.code === "furniture-through-wall")).toBe(true);
  });

  it("acusa móvel flutuando", () => {
    const issues = validateRoomFurniture(arch, [{ ...ok, bottomMm: 150 }]);
    expect(issues.some((i) => i.code === "furniture-floating")).toBe(true);
  });

  it("aceita módulo suspenso declarado", () => {
    const issues = validateRoomFurniture(arch, [
      { ...ok, bottomMm: 1500, heightMm: 700, suspended: true },
    ]);
    expect(issues).toEqual([]);
  });

  it("acusa móvel passando do teto", () => {
    const issues = validateRoomFurniture(arch, [{ ...ok, heightMm: 2900 }]);
    expect(issues.some((i) => i.code === "furniture-above-ceiling")).toBe(true);
  });

  it("acusa móvel obstruindo a porta", () => {
    const issues = validateRoomFurniture(arch, [{ ...ok, x: 200, widthMm: 1000 }]);
    expect(issues.some((i) => i.code === "furniture-through-door")).toBe(true);
  });

  it("avisa (warning) quando o móvel cobre a janela", () => {
    const issues = validateRoomFurniture(arch, [
      { ...ok, x: 1300, z: 2400, widthMm: 1400, depthMm: 600 },
    ]);
    const win = issues.find((i) => i.code === "furniture-through-window");
    expect(win?.severity).toBe("warning");
  });

  it("validateRoom soma issues da arquitetura e dos móveis", () => {
    expect(validateRoom(arch, [ok])).toEqual([]);
  });
});

describe("room presets e diagnóstico", () => {
  it("todos os presets geram arquitetura sem erros", () => {
    for (const preset of ROOM_PRESETS) {
      const arch = buildRoomArchitecture(preset.spec);
      expect(arch.issues.filter((i) => i.severity === "error")).toEqual([]);
    }
  });

  it("resolve preset por tipo de cômodo", () => {
    expect(roomPresetFor("cozinha").roomType).toBe("cozinha");
    expect(roomPresetFor(undefined).id).toBe(ROOM_PRESETS[0]!.id);
  });

  it("gera snapshot de diagnóstico completo", () => {
    const diag = buildRoomDiagnostics(buildRoomArchitecture(base));
    expect(diag.dimensions).toEqual({ widthMm: 4000, depthMm: 3000, heightMm: 2700 });
    expect(diag.walls).toHaveLength(4);
    expect(diag.doors).toHaveLength(1);
    expect(diag.sills).toHaveLength(1);
  });

  it("é determinístico", () => {
    expect(buildRoomArchitecture(base)).toEqual(buildRoomArchitecture(base));
  });
});