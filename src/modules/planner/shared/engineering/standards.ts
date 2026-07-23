/**
 * Padrões de fabricação disponíveis (Fase 3.5).
 */
import type {
  AssemblyKind,
  BackKind,
  BaseKind,
  DoorKind,
  DrawerKind,
  EdgeKind,
  GrainDirection,
  HandleKind,
} from "./types";

type Opt<T extends string> = { value: T; label: string; description: string };

export const BACK_OPTIONS: readonly Opt<BackKind>[] = [
  { value: "pregado", label: "Pregado", description: "Fundo pregado por fora — mais rápido, menos rígido." },
  { value: "encaixado", label: "Encaixado", description: "Fundo encaixado em rebaixo de 6–9 mm." },
  { value: "canal", label: "Canal", description: "Canal fresado 4 mm, ideal para MDF 3 mm." },
  { value: "rebaixado", label: "Rebaixado", description: "Rebaixo total nas laterais, base e tampo." },
];

export const BASE_OPTIONS: readonly Opt<BaseKind>[] = [
  { value: "rodape", label: "Rodapé", description: "Rodapé em madeira ou PVC fixado ao módulo." },
  { value: "pe", label: "Pé regulável", description: "Pés reguláveis com rodapé removível." },
  { value: "suspenso", label: "Suspenso", description: "Módulo suspenso." },
];

export const ASSEMBLY_OPTIONS: readonly Opt<AssemblyKind>[] = [
  { value: "minifix", label: "Minifix", description: "Tambor + parafuso, desmontável." },
  { value: "cavilha", label: "Cavilha", description: "Cavilhas coladas, acabamento premium." },
  { value: "parafuso", label: "Parafuso", description: "Parafusos aparentes, produção rápida." },
  { value: "confirmat", label: "Confirmat", description: "Parafuso confirmat 7 mm." },
];

export const DOOR_OPTIONS: readonly Opt<DoorKind>[] = [
  { value: "lisa", label: "Porta lisa", description: "Frente lisa em MDF/melamínico." },
  { value: "vidro", label: "Porta de vidro", description: "Vidro temperado com perfil." },
  { value: "espelhada", label: "Espelhada", description: "Espelho com película de segurança." },
  { value: "moldurada", label: "Moldurada", description: "Frente com moldura fresada." },
  { value: "sem-porta", label: "Sem porta", description: "Módulo aberto." },
];

export const DRAWER_OPTIONS: readonly Opt<DrawerKind>[] = [
  { value: "padrao", label: "Padrão", description: "Gaveta caixa com corrediça padrão." },
  { value: "americana", label: "Americana", description: "Frente + caixa metálica." },
  { value: "grande", label: "Gavetão", description: "Altura ≥ 240 mm." },
  { value: "sem-gaveta", label: "Sem gaveta", description: "Sem gavetas." },
];

export const HANDLE_OPTIONS: readonly Opt<HandleKind>[] = [
  { value: "cava", label: "Cava fresada", description: "Fresagem na própria frente." },
  { value: "perfil", label: "Perfil / Gola", description: "Perfil gola horizontal ou vertical." },
  { value: "puxador", label: "Puxador aparente", description: "Puxador parafusado." },
  { value: "tip-on", label: "Tip-On", description: "Abertura por toque." },
];

export const EDGE_OPTIONS: readonly Opt<EdgeKind>[] = [
  { value: "pvc-0-45", label: "Fita PVC 0,45 mm", description: "Fita fina econômica." },
  { value: "pvc-1-0", label: "Fita PVC 1,0 mm", description: "Fita 1 mm, resistente ao impacto." },
  { value: "abs", label: "Fita ABS", description: "Fita ABS ecológica premium." },
  { value: "aluminio", label: "Perfil alumínio", description: "Borda em perfil de alumínio." },
  { value: "sem-fita", label: "Sem fita", description: "Peça interna sem fita." },
];

export const GRAIN_OPTIONS: readonly Opt<GrainDirection>[] = [
  { value: "vertical", label: "Vertical", description: "Veio corre no sentido da altura." },
  { value: "horizontal", label: "Horizontal", description: "Veio corre no sentido da largura." },
  { value: "livre", label: "Livre", description: "Otimização decide." },
];