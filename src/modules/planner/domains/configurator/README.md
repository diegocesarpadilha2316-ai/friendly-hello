# Planner / Configurador Paramétrico Enterprise (Fase 3.16)

Camada 100% aditiva sobre `PlannerEditorProvider`. Toda mutação passa por
`updateProject()` — undo, redo, autosave, histórico e versionamento continuam
funcionando sem alteração no núcleo.

## Serviços (puros)

- `selection.ts` — seleção inteligente (single + multi) persistida em memória.
- `config-schema.ts` — deriva um schema paramétrico completo (largura, altura,
  profundidade, divisórias, prateleiras, portas, gavetas, nichos, rodapé, pés,
  base, fundo, painel, ripado, iluminação, puxadores, dobradiças, corrediças,
  amortecedores, vidro, espelho, textura, acabamento) a partir de qualquer
  `PlannerParametricNode` do tipo `module`.
- `commands.ts` — parser determinístico pt-BR para o Chat IA e Configurador
  (aumente para 2.80, troque MDF por Carvalho, 4 gavetas, coloque LED,
  abra portas, feche gavetas, painel ripado, divida em 5 nichos, adicione
  espelho, troque para Blum, etc.).
- `components-open.ts` — abrir/fechar portas e gavetas (por %, todas,
  selecionadas).
- `walk.ts` — modos de navegação (Órbita, Livre, Walk, FPS) com colisão.
- `layers.ts` — 9 camadas oficiais (Estrutura, Portas, Gavetas, Ferragens,
  Vidros, Espelhos, LED, Decoração, Produção) + mapeamento de nó→camada.
- `snap.ts` — alvos de snap (paredes, móveis, eixos, centro, quinas,
  divisórias, portas, gavetas).
- `alignment.ts` — duplicar, espelhar, rotacionar, alinhar, distribuir.
- `history-diff.ts` — diff humano de undo/redo (quem, quando, o quê,
  antes → depois) usando as pilhas do provider.
- `ai-providers.ts` — hooks stubs para OpenAI, Gemini, Claude, Mistral e OSS
  (sem chamada real de rede — só shape e telemetria).

## UI

- `ConfiguratorPanel` — painel profissional com abas Propriedades, Medidas,
  Engenharia, Ferragens, Materiais, Iluminação, Render, Animações, Comandos,
  Camadas, Alinhamento, Duplicar, Histórico, IA, Walk.

Zero migrations, zero providers, zero stores, zero managers.
