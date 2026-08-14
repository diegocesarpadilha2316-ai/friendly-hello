/**
 * Hooks de acesso granular ao estado do editor.
 *
 * `usePlannerEditor()` devolve o contexto inteiro — qualquer campo que
 * mude re-renderiza o consumidor. Em projetos grandes (100+ nós), isso
 * é caro: uma edição do Inspector faz o Scene3D reconstruir tudo mesmo
 * quando só o `selectedNodeId` mudou.
 *
 * `usePlannerSelector(sel, eq?)` resolve isso extraindo apenas a fatia
 * observada, com comparação de igualdade opcional (shallow por padrão).
 * `usePlannerBus(event, handler)` é o subscribe tipado ao bus.
 */
import { useEffect, useRef, useState } from "react";
import { usePlannerEditor } from "./editor-context";
import { getPlannerEventBus, type PlannerEventMap, type PlannerEventName } from "../events";

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const ka = Object.keys(a as Record<string, unknown>);
  const kb = Object.keys(b as Record<string, unknown>);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
      return false;
  }
  return true;
}

/**
 * Extrai uma fatia derivada do estado do editor e só re-renderiza quando
 * ela muda de fato (por `Object.is` ou pelo comparador informado).
 *
 * Nunca chame `updateProject` dentro do seletor — ele roda no render.
 */
export function usePlannerSelector<T>(
  selector: (ctx: ReturnType<typeof usePlannerEditor>) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
  const ctx = usePlannerEditor();
  const selected = selector(ctx);
  const ref = useRef<T>(selected);
  if (!equalityFn(ref.current, selected)) {
    ref.current = selected;
  }
  return ref.current;
}

/** Variante que usa comparação shallow — útil para objetos derivados. */
export function usePlannerShallowSelector<T>(
  selector: (ctx: ReturnType<typeof usePlannerEditor>) => T,
): T {
  return usePlannerSelector(selector, shallowEqual);
}

/**
 * Assinatura tipada ao PlannerEventBus. O handler é armazenado em ref,
 * evita re-assinar a cada render mesmo quando a função é inline.
 */
export function usePlannerBus<K extends PlannerEventName>(
  event: K,
  handler: (payload: PlannerEventMap[K]) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const bus = getPlannerEventBus();
    return bus.on(event, (payload) => handlerRef.current(payload));
  }, [event]);
}

/**
 * Contador de emissões do bus — útil como sinal de atualização para
 * consumidores que preferem re-derivar em vez de manter estado próprio.
 * Ex.: um badge "sincronizado agora" no rodapé.
 */
export function usePlannerBusTick(event: PlannerEventName): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bus = getPlannerEventBus();
    return bus.on(event, () => setTick((n) => (n + 1) & 0xffff));
  }, [event]);
  return tick;
}
