---
name: Planner — estabilidade antes de novas features
description: Ciclo obrigatório implementar→integrar→testar→corrigir→validar UX→otimizar→não-regressão antes de qualquer nova tarefa
type: preference
---
Regra obrigatória no Dioris Planner: NUNCA iniciar nova funcionalidade enquanto a anterior não estiver 100% estável.

Ciclo obrigatório para cada tarefa:
1. Implementar
2. Integrar com a arquitetura existente (Core, Providers, EventBus)
3. Testar (auditoria real, não só "compila")
4. Corrigir falhas na causa raiz — nunca sintomas
5. Validar experiência do usuário
6. Otimizar desempenho
7. Confirmar zero regressão em módulos existentes
8. Só então avançar

Ao detectar comportamento inconsistente durante uma implementação, PARAR novas features e corrigir a causa raiz antes de qualquer outra coisa.

**Why:** o objetivo é um Planner estável, preciso e profissional — não acúmulo de features. Preferível menos recursos perfeitos do que muitos incompletos.

**How to apply:** antes de aceitar qualquer novo prompt de "próxima fase", verificar se a fase anterior passou nos 8 passos. Se não passou, responder corrigindo o pendente em vez de avançar.