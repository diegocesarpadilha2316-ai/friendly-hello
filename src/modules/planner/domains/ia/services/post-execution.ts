import {
  buildScene3D,
  listPrimitives,
  type PlannerProject,
} from "@/modules/planner/shared";
import { buildWardrobe, resolveFurnitureRenderer, wardrobeSpecFromLegacy } from "@/modules/planner/shared/families/wardrobe";
import { buildKitchenModule, kitchenSpecFromLegacy } from "@/modules/planner/shared/families/kitchen";
import { bathroomFromLegacy, buildBathroomModule } from "@/modules/planner/shared/families/bathroom";
import { buildLaundryModule, laundryFromLegacy } from "@/modules/planner/shared/families/laundry";
import { waitForSceneRuntime } from "@/modules/planner/shared/editor-3d/scene-runtime";
import type { ToolContext } from "./tools";

export interface PostExecutionResult {
  readonly ok: boolean;
  readonly itemIds: readonly string[];
  readonly summary: string;
}

function roomOf(project: PlannerProject, ctx: ToolContext) {
  return project.environments
    .find((environment) => environment.id === ctx.environmentId)
    ?.rooms.find((room) => room.id === ctx.roomId) ?? null;
}

function assemblyPieces(furniture: ReturnType<typeof buildScene3D>["furniture"][number]): number {
  const common = {
    id: furniture.id,
    subtype: furniture.subtype,
    catalogItemId: furniture.catalogItemId,
    params: furniture.params,
    widthMm: Math.round(furniture.width * 1000),
    heightMm: Math.round(furniture.height * 1000),
    depthMm: Math.round(furniture.depth * 1000),
  };
  const renderer = resolveFurnitureRenderer(common).renderer;
  if (renderer === "wardrobe") {
    return buildWardrobe(wardrobeSpecFromLegacy(common)).assembly.pieces.length;
  }
  if (renderer === "kitchen") {
    return buildKitchenModule(kitchenSpecFromLegacy(common)).assembly.pieces.length;
  }
  if (renderer === "bathroom") {
    return buildBathroomModule(bathroomFromLegacy(common)).assembly.pieces.length;
  }
  if (renderer === "laundry") {
    return buildLaundryModule(laundryFromLegacy(common)).assembly.pieces.length;
  }
  // Renderers legados/catálogo sempre produzem ao menos um mesh-envelope.
  return 1;
}

export async function validatePostExecution(input: {
  before: PlannerProject;
  after: PlannerProject;
  ctx: ToolContext;
}): Promise<PostExecutionResult> {
  const beforeRoom = roomOf(input.before, input.ctx);
  const afterRoom = roomOf(input.after, input.ctx);
  if (!afterRoom) return { ok: false, itemIds: [], summary: "O cômodo ativo não existe após a execução." };

  const beforeIds = new Set(
    beforeRoom ? listPrimitives(beforeRoom).filter((item) => item.kind === "furniture").map((item) => item.id) : [],
  );
  const created = listPrimitives(afterRoom).filter(
    (item) => item.kind === "furniture" && !beforeIds.has(item.id),
  );
  if (created.length === 0) {
    return { ok: false, itemIds: [], summary: "A ferramenta terminou, mas nenhum móvel novo foi inserido no projeto ativo." };
  }

  const model = buildScene3D(afterRoom, afterRoom.dimensions.height);
  const descriptors = created.map((item) => model.furniture.find((entry) => entry.id === item.id));
  for (const descriptor of descriptors) {
    if (!descriptor) {
      return { ok: false, itemIds: created.map((item) => item.id), summary: "Um móvel foi inserido, mas não entrou no modelo da cena 3D." };
    }
    const dimensions = [descriptor.width, descriptor.height, descriptor.depth];
    if (dimensions.some((value) => !Number.isFinite(value) || value <= 0)) {
      return { ok: false, itemIds: created.map((item) => item.id), summary: `O móvel ${descriptor.id} possui envelope inválido.` };
    }
    if (assemblyPieces(descriptor) < 1) {
      return { ok: false, itemIds: created.map((item) => item.id), summary: `O renderer de ${descriptor.id} não gerou nenhuma peça.` };
    }
  }

  const itemIds = created.map((item) => item.id);
  const runtime = await waitForSceneRuntime(itemIds);
  if (!runtime.ok) return { ok: false, itemIds, summary: runtime.reason };
  return {
    ok: true,
    itemIds,
    summary: `${itemIds.length} móvel(is) confirmado(s) no projeto, renderer, montagem, cena e câmera.`,
  };
}