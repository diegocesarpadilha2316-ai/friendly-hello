/**
 * RENDER DE MÓDULO DE COZINHA — mesma arquitetura do roupeiro e do
 * gaveteiro: a ficha vira montagem pela Biblioteca Construtiva e o
 * desenho/animação/intertravamento ficam a cargo do `AssemblyMesh`.
 * Não existe caminho paralelo.
 */
import { useMemo } from "react";
import { type InterlockBlock } from "../construction";
import { buildKitchenModule, kitchenSpecFromLegacy, type LegacyKitchenParams } from "../families/kitchen";
import { AssemblyMesh, MM } from "./AssemblyMesh";

export interface KitchenMeshProps {
  /** Dimensões em metros, vindas do descritor da cena. */
  width: number;
  height: number;
  depth: number;
  subtype?: string;
  params?: LegacyKitchenParams;
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  onInterlock?: (blocked: readonly InterlockBlock[]) => void;
  doorsCount?: number;
  drawersCount?: number;
  shelvesCount?: number;
  style?: string;
  handleStyle?: string;
}

export function KitchenMesh(props: KitchenMeshProps) {
  const { assembly, spec } = useMemo(() => {
    const base = kitchenSpecFromLegacy({
      subtype: props.subtype,
      widthMm: props.width / MM,
      heightMm: props.height / MM,
      depthMm: props.depth / MM,
      params: props.params,
    });
    return buildKitchenModule({
      ...base,
      doors: props.doorsCount ?? base.doors,
      drawers: props.drawersCount ?? base.drawers,
      shelves: props.shelvesCount ?? base.shelves,
      style: props.style ?? base.style,
      handle: props.handleStyle ?? base.handle,
    });
  }, [
    props.width,
    props.height,
    props.depth,
    props.subtype,
    props.params,
    props.doorsCount,
    props.drawersCount,
    props.shelvesCount,
    props.style,
    props.handleStyle,
  ]);

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