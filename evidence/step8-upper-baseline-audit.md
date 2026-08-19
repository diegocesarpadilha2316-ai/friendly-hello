# Step 8 — Upper 2 Doors Baseline Audit

**Status:** BLOCKED — definição canônica ambígua

## Resultado da auditoria

A auditoria do registro profissional Kitchen encontrou **duas definições reais e concorrentes** que representam um Aéreo de 2 Portas:

| ID | Nome | Dimensão default declarada | Portas | Prateleiras | Origem |
|---|---|---:|---:|---:|---|
| `kitchen-golden-upper-800` | `Golden Module — Aéreo 800×700×350` | largura 800 mm; altura/profundidade derivadas pela factory `upper()` | 2 | 3 | `professionalModules.ts`, linhas 359–368 |
| `kitchen-upper-2-doors` | `Aéreo 2 Portas` | largura 800 mm; altura/profundidade derivadas pela factory `upper()` | 2 | valor default da factory | `professionalModules.ts`, linhas 376–381 |

As duas definições estão dentro do mesmo registro profissional Kitchen e são alcançadas por referências reais do projeto. `kitchen-golden-upper-800` também aparece na composição natural, no layout e em testes; `kitchen-upper-2-doors` é uma definição distinta do mesmo conceito funcional de Aéreo com duas portas.

## Classificação

| Camada | Resultado |
|---|---|
| ModuleDefinition | DUPLICATED / AMBIGUOUS |
| Canonical ID | BLOCKED — não escolher silenciosamente |
| Family | `kitchen` para ambas |
| Builder | Compartilhado pela factory `upper()`, mas com IDs e dados de definição distintos |
| Fronts | Presentes por `doorLeaves: 2` em ambas |
| Carcass | Ainda não auditada em profundidade porque a missão exige parar antes de implementar diante da ambiguidade |
| Hardware / Joinery / Machining | Não avançados; qualquer escolha poderia validar o módulo errado |
| Downstream | Não avançado |

## Regra da missão aplicada

A Step 8 determina que, se existirem duas ou mais definições concorrentes para o mesmo Aéreo 2 Portas, o agente deve parar, documentar a ambiguidade e não escolher silenciosamente. Portanto, nenhum código de produção foi alterado, nenhuma nova família foi criada e nenhum resolver específico foi implementado.

## Próxima decisão necessária

A auditoria externa precisa indicar qual dos dois IDs é o Aéreo 2 Portas canônico para a Step 8:

1. `kitchen-golden-upper-800`; ou
2. `kitchen-upper-2-doors`.

Somente depois dessa decisão será possível registrar o baseline físico correto, executar o fluxo real do store e validar carcass, Front Layout, hardware, Joinery, Machining, BOM, cut-list e nesting sem risco de provar a definição errada.

## Escopo não executado

Não foram alterados builders, contracts, rules, resolvers, UI, nesting, fabricação, hardware, Joinery ou Machining. Não foram executados testes de expansão do Aéreo porque a identidade canônica está bloqueada. O Golden `kitchen-base-2-doors` não foi tocado.
