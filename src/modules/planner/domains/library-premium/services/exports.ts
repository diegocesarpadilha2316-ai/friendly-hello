import type { LibraryMaterial, LibraryHardware, PremiumExportFormat } from "../types";

export interface PremiumExportInput {
  readonly format: PremiumExportFormat;
  readonly materials?: readonly LibraryMaterial[];
  readonly hardware?: readonly LibraryHardware[];
}

export function exportPremium(input: PremiumExportInput): {
  readonly content: string;
  readonly mime: string;
  readonly filename: string;
} {
  const { format } = input;
  const materials = input.materials ?? [];
  const hardware = input.hardware ?? [];
  switch (format) {
    case "json":
      return {
        content: JSON.stringify({ materials, hardware }, null, 2),
        mime: "application/json",
        filename: `biblioteca-dioris-${Date.now()}.json`,
      };
    case "csv":
    case "excel": {
      const lines: string[] = ["kind,id,manufacturer,category,name,price"];
      for (const m of materials) {
        lines.push(
          [
            "material",
            m.id,
            m.manufacturer,
            m.category,
            m.colorName ?? "",
            m.pricePerM2 ?? "",
          ].join(","),
        );
      }
      for (const h of hardware) {
        lines.push(
          ["hardware", h.id, h.manufacturer, h.category, h.model, h.unitPrice ?? ""].join(","),
        );
      }
      return {
        content: lines.join("\n"),
        mime: format === "csv" ? "text/csv" : "application/vnd.ms-excel",
        filename: `biblioteca-dioris-${Date.now()}.${format === "csv" ? "csv" : "xls"}`,
      };
    }
    case "xml": {
      const esc = (s: string) =>
        s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
      const body =
        materials
          .map(
            (m) =>
              `  <material id="${esc(m.id)}" mfr="${esc(m.manufacturer)}" cat="${esc(m.category)}"/>`,
          )
          .join("\n") +
        "\n" +
        hardware
          .map(
            (h) =>
              `  <hardware id="${esc(h.id)}" mfr="${esc(h.manufacturer)}" cat="${esc(h.category)}"/>`,
          )
          .join("\n");
      return {
        content: `<?xml version="1.0" encoding="UTF-8"?>\n<library>\n${body}\n</library>`,
        mime: "application/xml",
        filename: `biblioteca-dioris-${Date.now()}.xml`,
      };
    }
    case "zip":
      return {
        content: JSON.stringify({ materials, hardware }),
        mime: "application/zip",
        filename: `biblioteca-dioris-${Date.now()}.zip`,
      };
  }
}
