# OPR

Plataforma web para revisão de artigos em eventos acadêmicos, desenvolvida como Trabalho de Conclusão de Curso (TCC).

O organizador cria um evento e escolhe os revisores. Os autores submetem seus artigos e cada revisor envia o arquivo revisado com seus comentários, tudo num só lugar.

## Funcionalidades

- Cadastro e login com JWT
- Perfis de acesso: `admin`, `author`, `publisher` e `reviewer`
- Criação de eventos com período, descrição e observações para os revisores
- Submissão de artigos em um evento
- Atribuição de revisores a eventos e artigos
- Envio da revisão: arquivo revisado e comentários

## Stack

| Parte | Tecnologias |
|---|---|
| `backend-opr` | NestJS, TypeORM, PostgreSQL, JWT, bcrypt, class-validator |
| `frontend-opr` | Next.js, React, Chakra UI, React Hook Form + Yup |

## Como rodar

**Requisitos:** Node.js e um banco PostgreSQL. A conexão usa SSL.

### Back-end

```bash
cd backend-opr
cp .env.example .dev.env   # preencha porta, banco e AUTH_SECRET
yarn install
yarn start:dev
```

A API fica disponível em `http://localhost:<PORT>/api`.

### Front-end

```bash
cd frontend-opr
echo "NEXT_PUBLIC_API_URL=http://localhost:<PORT>/api" > .env.local
yarn install
yarn dev
```

Depois, abra http://localhost:3000.
