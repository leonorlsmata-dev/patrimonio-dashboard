# Fase 2 - Design: Transações, Crypto, Multi-moeda, Timeline

**Data:** 2026-03-08
**Estado:** Aprovado

## Resumo

Quatro melhorias ao dashboard de património:
1. Registo individual de transações ETF com cálculos automáticos
2. Suporte a crypto com preços via CoinGecko
3. Multi-moeda (EUR/USD) com conversão automática
4. Timeline global de transações + histórico por posição

---

## 1. Transações ETF

### Comportamento atual
- ETF adicionado como posição única com shares, preço médio e total investido manuais
- Sem histórico de compras individuais

### Novo comportamento
- Botão "Registar Compra" substitui "Adicionar ETF"
- Cada compra mensal é uma transação separada (ticker, shares, preço por share, fees, data)
- Se o ticker é novo, cria a posição automaticamente; se já existe, atualiza
- Cálculos automáticos a cada transação:
  - Total shares = soma compras - soma vendas
  - Preço médio = média ponderada de todas as compras
  - Total investido = soma de (shares × preço) + fees
- Suporte a vendas (buy/sell)
- Botão "Ver Histórico" no card de cada ETF

### P&L por ETF
- **Card:** valor atual vs investido, ganho/perda € e %, badge verde/vermelho
- **Vista detalhada:** preço médio vs preço atual, P&L por transação individual
- **Overview e Dashboard:** conta para totais globais

### Base de dados
- Tabela `etf_transactions` já existe com campos: type, shares, price_per_share, total_amount, fees, transaction_date
- Ligar à UI e adicionar lógica de recálculo da posição

---

## 2. Crypto

### Estrutura
Espelho do sistema ETF, adaptado para crypto.

### Novas tabelas
- `crypto_positions` - ticker (BTC, ETH...), name, shares, avg_buy_price, total_invested, current_price, current_value, currency
- `crypto_transactions` - tipo buy/sell, shares, preço, fees, data (FK para posição)

### Preços automáticos
- API: CoinGecko (gratuita, sem API key, 30 req/min)
- Nova rota: `/api/crypto/quote?id=bitcoin`
- Auto-fetch no form ao selecionar a moeda
- Cron das 18h atualiza preços crypto também

### UI
- Nova página `/investimentos/crypto` com cards (padrão ETF)
- Form "Registar Compra Crypto": moeda (dropdown com search), quantidade, preço, fees, data
- P&L por posição (mesmo padrão ETFs)
- Nova entrada na sidebar
- Categoria `crypto` no `ASSET_CATEGORIES`

### P&L Crypto
- Card: valor atual vs investido, ganho/perda € e %, badge verde/vermelho
- Vista detalhada: preço médio vs preço atual, P&L por transação
- Overview e Dashboard: conta para totais globais

---

## 3. Multi-moeda

### Princípio
Cada posição guarda moeda original. Totais sempre convertidos para EUR.

### Conversão de câmbio
- API: exchangerate-api.com (1500 req/mês grátis)
- Taxa EUR/USD atualizada diariamente pelo cron das 18h
- Tabela `exchange_rates` (from_currency, to_currency, rate, date)
- Fallback: última taxa guardada se API falhar

### UI
- Card em USD: mostra valor original ($) + valor convertido (€) em texto pequeno
- Card em EUR: mostra só €
- Crypto: mesma lógica (maioria cotada em USD)
- Totais (dashboard, pie chart, overview): tudo somado em EUR
- Form: campo "Moeda" dropdown (EUR, USD, GBP) preenchido automaticamente pela API de preços

### P&L multi-moeda
- Ganho/perda calculado na moeda original (performance real do ativo)
- Total EUR reflete efeito cambial

---

## 4. Timeline de Transações

### Nova página `/transacoes`
- Lista de todas as transações (ETFs + crypto) ordenadas por data (recentes primeiro)
- Cada linha: data, tipo (compra/venda), ativo (ticker + nome), quantidade, preço, valor total, fees
- Badge com cor da categoria

### Filtros
- Mês/ano (dropdown)
- Tipo de ativo (ETF, Crypto, Todos)
- Tipo de transação (compra/venda)

### Resumo mensal no topo
- Total investido nesse mês
- Número de transações
- Breakdown por categoria

### Dentro de cada posição
- Botão "Ver Histórico" abre lista de transações do ativo
- P&L individual por transação (preço compra vs preço atual)

### Sidebar
- Novo item "Transações" com ícone ArrowLeftRight

---

## Impacto técnico

### Novas tabelas DB
- `crypto_positions`
- `crypto_transactions`
- `exchange_rates`

### Tabelas existentes a usar
- `etf_transactions` (já existe, ligar à UI)
- `etf_positions` (campo currency já existe)

### Novos ficheiros
- `/src/app/investimentos/crypto/page.tsx`
- `/src/app/transacoes/page.tsx`
- `/src/app/api/crypto/quote/route.ts`
- `/src/app/api/exchange-rate/route.ts`
- `/src/components/investments/crypto-card.tsx`
- `/src/components/investments/crypto-form.tsx`
- `/src/components/investments/transaction-form.tsx`
- `/src/components/investments/transaction-history.tsx`

### Ficheiros a modificar
- `constants.ts` - nova categoria crypto
- `investment.ts` - novos types
- `supabase/types.ts` - novas tabelas
- ETF form/card/page - transações em vez de posição direta
- Dashboard components - incluir crypto
- Cron route - crypto prices + exchange rates
- Sidebar/nav - novos itens
