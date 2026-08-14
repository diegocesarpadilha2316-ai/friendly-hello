const REVIEW = [
  {
    id: "circulacao",
    title: "Validar circulação",
    description: "Confere corredores e folgas mínimas do ambiente.",
    tool: "check_circulation",
    scope: "comodo",
    optional: false,
    dependsOn: ["layout"],
  },
  {
    id: "revisao",
    title: "Revisar projeto",
    description: "Diagnóstico estruturado do projeto após as mutações.",
    tool: "review_project",
    scope: "projeto",
    optional: false,
    dependsOn: ["circulacao"],
  },
];
const CLOSING = [
  {
    id: "orcamento",
    title: "Preparar orçamento preliminar",
    description: "Estimativa por categoria usando somente preços cadastrados.",
    tool: "estimate_budget",
    scope: "projeto",
    optional: true,
    dependsOn: ["revisao"],
  },
  {
    id: "producao",
    title: "Preparar produção",
    description: "Resumo de produção e lista de corte preliminar.",
    tool: "production_summary",
    scope: "projeto",
    optional: true,
    dependsOn: ["revisao"],
  },
  {
    id: "render",
    title: "Preparar render",
    description: "Configura preset de cena e câmera — não inicia serviço externo.",
    tool: "set_render_preset",
    scope: "cena",
    optional: true,
    dependsOn: ["revisao"],
  },
];
function ambienteStages(description) {
  return [
    {
      id: "estilo",
      title: "Aplicar estilo",
      description: "Define a linguagem visual do ambiente.",
      tool: "set_style",
      scope: "comodo",
      optional: true,
    },
    {
      id: "modulos",
      title: "Criar módulos",
      description,
      tool: "create_room_preset",
      scope: "comodo",
      optional: false,
      dependsOn: ["estilo"],
    },
    {
      id: "layout",
      title: "Organizar layout",
      description: "Distribui os módulos nas paredes utilizáveis.",
      tool: "layout_room",
      scope: "comodo",
      optional: false,
      dependsOn: ["modulos"],
    },
    {
      id: "materiais",
      title: "Aplicar materiais",
      description: "Busca o material na biblioteca oficial e aplica no conjunto.",
      tool: "search_material",
      scope: "comodo",
      optional: false,
      dependsOn: ["modulos"],
    },
  ];
}
export const PIPELINES = {
  cozinha: [
    ...ambienteStages("Balcões inferiores, aéreos, torre e pontos de eletrodomésticos."),
    ...REVIEW,
    ...CLOSING,
  ],
  closet: [
    ...ambienteStages("Módulos com cabideiros, gaveteiros e prateleiras."),
    ...REVIEW,
    ...CLOSING,
  ],
  painel_tv: [
    ...ambienteStages("Painel, rack e nichos com passagem de cabos."),
    ...REVIEW,
    ...CLOSING.filter((s) => s.id !== "producao"),
  ],
  quarto: [
    ...ambienteStages("Guarda-roupa, criados-mudos e painel da cabeceira."),
    ...REVIEW,
    ...CLOSING,
  ],
  escritorio: [
    ...ambienteStages("Bancada ergonômica, armários e iluminação de trabalho."),
    ...REVIEW,
    ...CLOSING,
  ],
  generico: [...ambienteStages("Módulos planejados do pedido."), ...REVIEW, ...CLOSING],
};
const MATCHERS = [
  { id: "cozinha", re: /cozinha|area gourmet|gourmet/ },
  { id: "closet", re: /closet|vestidor/ },
  { id: "painel_tv", re: /painel de tv|home ?theater|rack|sala de tv/ },
  { id: "quarto", re: /quarto|dormitorio|suite/ },
  { id: "escritorio", re: /escritorio|home ?office|estudo/ },
];
export function pickPipeline(message) {
  const t = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return MATCHERS.find((m) => m.re.test(t))?.id ?? "generico";
}
