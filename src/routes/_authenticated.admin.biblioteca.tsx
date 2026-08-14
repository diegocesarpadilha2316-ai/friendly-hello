import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Database,
  Package,
  Wrench,
  Trash2,
  Save,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { app } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  EmptyState,
  SearchInput,
} from "@/core/components/ui-kit";
import { useIsPlatformAdmin } from "@/core/hooks";
import {
  importPlannerLibrary,
  adminListImportHistory,
  adminLibraryStats,
  adminListHardware,
  adminListMaterials,
  adminUpdateHardware,
  adminUpdateMaterial,
  adminDeleteHardware,
  adminDeleteMaterial,
} from "@/modules/planner/domains/catalog/library.admin.functions";

export const Route = createFileRoute("/_authenticated/admin/biblioteca")({
  head: () => ({
    meta: [
      { title: `${app.name} — Biblioteca Dioris (Admin)` },
      {
        name: "description",
        content:
          "Gerenciamento oficial da Biblioteca Dioris: importação de CSV, preços, texturas e parâmetros CNC. Acesso restrito ao administrador da plataforma.",
      },
      { property: "og:title", content: `${app.name} — Biblioteca Dioris (Admin)` },
      {
        property: "og:description",
        content: "Painel administrativo da Biblioteca Dioris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBibliotecaPage,
});

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------
function parseCSV(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cur.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field.length > 0 || cur.length > 0) {
        cur.push(field);
        rows.push(cur);
      }
      cur = [];
      field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

const num = (v: string): number => {
  const n = Number((v ?? "").toString().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const optNum = (v: string): number | null => {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const optStr = (v: string): string | null => (v ? v : null);

type MaterialRow = {
  id: string;
  fabricante: string;
  marca: string;
  linha: string | null;
  categoria: string;
  padrao: string | null;
  cor_nome: string | null;
  cor_hex: string | null;
  textura_url: string | null;
  espessura_mm: number;
  largura_mm: number | null;
  comprimento_mm: number | null;
  sentido_veio: "vertical" | "horizontal" | "livre" | null;
  preco_m2: number | null;
  ativo?: boolean;
};

type HardwareRow = {
  id: string;
  fabricante: string;
  marca: string;
  categoria: string;
  modelo: string;
  descricao: string | null;
  imagem_url: string | null;
  preco_unitario: number | null;
  parametros_cnc?: Record<string, unknown>;
  furacao: number | null;
  profundidade: number | null;
  folga: number | null;
  ativo?: boolean;
};

function toMaterialRow(r: Record<string, string>): MaterialRow {
  const veio = (r.sentido_veio || "").toLowerCase();
  return {
    id: r.id,
    fabricante: r.fabricante,
    marca: r.marca || r.fabricante,
    linha: optStr(r.linha),
    categoria: r.categoria || "chapa",
    padrao: optStr(r.padrao),
    cor_nome: optStr(r.cor_nome),
    cor_hex: optStr(r.cor_hex),
    textura_url: optStr(r.textura_url),
    espessura_mm: num(r.espessura_mm),
    largura_mm: optNum(r.largura_mm),
    comprimento_mm: optNum(r.comprimento_mm),
    sentido_veio: veio === "vertical" || veio === "horizontal" || veio === "livre" ? veio : null,
    preco_m2: optNum(r.preco_m2),
    ativo: r.ativo ? r.ativo !== "false" && r.ativo !== "0" : true,
  };
}

function toHardwareRow(r: Record<string, string>): HardwareRow {
  let cnc: Record<string, unknown> = {};
  if (r.parametros_cnc) {
    try {
      cnc = JSON.parse(r.parametros_cnc);
    } catch {
      cnc = {};
    }
  }
  return {
    id: r.id,
    fabricante: r.fabricante,
    marca: r.marca || r.fabricante,
    categoria: r.categoria,
    modelo: r.modelo,
    descricao: optStr(r.descricao),
    imagem_url: optStr(r.imagem_url),
    preco_unitario: optNum(r.preco_unitario),
    parametros_cnc: cnc,
    furacao: optNum(r.furacao),
    profundidade: optNum(r.profundidade),
    folga: optNum(r.folga),
    ativo: r.ativo ? r.ativo !== "false" && r.ativo !== "0" : true,
  };
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
function AdminBibliotecaPage() {
  const { isAdmin, loading } = useIsPlatformAdmin();

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando permissões…
        </div>
      </PageContainer>
    );
  }

  if (!isAdmin) return <AccessDenied />;

  return <AdminLibraryContent />;
}

function AccessDenied() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8 text-destructive" />}
          title="Acesso restrito"
          description="A Biblioteca Dioris é gerenciada exclusivamente pelo administrador da plataforma. Usuários comuns podem apenas consultar e utilizar materiais oficiais nos projetos."
          action={
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Admin Center
            </Link>
          }
        />
      </div>
    </PageContainer>
  );
}

type Tab = "materiais" | "ferragens" | "historico";

type ImportReportShape = {
  importId: string | null;
  kind: "materials" | "hardware";
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; id?: string; reason: string }>;
};

function AdminLibraryContent() {
  const [tab, setTab] = useState<Tab>("materiais");
  const [stats, setStats] = useState<{ materials: number; hardware: number } | null>(null);

  const refreshStats = useCallback(() => {
    adminLibraryStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin Center · Biblioteca Dioris"
        title="Gerenciamento da Biblioteca Oficial"
        description="Somente o administrador da plataforma pode importar CSVs, atualizar materiais, preços, texturas, parâmetros CNC e fabricantes. Usuários comuns apenas consultam e utilizam."
        actions={
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Admin Center
          </Link>
        }
      />

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Materiais (chapas)"
          value={stats ? stats.materials.toLocaleString("pt-BR") : "—"}
          hint="Duratex, Arauco, Guararapes…"
        />
        <MetricCard
          label="Ferragens"
          value={stats ? stats.hardware.toLocaleString("pt-BR") : "—"}
          hint="Blum, Hettich, Häfele…"
        />
        <MetricCard label="Modo" value="Admin" hint="Escrita liberada por RLS" />
      </section>

      <div className="mt-6 flex items-center gap-2 border-b border-border/60">
        <TabButton active={tab === "materiais"} onClick={() => setTab("materiais")}>
          <Package className="h-4 w-4" /> Materiais
        </TabButton>
        <TabButton active={tab === "ferragens"} onClick={() => setTab("ferragens")}>
          <Wrench className="h-4 w-4" /> Ferragens
        </TabButton>
        <TabButton active={tab === "historico"} onClick={() => setTab("historico")}>
          <History className="h-4 w-4" /> Histórico
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "materiais" && <MaterialsPanel onChanged={refreshStats} />}
        {tab === "ferragens" && <HardwarePanel onChanged={refreshStats} />}
        {tab === "historico" && <HistoryPanel />}
      </div>
    </PageContainer>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Materiais
// ---------------------------------------------------------------------------
function MaterialsPanel({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<MaterialRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{
    tone: "info" | "success" | "danger";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    adminListMaterials({ data: { search: search || undefined, limit: 500 } as never })
      .then((r) => setRows(r as MaterialRow[]))
      .catch((e) => setStatus({ tone: "danger", text: e?.message || "Falha ao listar" }));
  }, [search]);

  useEffect(() => {
    reload();
  }, [reload]);

  const [report, setReport] = useState<ImportReportShape | null>(null);
  const handleImport = async (file: File) => {
    setBusy(true);
    setReport(null);
    setStatus({ tone: "info", text: `Lendo ${file.name}…` });
    try {
      const text = await file.text();
      const raw = parseCSV(text);
      const parsed = raw.filter((r) => r.id && r.fabricante && r.espessura_mm).map(toMaterialRow);
      if (parsed.length === 0) {
        setStatus({ tone: "danger", text: "Nenhuma linha válida encontrada no CSV." });
        setBusy(false);
        return;
      }
      setStatus({ tone: "info", text: `Processando ${parsed.length} materiais em lote…` });
      const r = (await importPlannerLibrary({
        data: { kind: "materials", filename: file.name, rows: parsed } as never,
      })) as ImportReportShape;
      setReport(r);
      setStatus({
        tone: r.errors.length > 0 ? "danger" : "success",
        text: `+${r.inserted} novos · ${r.updated} atualizados · ${r.skipped} duplicados · ${r.errors.length} erros`,
      });
      onChanged();
      reload();
    } catch (e) {
      setStatus({ tone: "danger", text: (e as Error).message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por padrão (Carvalho, Branco TX…)"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Biblioteca (CSV)
          </button>
        </div>
      </div>

      {status && <StatusLine tone={status.tone}>{status.text}</StatusLine>}
      {report && <ImportReportCard report={report} />}

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
          Colunas esperadas:{" "}
          <code className="text-foreground/80">
            id, fabricante, marca, linha, categoria, padrao, cor_nome, cor_hex, textura_url,
            espessura_mm, largura_mm, comprimento_mm, sentido_veio, preco_m2
          </code>
        </div>
        {!rows ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Database className="h-8 w-8" />}
            title="Nenhum material cadastrado"
            description="Importe um CSV para popular a biblioteca oficial."
          />
        ) : (
          <MaterialsTable
            rows={rows}
            onChanged={() => {
              onChanged();
              reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

function MaterialsTable({ rows, onChanged }: { rows: MaterialRow[]; onChanged: () => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Fabricante</th>
            <th className="px-4 py-2">Padrão</th>
            <th className="px-4 py-2">Esp.</th>
            <th className="px-4 py-2">Textura</th>
            <th className="px-4 py-2">Preço m²</th>
            <th className="px-4 py-2">Ativo</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <MaterialRowEditor key={row.id} row={row} onChanged={onChanged} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaterialRowEditor({ row, onChanged }: { row: MaterialRow; onChanged: () => void }) {
  const [preco, setPreco] = useState<string>(row.preco_m2?.toString() ?? "");
  const [textura, setTextura] = useState<string>(row.textura_url ?? "");
  const [ativo, setAtivo] = useState<boolean>(row.ativo ?? true);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () =>
      preco !== (row.preco_m2?.toString() ?? "") ||
      textura !== (row.textura_url ?? "") ||
      ativo !== (row.ativo ?? true),
    [preco, textura, ativo, row],
  );

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateMaterial({
        data: {
          id: row.id,
          patch: {
            preco_m2: preco === "" ? null : Number(preco.replace(",", ".")),
            textura_url: textura || null,
            ativo,
          },
        } as never,
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Desativar material "${row.id}"?`)) return;
    await adminDeleteMaterial({ data: { id: row.id } as never });
    onChanged();
  };

  return (
    <tr className="border-t border-border/40 hover:bg-background/40">
      <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
      <td className="px-4 py-2">{row.fabricante}</td>
      <td className="px-4 py-2">{row.padrao ?? "—"}</td>
      <td className="px-4 py-2">{row.espessura_mm} mm</td>
      <td className="px-4 py-2">
        <input
          type="url"
          value={textura}
          onChange={(e) => setTextura(e.target.value)}
          placeholder="https://…"
          className="w-40 rounded border border-border/50 bg-background px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-24 rounded border border-border/50 bg-background px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-2">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={save}
            className="inline-flex items-center gap-1 rounded border border-border/50 px-2 py-1 text-xs hover:border-primary/50 hover:text-primary disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 rounded border border-border/50 px-2 py-1 text-xs text-destructive hover:border-destructive/60"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Ferragens
// ---------------------------------------------------------------------------
function HardwarePanel({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<HardwareRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{
    tone: "info" | "success" | "danger";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    adminListHardware({ data: { search: search || undefined, limit: 500 } as never })
      .then((r) => setRows(r as HardwareRow[]))
      .catch((e) => setStatus({ tone: "danger", text: e?.message || "Falha ao listar" }));
  }, [search]);

  useEffect(() => {
    reload();
  }, [reload]);

  const [report, setReport] = useState<ImportReportShape | null>(null);
  const handleImport = async (file: File) => {
    setBusy(true);
    setReport(null);
    setStatus({ tone: "info", text: `Lendo ${file.name}…` });
    try {
      const text = await file.text();
      const raw = parseCSV(text);
      const parsed = raw.filter((r) => r.id && r.fabricante && r.modelo).map(toHardwareRow);
      if (parsed.length === 0) {
        setStatus({ tone: "danger", text: "Nenhuma linha válida encontrada no CSV." });
        setBusy(false);
        return;
      }
      setStatus({ tone: "info", text: `Processando ${parsed.length} ferragens em lote…` });
      const r = (await importPlannerLibrary({
        data: { kind: "hardware", filename: file.name, rows: parsed } as never,
      })) as ImportReportShape;
      setReport(r);
      setStatus({
        tone: r.errors.length > 0 ? "danger" : "success",
        text: `+${r.inserted} novos · ${r.updated} atualizados · ${r.skipped} duplicados · ${r.errors.length} erros`,
      });
      onChanged();
      reload();
    } catch (e) {
      setStatus({ tone: "danger", text: (e as Error).message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por modelo (Clip Top, Movento…)"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Biblioteca (CSV)
          </button>
        </div>
      </div>

      {status && <StatusLine tone={status.tone}>{status.text}</StatusLine>}
      {report && <ImportReportCard report={report} />}

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
          Colunas esperadas:{" "}
          <code className="text-foreground/80">
            id, fabricante, marca, categoria, modelo, descricao, imagem_url, preco_unitario,
            parametros_cnc, furacao, profundidade, folga
          </code>
        </div>
        {!rows ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8" />}
            title="Nenhuma ferragem cadastrada"
            description="Importe um CSV para popular a biblioteca oficial."
          />
        ) : (
          <HardwareTable
            rows={rows}
            onChanged={() => {
              onChanged();
              reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

function HardwareTable({ rows, onChanged }: { rows: HardwareRow[]; onChanged: () => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Fabricante</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Modelo</th>
            <th className="px-4 py-2">Furação</th>
            <th className="px-4 py-2">Preço</th>
            <th className="px-4 py-2">Ativo</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <HardwareRowEditor key={r.id} row={r} onChanged={onChanged} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HardwareRowEditor({ row, onChanged }: { row: HardwareRow; onChanged: () => void }) {
  const [preco, setPreco] = useState(row.preco_unitario?.toString() ?? "");
  const [furacao, setFuracao] = useState(row.furacao?.toString() ?? "");
  const [ativo, setAtivo] = useState<boolean>(row.ativo ?? true);
  const [saving, setSaving] = useState(false);

  const dirty =
    preco !== (row.preco_unitario?.toString() ?? "") ||
    furacao !== (row.furacao?.toString() ?? "") ||
    ativo !== (row.ativo ?? true);

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateHardware({
        data: {
          id: row.id,
          patch: {
            preco_unitario: preco === "" ? null : Number(preco.replace(",", ".")),
            furacao: furacao === "" ? null : Number(furacao.replace(",", ".")),
            ativo,
          },
        } as never,
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Desativar ferragem "${row.id}"?`)) return;
    await adminDeleteHardware({ data: { id: row.id } as never });
    onChanged();
  };

  return (
    <tr className="border-t border-border/40 hover:bg-background/40">
      <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
      <td className="px-4 py-2">{row.fabricante}</td>
      <td className="px-4 py-2">{row.categoria}</td>
      <td className="px-4 py-2">{row.modelo}</td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="0.1"
          value={furacao}
          onChange={(e) => setFuracao(e.target.value)}
          className="w-20 rounded border border-border/50 bg-background px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-24 rounded border border-border/50 bg-background px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-2">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={save}
            className="inline-flex items-center gap-1 rounded border border-border/50 px-2 py-1 text-xs hover:border-primary/50 hover:text-primary disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 rounded border border-border/50 px-2 py-1 text-xs text-destructive hover:border-destructive/60"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusLine({
  tone,
  children,
}: {
  tone: "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    info: { badge: "info" as const, Icon: Loader2 },
    success: { badge: "success" as const, Icon: CheckCircle2 },
    danger: { badge: "danger" as const, Icon: AlertTriangle },
  };
  const { badge, Icon } = map[tone];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm">
      <StatusBadge tone={badge}>
        <Icon className={`mr-1 h-3 w-3 ${tone === "info" ? "animate-spin" : ""}`} />
        {tone}
      </StatusBadge>
      <span>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relatório de importação
// ---------------------------------------------------------------------------
function ImportReportCard({ report }: { report: ImportReportShape }) {
  const [showErrors, setShowErrors] = useState(false);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        Relatório da importação
        {report.importId && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            #{report.importId.slice(0, 8)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ReportStat label="Total" value={report.total} />
        <ReportStat label="Adicionados" value={report.inserted} tone="success" />
        <ReportStat label="Atualizados" value={report.updated} tone="info" />
        <ReportStat label="Duplicados" value={report.skipped} tone="muted" />
        <ReportStat
          label="Erros"
          value={report.errors.length}
          tone={report.errors.length > 0 ? "danger" : "muted"}
        />
      </div>
      {report.errors.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowErrors((v) => !v)}
            className="text-xs font-medium text-destructive hover:underline"
          >
            {showErrors ? "Ocultar" : "Ver"} {report.errors.length} erro(s)
          </button>
          {showErrors && (
            <ul className="mt-2 max-h-56 space-y-1 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
              {report.errors.slice(0, 200).map((e, i) => (
                <li key={i} className="font-mono">
                  <span className="text-destructive">Linha {e.row}</span>
                  {e.id && <span className="text-muted-foreground"> · {e.id}</span>}
                  <span className="text-foreground/80"> — {e.reason}</span>
                </li>
              ))}
              {report.errors.length > 200 && (
                <li className="text-muted-foreground">
                  … +{report.errors.length - 200} erros omitidos
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ReportStat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "success" | "info" | "danger";
}) {
  const colors = {
    muted: "text-foreground",
    success: "text-emerald-500",
    info: "text-sky-500",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${colors}`}>{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Histórico de importações
// ---------------------------------------------------------------------------
type HistoryRow = {
  id: string;
  kind: "materials" | "hardware";
  filename: string | null;
  total_rows: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  admin_email: string | null;
  admin_user_id: string | null;
  created_at: string;
};

function HistoryPanel() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminListImportHistory({ data: { limit: 100 } as never })
      .then((r) => setRows(r as HistoryRow[]))
      .catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <StatusLine tone="danger">{err}</StatusLine>;
  if (!rows) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando histórico…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Nenhuma importação registrada"
        description="O histórico de importações da Biblioteca Dioris aparecerá aqui."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead className="bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Arquivo</th>
            <th className="px-4 py-2 text-left">Admin</th>
            <th className="px-4 py-2 text-right">Total</th>
            <th className="px-4 py-2 text-right">Novos</th>
            <th className="px-4 py-2 text-right">Atualizados</th>
            <th className="px-4 py-2 text-right">Duplicados</th>
            <th className="px-4 py-2 text-right">Erros</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/40 hover:bg-background/40">
              <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </td>
              <td className="px-4 py-2">
                <StatusBadge tone={r.kind === "materials" ? "info" : "warning"}>
                  {r.kind === "materials" ? "Materiais" : "Ferragens"}
                </StatusBadge>
              </td>
              <td className="px-4 py-2 font-mono text-xs">{r.filename ?? "—"}</td>
              <td className="px-4 py-2 text-xs">
                {r.admin_email ?? r.admin_user_id?.slice(0, 8) ?? "—"}
              </td>
              <td className="px-4 py-2 text-right">{r.total_rows.toLocaleString("pt-BR")}</td>
              <td className="px-4 py-2 text-right text-emerald-500">+{r.inserted_count}</td>
              <td className="px-4 py-2 text-right text-sky-500">{r.updated_count}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{r.skipped_count}</td>
              <td
                className={`px-4 py-2 text-right ${r.error_count > 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {r.error_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
