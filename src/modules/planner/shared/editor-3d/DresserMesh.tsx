/**
 * RENDER DO GAVETEIRO — mesma arquitetura do roupeiro: a ficha vira
 * montagem pela Biblioteca Construtiva e o desenho/animação/intertravamento
 * ficam a cargo do `AssemblyMesh`. Não existe caminho paralelo.
 */
import { useMemo } from "react";
import { type InterlockBlock } from "../construction";
import { buildDresser, dresserSpecFromLegacy, type LegacyDresserParams } from "../families/dresser";
import { AssemblyMesh, MM } from "./AssemblyMesh";

export interface DresserMeshProps {
  /** Dimensões em metros, vindas do descritor da cena. */
  width: number;
  height: number;
  depth: number;
  params?: LegacyDresserParams;
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
  openDrawers?: boolean;
  onInterlock?: (blocked: readonly InterlockBlock[]) => void;
  drawersCount?: number;
  style?: string;
  handleStyle?: string;
}

export function DresserMesh(props: DresserMeshProps) {
  const { assembly, spec } = useMemo(() => {
    const base = dresserSpecFromLegacy({
      widthMm: props.width / MM,
      heightMm: props.height / MM,
      depthMm: props.depth / MM,
      params: props.params,
    });
    return buildDresser({
      ...base,
      drawers: props.drawersCount ?? base.drawers,
      style: props.style ?? base.style,
      handle: props.handleStyle ?? base.handle,
    });
  }, [
    props.width,
    props.height,
    props.depth,
    props.params,
    props.drawersCount,
    props.style,
    props.handleStyle,
  ]);

  return (
    <AssemblyMesh
      assembly={assembly}
      sizeMm={{ widthMm: spec.widthMm, heightMm: spec.heightMm, depthMm: spec.depthMm }}
      bodyProps={props.bodyProps}
      selected={props.selected}
      openDrawers={props.openDrawers}
      onInterlock={props.onInterlock}
    />
  );
}
