# STEP 8 — Golden Upper 2 Doors Pilot

## Relatório de bloqueio

**Status: BLOQUEADA — não concluída**

A Step 8 não pode iniciar a implementação do Aéreo 2 Portas porque a auditoria do `professionalModules.ts` encontrou duas definições canônicas concorrentes dentro da família `kitchen`:

| ID | Nome registrado | Evidência |
|---|---|---|
| `kitchen-golden-upper-800` | Golden Module — Aéreo 800×700×350 | definição profissional nas linhas 359–368; `doorLeaves: 2`; `shelves: 3` |
| `kitchen-upper-2-doors` | Aéreo 2 Portas | definição profissional nas linhas 376–381; `doorLeaves: 2` |

Ambas são definições reais, registradas e compatíveis semanticamente com o alvo “Aéreo 2 Portas”. A primeira já aparece em composição natural, layout e testes; a segunda é uma definição distinta explicitamente nomeada “Aéreo 2 Portas”. Escolher qualquer uma sem decisão externa violaria a regra máxima da missão e poderia fazer toda a expansão validar o módulo errado.

> **Decisão necessária:** indicar se o ID canônico da Step 8 deve ser `kitchen-golden-upper-800` ou `kitchen-upper-2-doors`.

## O que foi executado

Foi realizada somente a auditoria de definição e registro. Foram localizados os IDs, nomes, família, quantidade de portas e dados declarativos disponíveis. Foi criado `evidence/step8-upper-baseline-audit.md` com a matriz de evidências e a classificação por camada.

## O que não foi executado

Nenhum arquivo de produção foi alterado. Não foram implementados contratos, rules, resolvers, carcass específica, Front Layout, Hardware Placement, testes de integração, mutation check, BOM, cut-list, nesting, PDF de conclusão ou ZIP de implementação. O Golden original `kitchen-base-2-doors` permaneceu intacto.

Também não foram iniciadas a Etapa 8.1, a Etapa 9, novas famílias, CAM, CNC, G-code ou qualquer expansão funcional fora desta auditoria.

## Conclusão

A Step 8 está **BLOCKED**, não “concluída”. O trabalho deve permanecer parado até que a auditoria externa escolha explicitamente uma das duas definições. Depois dessa decisão, será possível executar o baseline físico correto e prosseguir com uma expansão controlada, sem duplicar arquitetura nem alterar o Golden original.
