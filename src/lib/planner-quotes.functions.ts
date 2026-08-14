/**
 * Etapa 5 — Orçamentos, itens e faturas.
 *
 * Wrapper thin sobre `quotes`, `quote_items`, `invoices` e `invoice_payments`.
 * RLS por `company_id`; middleware `requireTenant` já valida associação.
 * Sem novos providers/stores/migrations — server functions puras.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type QuoteStatus =
  "draft" | "sent" | "viewed" | "approved" | "rejected" | "expired" | "converted";

export interface QuoteRow {
  id: string;
  number: string | null;
  title: string | null;
  status: QuoteStatus;
  clientName: string | null;
  projectId: string | null;
  currency: string;
  subtotal: number;
  discountValue: number;
  taxValue: number;
  shippingValue: number;
  total: number;
  validUntil: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface QuoteItemRow {
  id: string;
  quoteId: string;
  position: number;
  itemType: string;
  referenceId: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
}

function num(v: unknown, d = 0): number {
  if (v == null) return d;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function mapQuote(r: Record<string, unknown>): QuoteRow {
  return {
    id: r.id as string,
    number: (r.number as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    status: (r.status as QuoteStatus) ?? "draft",
    clientName: (r.client_name as string | null) ?? null,
    projectId: (r.project_id as string | null) ?? null,
    currency: (r.currency as string) ?? "BRL",
    subtotal: num(r.subtotal),
    discountValue: num(r.discount_value),
    taxValue: num(r.tax_value),
    shippingValue: num(r.shipping_value),
    total: num(r.total),
    validUntil: (r.valid_until as string | null) ?? null,
    updatedAt: (r.updated_at as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
  };
}

/* --------------------------------- List --------------------------------- */

const listInput = z.object({
  status: z
    .enum(["draft", "sent", "viewed", "approved", "rejected", "expired", "converted"])
    .optional(),
  projectId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listQuotes = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly QuoteRow[]> => {
    let q = context.supabase
      .from("quotes")
      .select(
        "id,number,title,status,client_name,project_id,currency,subtotal,discount_value,tax_value,shipping_value,total,valid_until,updated_at,created_at",
      )
      .eq("company_id", context.tenantId)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(`title.ilike.${term},number.ilike.${term},client_name.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return (rows ?? []).map(mapQuote);
  });

/* ---------------------------------- Get --------------------------------- */

export const getQuote = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const [quoteRes, itemsRes] = await Promise.all([
      context.supabase
        .from("quotes")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", data.id)
        .order("position", { ascending: true }),
    ]);
    if (quoteRes.error) throw new Response(quoteRes.error.message, { status: 400 });
    if (!quoteRes.data) throw new Response("Not found", { status: 404 });
    const items: QuoteItemRow[] = (itemsRes.data ?? []).map((r) => ({
      id: r.id as string,
      quoteId: r.quote_id as string,
      position: num(r.position),
      itemType: (r.item_type as string) ?? "custom",
      referenceId: (r.reference_id as string | null) ?? null,
      sku: (r.sku as string | null) ?? null,
      name: (r.name as string) ?? "",
      description: (r.description as string | null) ?? null,
      quantity: num(r.quantity, 1),
      unit: (r.unit as string | null) ?? null,
      unitPrice: num(r.unit_price),
      discountPercent: num(r.discount_percent),
      taxPercent: num(r.tax_percent),
      total: num(r.total),
    }));
    return { quote: mapQuote(quoteRes.data), items };
  });

/* --------------------------- Create / Update ---------------------------- */

const itemInput = z.object({
  position: z.number().int().min(0).optional(),
  itemType: z.string().max(40).optional(),
  referenceId: z.string().uuid().nullish(),
  sku: z.string().max(80).nullish(),
  name: z.string().trim().min(1).max(240),
  description: z.string().max(2000).nullish(),
  quantity: z.number().min(0),
  unit: z.string().max(20).nullish(),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
});

const createInput = z.object({
  projectId: z.string().uuid().nullish(),
  title: z.string().trim().max(240).optional(),
  description: z.string().max(4000).optional(),
  clientName: z.string().max(240).nullish(),
  clientEmail: z.string().email().nullish(),
  clientPhone: z.string().max(40).nullish(),
  clientDocument: z.string().max(40).nullish(),
  clientAddress: z.string().max(500).nullish(),
  currency: z.string().length(3).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountValue: z.number().min(0).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  taxValue: z.number().min(0).optional(),
  shippingValue: z.number().min(0).optional(),
  paymentTerms: z.string().max(500).nullish(),
  deliveryTerms: z.string().max(500).nullish(),
  notes: z.string().max(2000).nullish(),
  validUntil: z.string().datetime().nullish(),
  items: z.array(itemInput).max(500).optional(),
});

function computeTotals(
  items: z.infer<typeof itemInput>[],
  discountValue = 0,
  taxValue = 0,
  shippingValue = 0,
) {
  const enriched = items.map((it, idx) => {
    const gross = it.quantity * it.unitPrice;
    const disc = gross * ((it.discountPercent ?? 0) / 100);
    const net = gross - disc;
    const tax = net * ((it.taxPercent ?? 0) / 100);
    return { ...it, position: it.position ?? idx, total: Number((net + tax).toFixed(2)) };
  });
  const subtotal = Number(enriched.reduce((s, it) => s + it.total, 0).toFixed(2));
  const total = Number((subtotal - discountValue + taxValue + shippingValue).toFixed(2));
  return { enriched, subtotal, total };
}

export const createQuote = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const items = data.items ?? [];
    const { enriched, subtotal, total } = computeTotals(
      items,
      data.discountValue ?? 0,
      data.taxValue ?? 0,
      data.shippingValue ?? 0,
    );

    const { data: quote, error } = await context.supabase
      .from("quotes")
      .insert({
        company_id: context.tenantId,
        project_id: data.projectId ?? null,
        kind: "quote",
        title: data.title ?? null,
        description: data.description ?? null,
        client_name: data.clientName ?? null,
        client_email: data.clientEmail ?? null,
        client_phone: data.clientPhone ?? null,
        client_document: data.clientDocument ?? null,
        client_address: data.clientAddress ?? null,
        status: "draft",
        currency: data.currency ?? "BRL",
        subtotal,
        discount_percent: data.discountPercent ?? 0,
        discount_value: data.discountValue ?? 0,
        tax_percent: data.taxPercent ?? 0,
        tax_value: data.taxValue ?? 0,
        shipping_value: data.shippingValue ?? 0,
        total,
        payment_terms: data.paymentTerms ?? null,
        delivery_terms: data.deliveryTerms ?? null,
        notes: data.notes ?? null,
        valid_until: data.validUntil ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    if (enriched.length > 0) {
      const { error: itemsError } = await context.supabase.from("quote_items").insert(
        enriched.map((it) => ({
          quote_id: quote.id,
          position: it.position,
          item_type: it.itemType ?? "custom",
          reference_id: it.referenceId ?? null,
          sku: it.sku ?? null,
          name: it.name,
          description: it.description ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          unit_price: it.unitPrice,
          discount_percent: it.discountPercent ?? 0,
          tax_percent: it.taxPercent ?? 0,
          total: it.total,
        })),
      );
      if (itemsError) throw new Response(itemsError.message, { status: 400 });
    }

    return mapQuote(quote);
  });

const updateInput = createInput.partial().extend({ id: z.string().uuid() });

export const updateQuote = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.clientName !== undefined) patch.client_name = data.clientName;
    if (data.clientEmail !== undefined) patch.client_email = data.clientEmail;
    if (data.clientPhone !== undefined) patch.client_phone = data.clientPhone;
    if (data.clientDocument !== undefined) patch.client_document = data.clientDocument;
    if (data.clientAddress !== undefined) patch.client_address = data.clientAddress;
    if (data.projectId !== undefined) patch.project_id = data.projectId;
    if (data.currency !== undefined) patch.currency = data.currency;
    if (data.discountPercent !== undefined) patch.discount_percent = data.discountPercent;
    if (data.discountValue !== undefined) patch.discount_value = data.discountValue;
    if (data.taxPercent !== undefined) patch.tax_percent = data.taxPercent;
    if (data.taxValue !== undefined) patch.tax_value = data.taxValue;
    if (data.shippingValue !== undefined) patch.shipping_value = data.shippingValue;
    if (data.paymentTerms !== undefined) patch.payment_terms = data.paymentTerms;
    if (data.deliveryTerms !== undefined) patch.delivery_terms = data.deliveryTerms;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.validUntil !== undefined) patch.valid_until = data.validUntil;

    // If items provided, replace and recompute
    if (data.items) {
      const { enriched, subtotal, total } = computeTotals(
        data.items,
        (data.discountValue ?? 0) as number,
        (data.taxValue ?? 0) as number,
        (data.shippingValue ?? 0) as number,
      );
      patch.subtotal = subtotal;
      patch.total = total;

      const del = await context.supabase.from("quote_items").delete().eq("quote_id", data.id);
      if (del.error) throw new Response(del.error.message, { status: 400 });
      if (enriched.length > 0) {
        const ins = await context.supabase.from("quote_items").insert(
          enriched.map((it) => ({
            quote_id: data.id,
            position: it.position,
            item_type: it.itemType ?? "custom",
            reference_id: it.referenceId ?? null,
            sku: it.sku ?? null,
            name: it.name,
            description: it.description ?? null,
            quantity: it.quantity,
            unit: it.unit ?? null,
            unit_price: it.unitPrice,
            discount_percent: it.discountPercent ?? 0,
            tax_percent: it.taxPercent ?? 0,
            total: it.total,
          })),
        );
        if (ins.error) throw new Response(ins.error.message, { status: 400 });
      }
    }

    const { data: quote, error } = await context.supabase
      .from("quotes")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return mapQuote(quote);
  });

/* ------------------------------- Status --------------------------------- */

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "sent", "viewed", "approved", "rejected", "expired"]),
});

export const setQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => statusInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { status: data.status };
    const now = new Date().toISOString();
    if (data.status === "sent") patch.sent_at = now;
    else if (data.status === "viewed") patch.viewed_at = now;
    else if (data.status === "approved") patch.approved_at = now;
    else if (data.status === "rejected") patch.rejected_at = now;
    const { data: row, error } = await context.supabase
      .from("quotes")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return mapQuote(row);
  });

/* ------------------------------- Delete --------------------------------- */

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("quotes")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* ------------------------- Convert to Invoice --------------------------- */

export const convertQuoteToInvoice = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        quoteId: z.string().uuid(),
        dueDate: z.string().datetime().nullish(),
        paymentMethod: z.string().max(40).nullish(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: quote, error } = await context.supabase
      .from("quotes")
      .select("*")
      .eq("company_id", context.tenantId)
      .eq("id", data.quoteId)
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    if (!quote) throw new Response("Quote not found", { status: 404 });

    const total = num(quote.total);
    const { data: invoice, error: invErr } = await context.supabase
      .from("invoices")
      .insert({
        company_id: context.tenantId,
        quote_id: quote.id,
        project_id: quote.project_id,
        status: "issued",
        currency: quote.currency ?? "BRL",
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_document: quote.client_document,
        client_address: quote.client_address,
        subtotal: num(quote.subtotal),
        discount_value: num(quote.discount_value),
        tax_value: num(quote.tax_value),
        shipping_value: num(quote.shipping_value),
        total,
        amount_paid: 0,
        amount_due: total,
        issue_date: new Date().toISOString(),
        due_date: data.dueDate ?? null,
        payment_method: data.paymentMethod ?? null,
        notes: quote.notes,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (invErr) throw new Response(invErr.message, { status: 400 });

    await context.supabase
      .from("quotes")
      .update({ status: "converted", converted_invoice_id: invoice.id })
      .eq("company_id", context.tenantId)
      .eq("id", quote.id);

    return { invoiceId: invoice.id as string };
  });

/* -------------------------------- Stats --------------------------------- */

export const quotesStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotes")
      .select("status,total")
      .eq("company_id", context.tenantId);
    if (error) throw new Response(error.message, { status: 400 });
    const rows = data ?? [];
    const by = (s: string) => rows.filter((r) => r.status === s);
    const sum = (arr: typeof rows) => Number(arr.reduce((a, r) => a + num(r.total), 0).toFixed(2));
    return {
      total: rows.length,
      draft: by("draft").length,
      sent: by("sent").length,
      approved: by("approved").length,
      rejected: by("rejected").length,
      converted: by("converted").length,
      pipelineValue: sum(
        rows.filter((r) => ["draft", "sent", "viewed"].includes(r.status as string)),
      ),
      approvedValue: sum(by("approved")),
    };
  });
