# Plano de estabilização do Dioris Planner

Sim, consigo resolver por partes. Para garantir de verdade, eu dividiria em **7 partes**, sem criar novas funcionalidades antes de estabilizar o que já existe. Cada parte só avança depois de passar por teste real: pedido do usuário → Blueprint → projeto 3D → Inspector → persistência → mobile.

## Regra de trabalho

Nada de “corrigir por cima”. Cada parte terá:

1. Reproduzir o erro real.
2. Encontrar a causa raiz.
3. Corrigir no motor certo, não no sintoma.
4. Testar em desktop e mobile.
5. Validar pedido x Blueprint x projeto final.
6. Confirmar que não quebrou IA, viewport, undo/redo/autosave e Inspector.

---

# Parte 0 — Auditoria base e matriz de testes

## Objetivo
Criar uma base objetiva para não trabalhar no escuro.

## O que será organizado
- Lista oficial de cenários críticos:
  - “Crie uma cozinha moderna”
  - “Crie um closet”
  - “Cozinha louro freijó com porta de vidro”
  - “Armário preto 1200 x 2200 x 580 encostado na parede esquerda”
  - “Roupeiro 6 portas”
  - “Troque para Freijó”
  - “Abra todas as portas”
  - “Adicione LED”
  - “Painel ripado”
  - “Qual o valor estimado?”
  - “Quanto de chapa?”
- Critérios fixos de aprovação para cada cenário.
- Separação entre falha de IA, falha de Engine, falha de render, falha de banco/rota e falha de UI.

## Critério de aprovação
Ter uma matriz clara dizendo o que falha hoje, onde falha e qual parte vai corrigir.

---

# Parte 1 — IA, Blueprint e execução real

## Problema que resolve
A IA diz que criou/aplicou algo, mas o projeto não muda corretamente ou não respeita o pedido.

## Correções principais
- Garantir que a IA só interprete intenção e gere Blueprint.
- Garantir que o Planner Engine execute tudo fisicamente.
- Corrigir interpretação de:
  - ambiente;
  - tipo de móvel;
  - quantidade de portas/gavetas;
  - largura, altura e profundidade;
  - cor/material;
  - parede alvo: esquerda, direita, fundo, frente;
  - ações incrementais: trocar material, abrir portas, adicionar LED.
- Impedir respostas falsas como “apliquei preto” quando o estado real continua Freijó.
- Melhorar resposta em projeto vazio:
  - em vez de mostrar ferramenta técnica repetida, responder de forma natural.

## Critério de aprovação
Quando o usuário pedir um móvel específico, o Blueprint deve conter exatamente as medidas, material, posição e quantidade solicitadas; se não der para executar, a IA deve explicar antes de montar.

---

# Parte 2 — Motor físico: parede, colisão, alinhamento e câmera

## Problema que resolve
Móveis no meio do ambiente, atravessando parede, desalinhados, câmera ruim ou ambiente escondido.

## Correções principais
- Revisar snap-to-wall para todos os caminhos:
  - IA;
  - inserção manual;
  - biblioteca;
  - atualização de medidas pelo Inspector.
- Criar validação de colisão antes de apresentar o projeto.
- Garantir que profundidade real seja usada no layout e no render.
- Garantir que parede esquerda/direita/fundo/frente sejam interpretadas corretamente.
- Corrigir câmera inicial para abrir sempre mostrando o projeto inteiro.
- Garantir teto oculto/transparente em edição e paredes não bloqueando móveis.

## Critério de aprovação
Nenhum móvel pode nascer flutuando no centro, atravessando parede ou fora do cômodo. A câmera deve abrir sempre enquadrando o projeto.

---

# Parte 3 — Inspector editável e sincronizado

## Problema que resolve
O painel lateral mostra dados estáticos ou divergentes do projeto real.

## Correções principais
- Transformar largura, altura e profundidade em inputs editáveis.
- Ao editar medidas:
  - atualizar o móvel real no projeto;
  - recalcular posição na parede;
  - validar colisão;
  - preservar undo/redo/autosave.
- Implementar seletor de material/cor real:
  - Branco TX;
  - Freijó;
  - Preto Absoluto;
  - Louro Freijó;
  - Vidro;
  - Espelho;
  - outros materiais já existentes na biblioteca.
- Sincronizar Inspector, IA, árvore da cena e viewport.

## Critério de aprovação
Se a IA aplicar Preto Absoluto, o móvel deve ficar preto, o Inspector deve mostrar Preto Absoluto e o estado salvo deve manter Preto Absoluto após recarregar.

---

# Parte 4 — Render, qualidade visual e interação de móveis

## Problema que resolve
Móveis parecendo blocos/desenho, baixa percepção de realidade, portas/gavetas sem comportamento confiável.

## Correções principais
- Revisar render procedural de marcenaria:
  - laterais;
  - base;
  - tampo;
  - fundo;
  - prateleiras;
  - divisórias;
  - portas;
  - gavetas;
  - puxadores;
  - rodapé/pés;
  - LED;
  - vidro/espelho.
- Garantir abertura real de portas e gavetas para móveis compatíveis.
- Garantir materiais PBR coerentes no modo edição e render realista.
- Corrigir botão de ocultar paredes/teto para ser previsível.

## Critério de aprovação
Um usuário leigo deve reconhecer visualmente móveis reais, com frentes, puxadores, portas/gavetas e acabamento coerente, não cubos coloridos.

---

# Parte 5 — Rotas quebradas, loading infinito e módulos conectados

## Problema que resolve
Páginas com 404, erro crítico ou loop infinito.

## Correções principais
- Corrigir ou redirecionar corretamente:
  - `/planner/configuracoes`
  - `/planner/render`
  - `/planner/video`
  - `/planner/orcamentos`
  - `/planner/producao`
- Resolver falhas de carregamento de dados.
- Garantir fallback seguro quando não houver projeto ativo.
- Remover loops infinitos de loading.
- Padronizar mensagens de erro de usuário, sem stack técnica.

## Critério de aprovação
Todas as rotas principais do Planner devem abrir sem 404, sem tela quebrada e sem loading infinito.

---

# Parte 6 — Orçamento, chapa, produção e respostas úteis da IA

## Problema que resolve
A IA retorna R$ 0,00 ou 0 m² sem usar o projeto criado.

## Correções principais
- Conectar orçamento ao estado real do projeto.
- Calcular chapa a partir dos móveis existentes.
- Retornar estimativa mínima útil mesmo sem módulo comercial completo.
- Se não houver projeto, a IA deve sugerir criar um projeto primeiro.
- Garantir que lista de corte, orçamento e produção leiam a mesma árvore do projeto.

## Critério de aprovação
Depois de criar uma cozinha, “Quanto de chapa?” e “Qual o valor estimado?” devem retornar valores coerentes com os móveis presentes, não zero.

---

# Parte 7 — Acabamento de UX, nomes e validação final

## Problema que resolve
Interface confusa, nomes truncados e baixa confiança do usuário.

## Correções principais
- Corrigir nomenclatura da árvore:
  - Parede Esquerda;
  - Parede Direita;
  - Parede Fundo;
  - Parede Frontal;
  - Piso;
  - Teto;
  - Armário Base 1200mm;
  - Roupeiro 6 Portas;
  - Aéreo 3 Portas.
- Remover IDs aleatórios visíveis ao usuário.
- Melhorar contraste dos menus no mobile.
- Garantir botões com feedback claro.
- Timeout controlado para comandos longos como “Painel ripado”.
- Rodar bateria final de regressão.

## Critério de aprovação
O Planner deve parecer uma ferramenta profissional: nomes claros, leitura boa no celular, sem travamentos silenciosos e sem elementos técnicos expostos ao usuário.

---

# Ordem obrigatória de execução

```text
Parte 0 — Auditoria base
  ↓
Parte 1 — IA / Blueprint / execução
  ↓
Parte 2 — Motor físico / colisão / parede / câmera
  ↓
Parte 3 — Inspector editável / materiais sincronizados
  ↓
Parte 4 — Render realista / portas / gavetas
  ↓
Parte 5 — Rotas / erros / loading
  ↓
Parte 6 — Orçamento / chapas / produção
  ↓
Parte 7 — UX final / nomes / regressão
```

---

# Entrega por parte

Para cada parte, a entrega será objetiva:

- O que estava quebrado.
- Onde estava a causa raiz.
- O que foi alterado.
- Quais cenários foram testados.
- O que passou.
- O que ainda fica bloqueado para a próxima parte.

---

# Primeira execução recomendada

Começar pela **Parte 0 + Parte 1**, porque o maior problema atual é a cadeia:

```text
Usuário pede → IA interpreta errado/incompleto → Engine monta errado → viewport mostra algo inconsistente
```

Sem corrigir essa base, qualquer ajuste visual ou de Inspector vira remendo.