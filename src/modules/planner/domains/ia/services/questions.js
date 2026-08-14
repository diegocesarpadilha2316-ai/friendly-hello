import { listPrimitives, findCatalogItem, decomposeFurniture } from "@/modules/planner/shared";
function currentRoom(project, envId, roomId) {
  return (
    project.environments.find((e) => e.id === envId)?.rooms.find((r) => r.id === roomId) ?? null
  );
}
function furniture(room) {
  return listPrimitives(room).filter((p) => p.kind === "furniture");
}
export function answerQuestion(q, project, ctx, rules) {
  const room = currentRoom(project, ctx.environmentId, ctx.roomId);
  if (!room) return "Selecione um cômodo primeiro para eu responder.";
  const items = furniture(room);
  switch (q.kind) {
    case "measurements":
      return `O cômodo **${room.name}** mede **${room.dimensions.width} × ${room.dimensions.depth} × ${room.dimensions.height} mm** — ${(room.dimensions.width / 1000).toFixed(2)}m × ${(room.dimensions.depth / 1000).toFixed(2)}m × ${(room.dimensions.height / 1000).toFixed(2)}m.`;
    case "materials": {
      if (items.length === 0) return "Ainda não há móveis para analisar.";
      const counts = new Map();
      for (const f of items) {
        const m = String(f.params.material ?? "MDF 18mm");
        counts.set(m, (counts.get(m) ?? 0) + 1);
      }
      const lines = [...counts.entries()].map(([mat, n]) => `- ${mat} — ${n} peça(s)`);
      return `Materiais utilizados em **${room.name}**:\n${lines.join("\n")}`;
    }
    case "part_count": {
      let total = 0;
      for (const f of items) total += decomposeFurniture(f, rules).totals.partCount;
      return `**${items.length}** móvel(is) → **${total}** peças de fabricação.`;
    }
    case "door_count": {
      let doors = 0;
      for (const f of items)
        doors += decomposeFurniture(f, rules)
          .parts.filter((p) => p.kind === "porta")
          .reduce((a, p) => a + p.qty, 0);
      return `Total de portas no cômodo: **${doors}**.`;
    }
    case "drawer_count": {
      let dr = 0;
      for (const f of items)
        dr += decomposeFurniture(f, rules)
          .parts.filter((p) => p.kind === "gaveta-frente")
          .reduce((a, p) => a + p.qty, 0);
      return `Total de gavetas no cômodo: **${dr}**.`;
    }
    case "hardware": {
      const hw = rules.defaults.hardware;
      const rows = Object.entries(hw).map(([k, v]) => `- ${k}: **${v}**`);
      return `Ferragens padrão da empresa:\n${rows.join("\n") || "(nenhuma definida)"}`;
    }
    case "board_area": {
      let m2 = 0;
      for (const f of items) m2 += decomposeFurniture(f, rules).totals.boardAreaM2;
      const chapas = Math.ceil(m2 / 5.06); // MDF 2750×1840
      return `Área total de chapa: **${m2.toFixed(2)} m²** — aproximadamente **${chapas}** chapa(s) de 2,75 × 1,84 m.`;
    }
    case "budget": {
      let m2 = 0;
      for (const f of items) m2 += decomposeFurniture(f, rules).totals.boardAreaM2;
      const catalogTotal = items.reduce(
        (acc, f) => acc + (findCatalogItem(f.catalogItemId)?.priceBRL ?? 0),
        0,
      );
      const est = catalogTotal || m2 * 850;
      return `Estimativa preliminar: **R$ ${est.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** — cálculo executivo virá do módulo Orçamento.`;
    }
    case "help":
      return [
        "Posso criar e editar projetos inteiros por conversa. Exemplos:",
        "- **Crie uma cozinha moderna**",
        "- **Troque o MDF para Freijó**",
        "- **Abra todas as portas / gavetas**",
        "- **Adicione LED / painel ripado / ilha**",
        "- **Duplique / espelhe / gire / centralize**",
        "- Perguntas: **Quanto mede?**, **Quantas portas?**, **Qual valor estimado?**",
      ].join("\n");
  }
}
