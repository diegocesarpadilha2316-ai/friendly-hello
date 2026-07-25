import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Copy, Loader2, CheckCircle2, XCircle, QrCode, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  listCreditPacks,
  createPixCheckout,
  getCheckoutOrder,
  type CreditPackDTO,
  type CheckoutOrderDTO,
} from "@/lib/checkout.functions";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = { trigger: React.ReactNode };

export function CheckoutDialog({ trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<CheckoutOrderDTO | null>(null);
  const qc = useQueryClient();

  const listFn = useServerFn(listCreditPacks);
  const createFn = useServerFn(createPixCheckout);
  const getFn = useServerFn(getCheckoutOrder);

  const packsQ = useQuery({
    queryKey: ["credit-packs"],
    queryFn: () => listFn({}),
    enabled: open,
  });
  const packs: CreditPackDTO[] = packsQ.data?.packs ?? [];

  const createMut = useMutation({
    mutationFn: (packKey: string) => createFn({ data: { packKey } }),
    onSuccess: (res) => setOrder(res.order),
  });

  // Polling do status enquanto pendente
  React.useEffect(() => {
    if (!order || order.status !== "pending") return;
    const t = setInterval(async () => {
      try {
        const res = await getFn({ data: { orderId: order.id } });
        setOrder(res.order);
        if (res.order.status === "approved") {
          qc.invalidateQueries({ queryKey: ["billing"] });
          qc.invalidateQueries({ queryKey: ["credit-ledger"] });
        }
      } catch {
        /* ignora falhas transitórias de polling */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [order, getFn, qc]);

  const reset = () => {
    setSelected(null);
    setOrder(null);
    createMut.reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Comprar créditos Dioris
          </DialogTitle>
          <DialogDescription>
            Checkout transparente via Pix — pagamento processado pelo Mercado Pago,
            sem sair da plataforma.
          </DialogDescription>
        </DialogHeader>

        {order ? (
          <PixPanel order={order} onRestart={reset} />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {packsQ.isLoading ? (
                <div className="col-span-full flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando pacotes…
                </div>
              ) : (
                packs.map((p) => {
                  const total = p.credits + Math.floor((p.credits * p.bonusPct) / 100);
                  const isSel = selected === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelected(p.key)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-4 text-left transition",
                        isSel
                          ? "border-primary/60 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                          : "border-border/60 hover:border-primary/40 hover:bg-card/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {p.label}
                        </span>
                        {p.bonusPct > 0 && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            +{p.bonusPct}% bônus
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-semibold">
                          {total.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs text-muted-foreground">créditos</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold text-foreground">
                        {formatBRL(p.priceCents)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {createMut.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {(createMut.error as Error).message}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!selected || createMut.isPending}
                onClick={() => selected && createMut.mutate(selected)}
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Pix…
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" /> Gerar Pix
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PixPanel({ order, onRestart }: { order: CheckoutOrderDTO; onRestart: () => void }) {
  const [copied, setCopied] = React.useState(false);
  const approved = order.status === "approved";
  const failed = ["rejected", "cancelled", "expired"].includes(order.status);

  const copy = async () => {
    if (!order.qrCode) return;
    try {
      await navigator.clipboard.writeText(order.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Status</span>
        <StatusBadge
          tone={approved ? "success" : failed ? "danger" : "warning"}
          label={
            approved
              ? "Pagamento aprovado"
              : failed
                ? `Pagamento ${order.status}`
                : "Aguardando pagamento"
          }
        />
      </div>

      {approved ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <div className="text-lg font-semibold">Créditos liberados!</div>
          <div className="text-sm text-muted-foreground">
            {order.credits.toLocaleString("pt-BR")} créditos foram adicionados à sua empresa.
          </div>
          <Button className="mt-2" onClick={onRestart}>
            Ok
          </Button>
        </div>
      ) : failed ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <div className="text-lg font-semibold">Pagamento não concluído</div>
          <Button variant="ghost" className="mt-2" onClick={onRestart}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="flex items-center justify-center rounded-xl border border-border/60 bg-white p-3">
            {order.qrCodeBase64 ? (
              <img
                alt="QR Code Pix"
                src={`data:image/png;base64,${order.qrCodeBase64}`}
                className="h-52 w-52 object-contain"
              />
            ) : (
              <div className="flex h-52 w-52 items-center justify-center text-xs text-muted-foreground">
                Sem QR
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Valor
              </div>
              <div className="text-2xl font-semibold">
                {formatBRL(order.amountCents)}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.credits.toLocaleString("pt-BR")} créditos
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pix copia-e-cola
              </div>
              <div className="mt-1 flex items-start gap-2">
                <div className="max-h-24 flex-1 overflow-auto rounded-md border border-border/60 bg-background/60 p-2 text-[11px] font-mono break-all">
                  {order.qrCode ?? "—"}
                </div>
                <Button size="icon" variant="ghost" onClick={copy} disabled={!order.qrCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <div className="mt-1 text-[11px] text-emerald-400">Copiado!</div>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Assim que o pagamento for confirmado, os créditos aparecem no seu saldo
              automaticamente (esta janela pode ficar aberta).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutDialog;