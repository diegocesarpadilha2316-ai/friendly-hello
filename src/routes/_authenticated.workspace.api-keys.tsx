import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  type ApiKey,
} from "@/core/configuration";

export const Route = createFileRoute("/_authenticated/workspace/api-keys")({
  head: () => ({
    meta: [
      { title: "API Keys — Workspace | Dioris Hub" },
      { name: "description", content: "Chaves de API emitidas para a empresa ativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceKeys,
});

function WorkspaceKeys() {
  const q = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const rows = (q.data ?? []) as ApiKey[];

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("");
  const [plainToken, setPlainToken] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), scopes: scopes.split(",").map((s) => s.trim()).filter(Boolean) },
      {
        onSuccess: (r) => {
          const token = (r as { plainToken?: string })?.plainToken ?? null;
          setPlainToken(token);
          setName("");
          setScopes("");
          setOpenCreate(false);
          toast.success("Chave criada — copie o token agora");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const copy = async (v: string) => {
    await navigator.clipboard.writeText(v);
    toast.success("Copiado");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="API Keys"
        description="Chaves emitidas para a empresa"
        actions={
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> Nova chave
          </Button>
        }
      />
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="h-6 w-6" />}
            title="Nenhuma chave"
            description="Emita uma chave para autenticar chamadas à API Gateway."
          />
        ) : (
          <DataTable
            data={rows}
            columns={[
              { id: "name", header: "Nome", cell: (r) => r.name },
              {
                id: "prefix",
                header: "Prefixo",
                cell: (r) => <span className="font-mono text-xs">{r.prefix}</span>,
              },
              {
                id: "created",
                header: "Criada",
                cell: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "—"),
              },
              {
                id: "status",
                header: "Status",
                cell: (r) => (
                  <StatusBadge tone={r.revokedAt ? "danger" : "success"}>
                    {r.revokedAt ? "revogada" : "ativa"}
                  </StatusBadge>
                ),
              },
              {
                id: "actions",
                header: "",
                align: "right",
                cell: (r) =>
                  r.revokedAt ? null : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        revoke.mutate(r.id, {
                          onSuccess: () => toast.success("Chave revogada"),
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Revogar
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova API Key</DialogTitle>
            <DialogDescription>
              O token completo será exibido apenas uma vez. Guarde em local seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Backend produção" />
            </div>
            <div>
              <Label>Escopos (separados por vírgula)</Label>
              <Input value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="read, write" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={create.isPending || !name.trim()}>
              Criar chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!plainToken} onOpenChange={(o) => !o && setPlainToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copie seu token</DialogTitle>
            <DialogDescription>
              Este valor NÃO será exibido novamente. Copie e armazene em um cofre seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs break-all">
            {plainToken}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => plainToken && copy(plainToken)}>
              <Copy className="mr-1 h-4 w-4" /> Copiar
            </Button>
            <Button onClick={() => setPlainToken(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
