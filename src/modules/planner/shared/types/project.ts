/**
 * Tipos de domínio do Planner (Fase 3.1 — Fundação).
 *
 * Estes tipos descrevem projetos, ambientes, cômodos e nós paramétricos.
 * Nesta fase, a persistência é local (autosave em `localStorage`) até que
 * a migration SQL correspondente seja aplicada — momento em que os
 * serviços do domínio passam a espelhar as mesmas shapes.
 */
import type { PlannerProjectId } from ".";

export type PlannerRoomType =
  | "closet"
  | "dormitorio"
  | "banheiro"
  | "lavanderia"
  | "escritorio"
  | "cozinha"
  | "sala"
  | "comercial"
  | "corporativo"
  | "outro";

export interface PlannerDimensions {
  /** em milímetros — unidade oficial do motor paramétrico */
  width: number;
  height: number;
  depth: number;
}

export type PlannerParametricNodeKind =
  | "wall"
  | "floor"
  | "ceiling"
  | "opening"
  | "module"
  | "hardware"
  | "material";

export interface PlannerParametricNode {
  id: string;
  kind: PlannerParametricNodeKind;
  label: string;
  /** parâmetros livres do motor — sempre serializáveis */
  params: Readonly<Record<string, string | number | boolean | null>>;
  /** ids de nós filhos (composição paramétrica) */
  children?: readonly string[];
}

export interface PlannerRoom {
  id: string;
  name: string;
  type: PlannerRoomType;
  dimensions: PlannerDimensions;
  /** grafo paramétrico plano (id → nó) */
  nodes: Readonly<Record<string, PlannerParametricNode>>;
  /** ordem de renderização / edição */
  nodeOrder: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannerEnvironment {
  id: string;
  name: string;
  description?: string;
  rooms: readonly PlannerRoom[];
  createdAt: string;
  updatedAt: string;
}

export type PlannerProjectStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "approved"
  | "archived";

export interface PlannerProject {
  id: PlannerProjectId;
  tenantId: string;
  ownerId: string;
  name: string;
  client?: string;
  status: PlannerProjectStatus;
  environments: readonly PlannerEnvironment[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PlannerProjectVersion {
  id: string;
  projectId: PlannerProjectId;
  version: number;
  label: string;
  createdAt: string;
  /** snapshot completo do projeto */
  snapshot: PlannerProject;
}