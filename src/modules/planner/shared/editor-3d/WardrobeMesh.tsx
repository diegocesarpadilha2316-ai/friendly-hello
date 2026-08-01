/**
 * RENDER DO ROUPEIRO — apenas resolve a ficha e delega ao renderizador
 * genérico da Biblioteca Construtiva (`AssemblyMesh`). Nenhuma regra
 * construtiva, nenhuma animação e nenhum intertravamento vivem aqui.
 */
import { useEffect, useMemo } from "react";
import { type InterlockBlock } from "../construction";
import {
  buildWardrobe,
  wardrobeInteriorDiagnostics,
  wardrobeSpecFromLegacy,
  type LegacyParams,
} from "../families/wardrobe";
import { AssemblyMesh, MM } from "./AssemblyMesh";
import { plannerDiagnosticsEnabled } from "./runtime-diagnostics";

export interface WardrobeMeshProps {
  /** Dimensões em metros, vindas do descritor da cena. */
  width: number;
  height: number;
  depth: number;
  /** Params soltos do móvel (formato antigo e novo convivem). */
  params?: LegacyParams;
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  /** Avisos discretos do intertravamento (ex.: "abra a porta desta coluna"). */
  onInterlock?: (blocked: readonly InterlockBlock[]) => void;
  doorsCount?: number;
  drawersCount?: number;
  shelvesCount?: number;
  style?: string;
  handleStyle?: string;
  /** Identificação do nó na cena (usada só pelo diagnóstico DEV). */
  nodeId?: string;
  /** Preset interno escolhido pelo usuário (opcional). */
  interiorPresetId?: string;
}

export function WardrobeMesh(props: WardrobeMeshProps) {
  const { assembly, spec, interior } = useMemo(() => {
    const base = wardrobeSpecFromLegacy({
      widthMm: props.width / MM,
      heightMm: props.height / MM,
      depthMm: props.depth / MM,
      params: props.params,
    });
    return buildWardrobe({
      ...base,
      doors: props.doorsCount ?? base.doors,
      drawers: props.drawersCount ?? base.drawers,
      shelvesPerColumn: props.shelvesCount ?? base.shelvesPerColumn,
      style: props.style ?? base.style,
      handle: props.handleStyle ?? base.handle,
      ...(props.interiorPresetId
        ? { interior: { ...base.interior, presetId: props.interiorPresetId } }
        : {}),
    });
  }, [
    props.width,
    props.height,
    props.depth,
    props.params,
    props.doorsCount,
    props.drawersCount,
    props.shelvesCount,
    props.style,
    props.handleStyle,
    props.interiorPresetId,
  ]);

  // Diagnóstico por móvel — apenas em desenvolvimento.
  useEffect(() => {
    if (!plannerDiagnosticsEnabled()) return;
    const diag = wardrobeInteriorDiagnostics(props.nodeId ?? "roupeiro", spec, interior, {
      pieces: assembly.pieces.length,
      motions: assembly.motions.filter((m) => m.kind !== "static").length,
    });
    const w = window as unknown as { __DIORIS_INTERIOR__?: Record<string, unknown> };
    w.__DIORIS_INTERIOR__ = { ...(w.__DIORIS_INTERIOR__ ?? {}), [diag.id]: diag };
  }, [props.nodeId, spec, interior, assembly]);

  return (
    <AssemblyMesh
      assembly={assembly}
      sizeMm={{ widthMm: spec.widthMm, heightMm: spec.heightMm, depthMm: spec.depthMm }}
      bodyProps={props.bodyProps}
      selected={props.selected}
      openDoors={props.openDoors}
      openDrawers={props.openDrawers}
      onInterlock={props.onInterlock}
    />
  );
}
