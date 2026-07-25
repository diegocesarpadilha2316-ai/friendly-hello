/**
 * Geração de PDF executivo da Produção Inteligente Dioris.
 *
 * Client-only: chama-se a partir do handler de export do ProductionStudio.
 * Usa jsPDF + jspdf-autotable, importados dinamicamente para não custar SSR.
 */
import type { ProductionReport } from "../types";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

const BRAND = {
  purple: [139, 92, 246] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
  navy: [11, 18, 32] as [number, number, number],
  ink: [17, 24, 39] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  line: [229, 231, 235] as [number, number, number],
};

export interface ProductionPdfInput {
  projectName: string;
  clientName: string;
  report: ProductionReport;
}

export async function buildProductionPdf(input: ProductionPdfInput): Promise<Blob> {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;

  const { projectName, clientName, report } = input;

  // ── Página 1: Capa executiva ──────────────────────────────────────
  drawCover(doc, pageW, pageH, projectName, clientName, report);

  // ── Página 2: Sumário executivo ───────────────────────────────────
  doc.addPage();
  drawHeader(doc, pageW, projectName, clientName, report.generatedAt);
  drawTOC(doc, pageW, report);

  // ── Página 3+: Conteúdo ───────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, pageW, projectName, clientName, report.generatedAt);

  // ── KPIs em cards ────────────────────────────────────────────────
  const kpis: Array<[string, string]> = [
    ["Módulos", String(report.totals.modules)],
    ["Peças", String(report.totals.parts)],
    ["Chapas", String(report.cuttingPlan.totals.boardsCount)],
    [
      "Aproveitamento",
      `${Math.round(report.cuttingPlan.totals.avgUsageRatio * 100)}%`,
    ],
    ["Peso total", `${report.totals.weightKg.toFixed(1)} kg`],
    ["Fita de borda", `${report.totals.edgeMeters.toFixed(1)} m`],
  ];
  drawKpiRow(doc, marginX, 120, pageW - marginX * 2, kpis);

  // ── Resumo financeiro / tempo ────────────────────────────────────
  let y = 210;
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text("Resumo financeiro & tempo", marginX, y);
  y += 8;
  doc.setDrawColor(...BRAND.line);
  doc.line(marginX, y, pageW - marginX, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4, textColor: BRAND.ink },
    columnStyles: {
      0: { textColor: BRAND.muted, cellWidth: 130 },
      1: { fontStyle: "bold", cellWidth: 140 },
      2: { textColor: BRAND.muted, cellWidth: 130 },
      3: { fontStyle: "bold" },
    },
    body: [
      [
        "Subtotal",
        fmtBRL(report.budget.summary.subtotal),
        "Corte",
        `${report.time.cuttingH} h`,
      ],
      [
        "Overhead",
        fmtBRL(report.budget.summary.overhead),
        "Usinagem",
        `${report.time.machiningH} h`,
      ],
      [
        "Margem",
        fmtBRL(report.budget.summary.margin),
        "Montagem",
        `${report.time.assemblyH} h`,
      ],
      [
        "Impostos",
        fmtBRL(report.budget.summary.taxes),
        "Acabamento",
        `${report.time.finishingH} h`,
      ],
      [
        "Total final",
        fmtBRL(report.budget.summary.final),
        "Total (h)",
        `${report.time.totalH} h`,
      ],
      [
        "R$ / m²",
        fmtBRL(report.budget.summary.perM2),
        "Chapas usadas (m²)",
        report.cuttingPlan.totals.usedAreaM2.toFixed(2),
      ],
    ],
    margin: { left: marginX, right: marginX },
  });

  // ── Lista de corte ───────────────────────────────────────────────
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 24,
    head: [[
      "Cód.",
      "Peça",
      "Material",
      "Esp.",
      "Comp.",
      "Larg.",
      "Qtd",
      "Veio",
      "Fita",
    ]],
    body: report.cutList.map((r) => [
      r.code,
      r.name,
      `${r.brand} · ${r.material}`,
      `${r.thicknessMm} mm`,
      `${r.lengthMm} mm`,
      `${r.widthMm} mm`,
      String(r.qty),
      r.grain || "—",
      r.edgeTape || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3, textColor: BRAND.ink },
    headStyles: {
      fillColor: BRAND.purple,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [246, 244, 255] },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => drawFooter(doc, pageW, pageH),
    willDrawCell: () => {},
    didParseCell: () => {},
  });

  // Adiciona título acima da tabela de corte, usando a página onde ela começa.
  // A tabela usa startY = lastAutoTable.finalY + 24; se ultrapassou a página,
  // o cabeçalho é redesenhado por didDrawPage — o título só faz sentido antes.
  // Estratégia simples: escrever no yFinal antes da chamada, movendo pra cá:
  // (deixado como comentário — a tabela já tem head auto-repeated).

  // ── Ferragens (BOM) ──────────────────────────────────────────────
  if (report.hardware.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 24,
      head: [["Cód.", "Ferragem", "Marca", "Qtd", "Un.", "Unitário", "Total"]],
      body: report.hardware.map((h) => [
        h.code,
        h.label,
        h.brand,
        String(h.qty),
        h.unit,
        fmtBRL(h.unitPrice),
        fmtBRL(h.total),
      ]),
      styles: { fontSize: 8, cellPadding: 3, textColor: BRAND.ink },
      headStyles: {
        fillColor: BRAND.blue,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      margin: { left: marginX, right: marginX },
      didDrawPage: () => drawFooter(doc, pageW, pageH),
    });
  }

  // ── Plano de corte (resumo por chapa) ────────────────────────────
  if (report.cuttingPlan.boards.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 24,
      head: [[
        "#",
        "Chapa",
        "Material",
        "Peças",
        "Uso",
        "Sobra (m²)",
      ]],
      body: report.cuttingPlan.boards.map((b) => [
        String(b.index + 1),
        `${b.spec.lengthMm} × ${b.spec.widthMm} × ${b.spec.thicknessMm} mm`,
        `${b.spec.brand} · ${b.spec.material}`,
        String(b.placements.length),
        `${Math.round(b.usageRatio * 100)}%`,
        b.wasteM2.toFixed(2),
      ]),
      styles: { fontSize: 8, cellPadding: 3, textColor: BRAND.ink },
      headStyles: {
        fillColor: BRAND.cyan,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [236, 254, 255] },
      margin: { left: marginX, right: marginX },
      didDrawPage: () => drawFooter(doc, pageW, pageH),
    });
  }

  drawFooter(doc, pageW, pageH);

  return doc.output("blob");
}

function drawCover(
  doc: import("jspdf").jsPDF,
  pageW: number,
  pageH: number,
  projectName: string,
  clientName: string,
  report: ProductionReport,
) {
  // Fundo navy total
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageW, pageH, "F");

  // Faixa de gradiente Dioris (3 blocos horizontais)
  const bandH = 14;
  const step = pageW / 3;
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 0, step, bandH, "F");
  doc.setFillColor(...BRAND.blue);
  doc.rect(step, 0, step, bandH, "F");
  doc.setFillColor(...BRAND.cyan);
  doc.rect(step * 2, 0, step, bandH, "F");

  // Marca d'água em bloco (mark "D" estilizado)
  doc.setFillColor(139, 92, 246);
  doc.roundedRect(pageW - 180, pageH - 220, 120, 120, 18, 18, "F");
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(pageW - 160, pageH - 200, 120, 120, 18, 18, "F");
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(pageW - 140, pageH - 180, 120, 120, 18, 18, "F");

  // Eyebrow
  doc.setTextColor(200, 200, 220);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DIORIS · PLANNER · PRODUÇÃO INTELIGENTE", 40, 90);

  // Título grande
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório executivo", 40, 150);
  doc.setFontSize(34);
  doc.text("de produção", 40, 188);

  // Projeto / cliente
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 220);
  doc.text("Projeto", 40, 240);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(projectName || "—", 40, 260);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 220);
  doc.text("Cliente", 40, 290);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(clientName || "—", 40, 310);

  // Métricas rápidas no rodapé da capa
  const metrics: Array<[string, string]> = [
    ["Módulos", String(report.totals.modules)],
    ["Peças", String(report.totals.parts)],
    ["Total final", fmtBRL(report.budget.summary.final)],
    ["Horas", `${report.time.totalH} h`],
  ];
  const y = pageH - 120;
  const gap = 12;
  const cardW = (pageW - 80 - gap * 3) / 4;
  metrics.forEach(([label, value], i) => {
    const cx = 40 + i * (cardW + gap);
    doc.setFillColor(23, 32, 51);
    doc.setDrawColor(60, 70, 90);
    doc.roundedRect(cx, y, cardW, 66, 8, 8, "FD");
    doc.setTextColor(180, 190, 210);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), cx + 12, y + 22);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(value, cx + 12, y + 48);
  });

  // Data
  doc.setTextColor(160, 170, 190);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em ${fmtDate(report.generatedAt)}`, 40, pageH - 32);
  doc.text("Dioris Hub · Inteligência que conecta tudo.", pageW - 40, pageH - 32, {
    align: "right",
  });
}

function drawTOC(
  doc: import("jspdf").jsPDF,
  pageW: number,
  report: ProductionReport,
) {
  doc.setTextColor(...BRAND.ink);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Sumário executivo", 40, 110);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "Este relatório reúne todos os artefatos necessários para orçar, produzir e",
    40,
    130,
  );
  doc.text(
    "montar o projeto — extraídos automaticamente pelo Dioris Planner.",
    40,
    145,
  );

  const items: Array<[string, string]> = [
    ["1", "KPIs e indicadores principais"],
    ["2", "Resumo financeiro e tempo de produção"],
    ["3", `Lista de corte (${report.cutList.length} linhas)`],
    ["4", `Ferragens / BOM (${report.hardware.length} itens)`],
    ["5", `Plano de corte por chapa (${report.cuttingPlan.boards.length} chapas)`],
  ];

  let y = 190;
  items.forEach(([num, label]) => {
    doc.setFillColor(...BRAND.purple);
    doc.circle(50, y - 4, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(num, 50, y - 1, { align: "center" });

    doc.setTextColor(...BRAND.ink);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(label, 70, y);

    doc.setDrawColor(...BRAND.line);
    doc.line(70, y + 6, pageW - 40, y + 6);

    y += 30;
  });
}

function drawHeader(
  doc: import("jspdf").jsPDF,
  pageW: number,
  projectName: string,
  clientName: string,
  generatedAt: string,
) {
  // Faixa gradiente simulado (3 blocos)
  const bandH = 6;
  const bandY = 0;
  const step = pageW / 3;
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, bandY, step, bandH, "F");
  doc.setFillColor(...BRAND.blue);
  doc.rect(step, bandY, step, bandH, "F");
  doc.setFillColor(...BRAND.cyan);
  doc.rect(step * 2, bandY, step, bandH, "F");

  // Título
  doc.setTextColor(...BRAND.navy);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Dioris — Produção Inteligente", 40, 44);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text(
    `Projeto: ${projectName}   ·   Cliente: ${clientName}   ·   Gerado em ${fmtDate(generatedAt)}`,
    40,
    62,
  );

  // Linha divisória
  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.5);
  doc.line(40, 78, pageW - 40, 78);
}

function drawKpiRow(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  totalW: number,
  kpis: Array<[string, string]>,
) {
  const cols = kpis.length;
  const gap = 8;
  const cardW = (totalW - gap * (cols - 1)) / cols;
  const cardH = 60;

  kpis.forEach(([label, value], i) => {
    const cx = x + i * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...BRAND.line);
    doc.roundedRect(cx, y - 46, cardW, cardH, 6, 6, "FD");

    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), cx + 10, y - 30);

    doc.setTextColor(...BRAND.navy);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(value, cx + 10, y - 12);
  });
}

function drawFooter(
  doc: import("jspdf").jsPDF,
  pageW: number,
  pageH: number,
) {
  const y = pageH - 24;
  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.5);
  doc.line(40, y - 10, pageW - 40, y - 10);

  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Dioris Hub · Planner · Produção Inteligente", 40, y);

  const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
  const totalPages = (doc as any).internal.getNumberOfPages();
  doc.text(`${pageNumber} / ${totalPages}`, pageW - 40, y, { align: "right" });
}