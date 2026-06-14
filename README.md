# Portfolio Platform

This repository contains a server-first personal platform built with Next.js App Router, TypeScript, MDX, Drizzle, Postgres, and a grounded OpenAI-powered portfolio assistant.

## What it includes

- Typed MDX collections for blog posts, projects, experience, and a canonical profile source
- Server-rendered portfolio pages with JSON-LD, RSS, sitemap, and Open Graph image support
- Dynamic server routes for comments, contact submissions, AI chat, and admin reindexing
- Drizzle schema for comments, contact submissions, chat state, source documents, embeddings, and events
- Retrieval scaffolding for a grounded assistant over the portfolio corpus
- CI-friendly scripts for search-index generation, AI ingestion, and retrieval evals
- Vitest unit/integration tests and Playwright E2E coverage

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in what you need:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

## Useful scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run search:index
npm run ai:ingest
npm run ai:evals
```

## Environment notes

- The site builds without Postgres, Clerk, Resend, or OpenAI configured.
- Dynamic features degrade gracefully until their backing services are configured.
- To enable semantic retrieval, provision Postgres with `pgvector`, set `DATABASE_URL`, and run the AI ingestion flow.
