# Step 7.2 — Mutation Check do Identity Wiring

## Código correto

```ts
moduleDefinitionId:
  options.moduleDefinitionId ?? GOLDEN_CARCASS_CONSTRUCTION_RULE.moduleDefinitionId
```

A execução do Regression Lock com o código correto resultou em:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
exit        0
```

O spy observou diretamente a chamada originada pelo caminho real do store, com:

```text
instanceId: <ID gerado pelo store>
moduleDefinitionId: kitchen-base-2-doors
```

## Código antigo simulado

Para a auditoria local, o wiring foi temporariamente alterado para:

```ts
moduleDefinitionId: moduleId
```

Como `moduleId` é instance-scoped no caminho real, a chamada não produziu `kitchen-base-2-doors` e o Regression Lock falhou:

```text
mutation_exit=1
AssertionError: expected undefined to be defined
Test Files  1 failed (1)
Tests       1 failed (1)
```

O erro foi restaurado imediatamente para o wiring correto. A execução posterior voltou a passar com exit 0. A entrega final não contém a mutation proposital.
