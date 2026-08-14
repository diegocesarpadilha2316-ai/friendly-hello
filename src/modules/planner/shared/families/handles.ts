/**
 * Tradução do puxador da ficha (texto livre) para o vocabulário dos
 * componentes da Biblioteca Construtiva. Compartilhado por TODAS as
 * famílias — nenhuma família reimplementa esta tabela.
 */
export type ComponentHandle = "tubular" | "perfil-gola" | "cava" | "botao" | "push";

export function handleType(handle: string | undefined | null): ComponentHandle {
  const k = (handle ?? "").toLowerCase();
  if (k.includes("gola") || k.includes("perfil")) return "perfil-gola";
  if (k.includes("cava") || k.includes("usinad")) return "cava";
  if (k.includes("botao") || k.includes("botão")) return "botao";
  if (k.includes("none") || k.includes("push") || k.includes("sem")) return "push";
  if (k.includes("tubular") || k.includes("barra")) return "tubular";
  return "perfil-gola";
}
