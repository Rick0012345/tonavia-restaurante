# Tonavia Restaurante

Sistema web para faturamento de vendas de self-service e controle simples de estoque.

## Funcionalidades

- Venda de self-service por peso, item avulso ou cobranca mista.
- Fechamento e cancelamento de vendas no caixa.
- Baixa automatica de estoque para itens vendidos vinculados a produtos.
- Cadastro de produtos, estoque minimo e movimentacoes de entrada, saida e ajuste.
- Dashboard com filtro por intervalo, faturamento por dia, ticket medio, canais de venda e alertas de estoque baixo.
- Classificacao de vendas por canal: no local, delivery e retirada.

## Rodando localmente

```bash
npm install
copy .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`.

## Rodando com Docker

```bash
docker compose up --build
```

O Compose sobe PostgreSQL e aplicacao web. No primeiro start, executa `prisma db push` e o seed inicial.

## Scripts

- `npm run dev`: inicia o Next.js em desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run lint`: roda ESLint.
- `npm run db:push`: aplica o schema Prisma no banco.
- `npm run db:seed`: cria categorias e produtos iniciais.
