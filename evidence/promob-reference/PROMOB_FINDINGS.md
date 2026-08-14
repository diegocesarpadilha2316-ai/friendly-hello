# Achados verificáveis do projeto Promob

## Arquivo e formato

O anexo `AnaSilvia-CozinhaLuciane.promob` é um pacote ZIP do Promob Enterprise 5.60.39.4, biblioteca Enterprise 2025. O ambiente 3D está em `solucao/container1/document1/document1.ambient3d` e contém XML estruturado com 1.315.716 bytes descompactados.

## Ambiente

O ambiente possui piso/teto com dimensão aproximada de 5611,099 mm de largura por 3885 mm de profundidade. Há parede principal com 2780 mm de altura e 3885 mm de profundidade. As posições do Promob usam coordenadas em milímetros e não correspondem diretamente à sequência didática simplificada de 3400 mm.

## Módulos inferiores relevantes identificados

| ID Promob                         | Dimensões W × H × D (mm) |           Base X/Y/Z (mm) | Indicação técnica                                                                                      |
| --------------------------------- | -----------------------: | ------------------------: | ------------------------------------------------------------------------------------------------------ |
| `coz_inf_bal_1p_2015`             |          700 × 700 × 580 | 1368,124 / 4326,688 / 150 | Balcão inferior de uma porta; componentes de corpo interno, fitas e corpo externo em `cin_cor_000`.    |
| `coz_cai_inf_bal_2015`            |          700 × 700 × 580 | 1368,124 / 4326,688 / 150 | Caixa/corpo associado ao balcão inferior.                                                              |
| `coz_cav_inf_bal_pt_lat_pt_tem`   |          200 × 700 × 580 | 1168,124 / 4326,688 / 150 | Módulo estreito com frente externa em `sudati_unicolores_amazonia`, porta reta e corpo invertido.      |
| `coz_cai_gav_mod_ccf_2015_pt_tem` |          196 × 650 × 556 | 1170,124 / 4296,688 / 152 | Caixa de gavetas com componentes de alumínio e MDF/fitas.                                              |
| `coz_cai_div_gav_2015_pt_tem_sup` |          144 × 150 × 556 | 1196,124 / 4296,688 / 502 | Divisor/parte superior do gaveteiro.                                                                   |
| `coz_cai_div_gav_2015_pt_tem_inf` |          144 × 200 × 556 | 1196,124 / 4296,688 / 182 | Divisor/parte inferior do gaveteiro.                                                                   |
| `coz_cav_inf_can_l_2p_dir`        |         1000 × 700 × 834 | 2902,124 / 4326,688 / 150 | Módulo inferior de canto com duas portas, profundidade especial de 834 mm.                             |
| `coz_cav_inf_bal_2p`              |          800 × 700 × 600 | 2902,124 / 2904,688 / 150 | Balcão inferior de duas portas.                                                                        |
| `coz_cav_inf_gav_2g_1gav_3`       |          500 × 700 × 600 | 2902,124 / 2104,688 / 150 | Gaveteiro com duas gavetas e uma gaveta adicional; acabamento externo em `sudati_unicolores_amazonia`. |
| `coz_cav_cai_bal_1rec_gave`       |          500 × 700 × 600 | 2902,124 / 2104,688 / 150 | Caixa correspondente ao módulo de gavetas.                                                             |

## Materiais e ferragens observados

A referência usa majoritariamente `cin_cor_000` para corpo interno e fitas, `sudati_unicolores_amazonia` para frentes/corpos externos em pontos específicos, `dec_met_lis_alu` para acessórios de alumínio, `dec_met_lis_cro` para puxadores cromados, além de vidro fumê, inox e pastilhas verdes no ambiente. O projeto não é apenas uma sequência de caixas brancas: há composição em L, módulos de canto, profundidades diferentes, eletros embutidos, porta, janela/abertura, backsplash e iluminação.

## Evidência visual

A imagem `sugestao.jpg` mostra uma cozinha em composição perimetral/L, com bancada escura, pia central na parede posterior, cooktop à esquerda, torre/eletro em uma lateral, aéreos e revestimento verde no backsplash. A imagem é uma vista de referência Promob, não um render fotorrealista final.

## Divergência principal com a captura anterior

A captura anterior do Planner V2 foi uma validação da ETAPA 1 didática, não uma reprodução visual do projeto Promob. Ela confirmou a engenharia paramétrica da sequência 800 + 600 + 1200 + 800 mm, mas não reproduziu a composição L, os módulos de canto, as profundidades de 580/600/834 mm, o acabamento Amazônia, os puxadores e os eletros do arquivo de referência. Portanto, a crítica do usuário é procedente: a imagem anterior não deve ser apresentada como réplica do Promob.
