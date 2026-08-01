/**
 * RENDER DA FAMÍLIA BANHEIRO — mesma arquitetura de roupeiro, gaveteiro e
 * cozinha: a ficha vira montagem pela Biblioteca Construtiva e o desenho,
 * a animação e o intertravamento ficam a cargo do `AssemblyMesh`.
 * Não depende do `CabinetMesh` e não existe caminho paralelo.
 */
import { useMemo } from "react";
import { type InterlockBlock } from "../construction";
import {
  bathroomFromLegacy,
  buildBathroomModule,
  buildBathroomDiagnostic,
  publishBathroomDiagnostic,
} from "../families/bathroom";
import { AssemblyMesh, MM } from "./AssemblyMesh";
import { plannerDiagnosticsEnabled } from "./runtime-diagnostics";

export interface BathroomMeshProps {
  nodeId?: string;
  /** Dimensões em metros, vindas do descritor da cena. */
  width: number;
  height: number;
  depth: number;
  subtype?: string;
  catalogItemId?: string;
  name?: string;
  params?: Readonly<Record<string, string | number | boolean | null | undefined>>;
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

export function BathroomMesh(props: BathroomMeshProps) {
  const result = useMemo(() => {
    const legacy = bathroomFromLegacy({
      id: props.nodeId,
      name: props.name,
      subtype: props.subtype,
      catalogItemId: props.catalogItemId,
      params: props.params,
      widthMm: Math.round(props.width / MM),
      heightMm: Math.round(props.height / MM),
      depthMm: Math.round(props.depth / MM),
    });
    const built = buildBathroomModule({
      ...legacy,
      doors: props.doorsCount ?? legacy.doors,
      drawers: props.drawersCount ?? legacy.drawers,
      shelves: props.shelvesCount ?? legacy.shelves,
      style: props.style ?? legacy.style,
      handle: props.handleStyle ?? legacy.handle,
    });
    if (plannerDiagnosticsEnabled()) {
      publishBathroomDiagnostic(
        buildBathroomDiagnostic({
          id: props.nodeId ?? built.spec.kind,
          result: built,
          legacyConverted: true,
          layoutSource: "legado",
        }),
      );
    }
    return built;
  }, [
    props.nodeId,
    props.name,
    props.width,
    props.height,
    props.depth,
    props.subtype,
    props.catalogItemId,
    props.params,
    props.doorsCount,
    props.drawersCount,
    props.shelvesCount,
    props.style,
    props.handleStyle,
  ]);

  return (
    <AssemblyMesh
      assembly={result.assembly}
      sizeMm={{
        widthMm: result.spec.widthMm,
        heightMm: result.spec.heightMm,
        depthMm: result.spec.depthMm,
      }}
      bodyProps={props.bodyProps}
      selected={props.selected}
      openDoors={props.openDoors}
      openDrawers={props.openDrawers}
      onInterlock={props.onInterlock}
    />
  );
}