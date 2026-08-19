# Dioris Planner V2 — Step 8
## Controlled Golden Expansion: Aéreo 2 Portas

**ID canônico:** `kitchen-golden-upper-800`  
**Baseline auditado:** `800 × 700 × 350 mm`  
**Instância de teste:** `step8-upper-baseline-instance-001`  
**Escopo:** arquitetura compartilhada; sem CAM, CNC ou G-code.

## Resultado executivo

A expansão controlada foi concluída sem duplicar o engine e sem alterar o comportamento do `kitchen-base-2-doors`. O Aéreo passou a selecionar regras declarativas próprias e reutilizar os mesmos resolvers de carcass, layout frontal e posicionamento de ferragens já usados pelo pipeline Golden.

> **Resultado:** o pipeline `Parameters → Rules → Resolvers → PartDefinitions → Downstream` foi exercitado pelo segundo módulo com identidade de definição e identidade de instância separadas.

## Alterações implementadas

| Arquivo | Alteração | Efeito |
|---|---|---|
| `upperCarcassConstructionRules.ts` | Nova `GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE` | Regra declarativa da estrutura Upper |
| `frontLayoutRules.ts` | Nova `GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE` | Layout simétrico de duas portas com os valores auditados |
| `builders.ts` | Seleção de regra Upper no `resolveCarcassConstruction()` | Remove a duplicação estrutural do caminho Upper |
| `builders.ts` | Seleção da regra Upper no `resolveFrontLayout()` | Remove a fórmula inline de layout para o piloto |
| `step8UpperPilot.test.ts` | Invariantes de partes, hardware, identidade e nesting | Regression lock executável |
| `evidence/step8-shared-architecture-decision.md` | Decisão de extração mínima | Registro arquitetural |

A aplicação de hardware continua usando `resolveDoorHardwarePlacement()` quando existe um layout resolvido. Não foi criado `UpperEngine`, novo nesting, nova UI ou novo downstream.

## Paridade do baseline

O piloto produz **32 PartDefinitions**, sendo **10 físicas** e **22 de hardware**. A distribuição de hardware é: 12 suportes de prateleira, quatro dobradiças, quatro placas de montagem e dois puxadores cava. Cada uma das três prateleiras recebe quatro suportes distintos.

| Invariante | Resultado |
|---|---:|
| Dimensões do módulo | `800 × 700 × 350 mm` |
| Total de PartDefinitions | `32` |
| Partes físicas | `10` |
| Hardware | `22` |
| Portas | `2` |
| Dimensão de cada porta | `396 × 696 × 18 mm` |
| Centros das portas | `-200` e `198 mm` |
| Pivôs | `-398` e `396 mm` |
| Prateleiras | `3` |
| Suportes por prateleira | `4` |
| Rodapé materializado no Upper | `0` |
| Integridade de nesting | sem ausências, duplicatas ou IDs desconhecidos |

Todas as partes carregam `moduleId` e `parentInstanceId` iguais ao `instanceId` da ocorrência de teste. O `moduleDefinitionId` permanece o ID canônico usado na seleção das regras; portanto, a identidade de tipo não é confundida com a identidade da ocorrência.

## Validação executada

A suíte específica do piloto passou com **2 testes**. A suíte completa passou com **49 arquivos de teste e 581 testes**. O TypeScript foi executado novamente e voltou a reportar exatamente **cinco erros preexistentes**, todos em `usePlannerStore.ts` nas linhas 1089–1093; nenhum erro novo foi introduzido pela Step 8.

O mutation check alterou temporariamente a asserção para comparar `moduleId` com `request.moduleId` e `parentInstanceId` com `request.moduleId`. A suíte falhou como esperado (`1 failed, 1 passed`), comprovando que o regression lock detecta a confusão entre definição e instância. O arquivo foi restaurado imediatamente após o teste.

## Limites respeitados

A implementação não iniciou a Stage 9. Não foram adicionados CAM, CNC, G-code, operações de usinagem ou geração de arquivos de fabricação. O downstream existente continua recebendo `PartDefinitions`; a filtragem de hardware do nesting foi explicitamente testada.

## Conclusão

A Step 8 está tecnicamente validada para o piloto `kitchen-golden-upper-800`: a geometria permanece matematicamente compatível com o baseline auditado, as regras são declarativas, os resolvers são compartilhados, a identidade é estrita e o módulo original permanece coberto pela regressão completa.
