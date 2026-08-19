# Etapa 7.1 — Auditoria de identidade

## Fluxo real

`usePlannerStore.addFurnitureInstance()` cria um `instanceId` novo, chama `buildModule({ instanceId: id, moduleId, ... })` e persiste `instance.moduleDefinitionId = moduleId`.

`buildModule()` encontra a definição em `ModuleRegistry.get(request.moduleId)`, recebe `request.instanceId` separado, e chama a definição profissional com `instanceId: request.instanceId`.

`professionalModules.ts` encaminha `buildBase(instanceId, dimensionsMm, { moduleDefinitionId: config.id, ... })`. Para o Golden, `config.id` é `kitchen-base-2-doors`, enquanto o primeiro argumento é o ID da ocorrência concreta.

`buildCarcass(moduleId, dims, options)` recebe esse primeiro argumento como `moduleId`, mas esse valor é usado pelo helper `part(moduleId, ...)` para prefixar IDs das PartDefinitions e groupIds. No caminho real, portanto, `moduleId` é instance-scoped.

## Problema encontrado

A chamada anterior do resolver em `builders.ts` era:

```ts
resolveCarcassConstruction({
  moduleDefinitionId: moduleId,
  ...
})
```

Como `moduleId` é a identidade da instância no caminho real, `ResolvedCarcass.moduleDefinitionId` podia receber, por exemplo, `kitchen-base-2-doors-<instance-suffix>` em vez de `kitchen-base-2-doors`.

## Correção determinada

`options.moduleDefinitionId` já é preenchido pela fábrica profissional com `config.id` e já é usado para ativar o Golden. A correção mínima é trocar somente o campo do input do resolver para:

```ts
moduleDefinitionId: options.moduleDefinitionId,
```

O prefixo `moduleId` permanece intacto nos helpers `part()` e `hardware()`, preservando IDs de PartDefinitions e groupIds por instância.

## Invariantes

Para uma instância real:

```text
instanceId !== moduleDefinitionId
ResolvedCarcass.moduleDefinitionId === "kitchen-base-2-doors"
PartDefinition.moduleId === instanceId
PartDefinition.id e groupId continuam prefixados pela instância
```

Nenhum valor geométrico, material, espessura, grain, edge banding, hardware, Joinery, Machining, fabricação ou nesting deve ser alterado por esta correção.
