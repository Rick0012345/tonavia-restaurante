# Tonavia Restaurante

Sistema web para faturamento de ordens de servico de self-service e controle simples de estoque.

## Funcionalidades

- Ordens de servico por peso, por item avulso ou mistas.
- Fechamento e cancelamento de OS.
- Baixa automatica de estoque para itens vendidos vinculados a produtos.
- Cadastro de produtos, estoque minimo e movimentacoes de entrada, saida e ajuste.
- Dashboard com faturamento do dia, ticket medio, OS recentes e alertas de estoque baixo.

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
