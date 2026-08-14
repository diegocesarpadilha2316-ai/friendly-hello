# Kitchen V10 — Relatório de validação da ETAPA 1

**Projeto:** Dioris Planner V2  
**Escopo:** somente módulos inferiores e bancada contínua, sem aéreos, torre, eletros ou decoração.  
**Autor:** Manus AI  
**Status da validação:** engenharia e testes automatizados aprovados; inspeção visual final da composição materializada ainda não confirmada nesta execução.

## 1. Composição nominal

A sequência determinística usada pelo Layout Engine é:

| Índice | Módulo | Largura nominal | Altura nominal | Profundidade nominal | Início relativo | Fim relativo | Suportado | Colisão |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 0 | Balcão inferior, 2 portas | 800 mm | 870 mm | 580 mm | 0 mm | 800 mm | Sim | Não |
| 1 | Gaveteiro inferior, 4 gavetas | 600 mm | 870 mm | 580 mm | 800 mm | 1400 mm | Sim | Não |
| 2 | Balcão de pia, 2 portas | 1200 mm | 870 mm | 580 mm | 1400 mm | 2600 mm | Sim | Não |
| 3 | Balcão inferior, 2 portas | 800 mm | 870 mm | 580 mm | 2600 mm | 3400 mm | Sim | Não |
| 4 | Bancada derivada contínua | 3400 mm | 20 mm | 600 mm | 0 mm | 3400 mm | Sim | Não |

A soma das larguras inferiores é **800 + 600 + 1200 + 800 = 3400 mm**. A bancada não recebe largura manual: ela é derivada do menor início e do maior fim dos módulos inferiores, resultando em **3400 mm contínuos**.

## 2. Critérios de construção

Todos os quatro inferiores são materializados com perfil de espessura **MDF 18 mm**. O builder paramétrico gera painéis de carcass, base estrutural, portas ou frentes correspondentes, rodapé e pés reguláveis. O gaveteiro gera quatro frentes, oito laterais internas e oito ferragens de corrediça oculta com fechamento suave. O gabinete de pia gera duas portas e zonas técnicas identificáveis para cuba, sifão e recuo hidráulico.

A validação de abertura foi corrigida para representar o volume aberto na direção física correta. Para gavetas, o centro do volume expandido avança metade do curso antes da interseção ser avaliada; para portas, o volume é expandido em profundidade, evitando o falso positivo anterior causado pela expansão simétrica da caixa e pelo clearance artificial entre módulos encostados.

## 3. Evidência automatizada

A suíte dedicada foi executada com resultado integral:

| Suíte | Testes | Resultado |
|---|---:|---|
| `src/modules/planner-v2/pkg/state/etapa1LowerKitchen.test.ts` | 3 | **3 aprovados** |
| `src/modules/planner-v2/pkg/state/usePlannerStore.regression.test.ts` | 7 | **7 aprovados** |
| Suíte completa do projeto | 31 arquivos / 522 testes | **31 arquivos e 522 testes aprovados** |

As correções desta execução foram aplicadas em `professionalModules.ts`, `validateOpeningClearance.ts`, `cameraPresets.ts`, `RenderController.tsx`, `RenderFinalPanel.tsx` e na suíte dedicada da Etapa 1.

## 4. Vistas obrigatórias

O pipeline de Render Final foi ampliado com presets determinísticos adicionais para **Topo técnico** e **Lateral técnica**, além das vistas frontais e de perspectiva já existentes. O autocapture continua usando a cena real do Planner V2, sem alterar as instâncias persistidas durante o render.

Nesta execução, o navegador manteve estados persistidos legados em algumas rotas e a tentativa de enviar o comando natural pela interface sofreu timeout. Por isso, as imagens antigas encontradas em `Downloads` não são declaradas como evidência válida da ETAPA 1: elas contêm elementos de outras composições. A declaração visual final deve ser feita somente após recarregar uma cena limpa, enviar o comando da Etapa 1 e confirmar os cinco PNGs sem decoração ou módulos superiores.

## 5. Conclusão

> **ETAPA 1 — PASS técnico e automatizado.**

A sequência, a soma de 3400 mm, a bancada derivada, o suporte do Layout Engine, a engenharia do gaveteiro, a zona técnica da pia e a abertura sem colisão estão aprovados pelos testes. **ETAPA 1 — PASS visual ainda não declarado**, porque a captura final limpa precisa ser confirmada em uma sessão visual sem o estado legado persistido.

## Referências internas

[1]: `src/modules/planner-v2/pkg/state/etapa1LowerKitchen.test.ts` — suíte dedicada da ETAPA 1.  
[2]: `src/modules/planner-v2/library/layout/KitchenLayoutEngine.ts` — posicionamento sequencial e bancada derivada.  
[3]: `src/modules/planner-v2/library/services/validateOpeningClearance.ts` — validação volumétrica de abertura.  
[4]: `src/modules/planner-v2/library/families/kitchen/builders.ts` — builders paramétricos de carcass, gavetas, portas e pia.  
[5]: `src/modules/planner-v2/pkg/scene/RenderController.tsx` — exportação PNG/WebM e autocapture.  
[6]: `src/modules/planner-v2/pkg/scene/cameraPresets.ts` — presets determinísticos de câmera.
