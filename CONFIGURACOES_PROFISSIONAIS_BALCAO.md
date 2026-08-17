# Configurações profissionais do Balcão — Dioris Planner V2

## Cores e acabamentos

O Inspetor oferece uma paleta de materiais com nomes de uso direto: **Branco**, **Louro Freijó**, **Preto**, **Cinza Sagrado**, **Verde Amazônia** e **Carvalho**. O material pode ser aplicado ao corpo, às frentes, ao fundo ou à bancada, mantendo os slots separados para que a combinação seja fabricável e não apenas visual.

| Nome no comando | ID técnico | Uso recomendado |
|---|---|---|
| Branco | `mdf-white` | Corpo e frentes claras. |
| Louro Freijó | `mdf-freijo` | Frentes amadeiradas com veio vertical. |
| Preto | `mdf-black` | Composição escura e ferragens pretas. |
| Cinza Sagrado | `mdf-cinza-sagrado` | Acabamento neutro contemporâneo. |
| Verde Amazônia | `sudati-amazonia` | Frentes coloridas e detalhes de destaque. |
| Carvalho | `mdf-oak` | Amadeirado claro de contraste. |

## Puxadores e ferragens

Os puxadores disponíveis incluem alça, gola horizontal, cava contínua, perfil, perfil champagne e sem puxador. O balcão mantém dobradiças soft-close por padrão e permite trocar corrediças para gaveteiros. O rodapé é tratado separadamente como perfil removível fixado por clips aos pés reguláveis.

Comandos naturais aceitos incluem: “use puxador gola”, “troque para puxador cava”, “quero perfil preto”, “use dobradiça com amortecimento” e “coloque corrediça oculta com amortecimento”.

## Medidas

O Inspetor oferece presets Compacto de 600 mm, Padrão de 800 mm, Largo de 900 mm e Pia de 1200 mm. As dimensões completas continuam editáveis em milímetros para largura, altura e profundidade. O comando natural também aceita medidas, por exemplo: “quero largura 900 mm”, “mude para 1200 x 870 x 580 mm” ou “crie um balcão de 800 mm”.

## Câmera e render

A câmera possui vistas Frontal, 3/4 esquerda, 3/4 direita, Ilha, Close-up de material, Geral, Topo técnico e Lateral técnica. A vista superior enquadra o móvel selecionado pelo bounding box real da instância. O Render Final separa a exportação do viewport de edição e oferece Prévia rápida em 1280×720, Render profissional em 1920×1080 e Render catálogo em 2560×1440.

## Vídeo

O pipeline de vídeo usa WebM via MediaRecorder quando o navegador suporta a captura. Os presets são Prévia de 6 segundos, Tour profissional de 9 segundos e Apresentação cliente de 12 segundos. O tour usa a cena paramétrica atual, não uma imagem gerada, e deve ser usado depois de escolher material, puxador, ferragens, medidas e vista de apresentação.

## Exemplos para a IA

> “Crie um balcão de 800 x 870 x 580 mm, MDF branco, puxador gola e dobradiça soft-close.”

> “Quero este balcão em Louro Freijó, com puxador cava e largura 900 mm.”

> “Troque a cor para preto, mantenha a bancada clara e mostre a vista frontal.”

> “Mostre a vista superior técnica e abra o Render Final profissional.”

> “Gere um tour profissional do balcão com a configuração atual.”
