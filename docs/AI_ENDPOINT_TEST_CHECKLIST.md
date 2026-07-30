# Checklist de teste manual — `POST /api/ai/chat`

Rota canônica única da IA. Não existe suíte de testes no projeto e adicionar um
runner (Vitest + mocks de Supabase/fetch) exigiria reestruturação; por isso a
validação é manual e reproduzível pelos comandos abaixo.

Variáveis:

```bash
BASE=http://localhost:8080
TOKEN=<access_token do Supabase (DevTools → Application → localStorage → sb-*-auth-token)>
TENANT=<uuid da empresa ativa>
```

| # | Cenário | Comando | Esperado |
|---|---------|---------|----------|
| 1 | Sem Authorization | `curl -i -X POST $BASE/api/ai/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"oi"}]}'` | `401 {"error":"unauthorized"}` |
| 2 | Token inválido | idem com `-H "Authorization: Bearer abc.def.ghi"` | `401 {"error":"unauthorized"}` |
| 3 | Tenant inválido | token válido + `-H "x-dioris-tenant: 00000000-0000-0000-0000-000000000000"` | `403 {"error":"forbidden_no_tenant"}` |
| 4 | Multi-tenant sem header | usuário com 2+ empresas ativas, sem `x-dioris-tenant` | `403 {"error":"tenant_required"}` |
| 5 | Payload inválido | `-d '{"messages":[]}'` | `400 {"error":"invalid_payload"}` |
| 6 | JSON quebrado | `-d '{'` | `400 {"error":"invalid_json"}` |
| 7 | Corpo acima do limite | `python3 -c "import json;print(json.dumps({'messages':[{'role':'user','content':'x'*300000}]}))" > /tmp/big.json` e `--data-binary @/tmp/big.json` | `413 {"error":"payload_too_large"}` |
| 8 | Saldo insuficiente | zerar créditos da empresa e repetir chamada válida | `402 {"code":"insufficient_credits","balance":..,"need":..}` e **nenhuma** linha nova em `credit_ledger` |
| 9 | Provedor falha | desconfigurar `LOVABLE_API_KEY` (ou simular 5xx upstream) | `503`/`502` + par `consume` **e** `refund` no `credit_ledger` (saldo final inalterado) |
| 10 | Débito falha | negar INSERT em `credit_ledger` (ex.: service key inválida) | `500 {"error":"billing_unavailable"}` e **nenhuma** resposta de IA |
| 11 | Chamada válida | token + tenant + `{"model":"google/gemini-3.6-flash","messages":[{"role":"user","content":"oi"}]}` | `200` com `choices[0].message.content` e **exatamente uma** linha `consume` no ledger |
| 12 | Streaming | igual ao #11 com `"stream": true` | `200` SSE; débito já gravado antes do primeiro byte; uma única linha `consume` |

Conferência do ledger após cada teste:

```sql
select kind, amount, reason, reference, created_at
from credit_ledger
where company_id = '<TENANT>'
order by created_at desc
limit 5;
```

## Comportamento do streaming

O débito ocorre **antes** de abrir o stream. Falhas anteriores ao `2xx` do
provedor (rede, chave ausente, 4xx/5xx upstream) geram estorno `refund`
integral. Uma queda **no meio** do stream não é estornada — o provedor já foi
consumido.