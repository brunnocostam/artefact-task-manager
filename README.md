# Task Manager

Simple task manager built with Next.js 15 (App Router) and tRPC. Tasks are kept in memory on the server, so they reset when the server restarts. All sample data is fictitious.

## Running

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app starts with 25 sample tasks so the infinite scroll has something to load.

## Scripts

- `npm run dev`: development server
- `npm run build` and `npm start`: production build
- `npm test`: router tests (Jest)
- `npm run lint` and `npm run typecheck`: ESLint and TypeScript checks

## Stack

- Next.js 15 (pinned to 15.x since the challenge asks for v15)
- tRPC v11 with the TanStack React Query integration
- Zod for input validation
- superjson, so `createdAt` arrives on the client as a `Date`
- Tailwind CSS

## How it works

- `src/server`: in-memory store and the tRPC router (`task.list`, `byId`, `create`, `update`, `delete`), exposed at `/api/trpc`.
- The list page (`src/app/page.tsx`) uses SSR: it calls the router directly on the server, prefetches the first page and the client hydrates from it.
- Create and edit share one form component. The title is validated on the client for quick feedback and again on the server with Zod.
- Missing tasks return `NOT_FOUND`, invalid input returns `BAD_REQUEST` with the field message. `update` is a full update: title and description are both replaced.
- Dates are shown in UTC so the server render and the browser hydration produce the same text.
- Tests call the router through `createCaller`, covering validation, `NOT_FOUND` errors and pagination.
- Infinite scroll uses cursor pagination (cursor = `createdAt` of the last item) with `useInfiniteQuery` and an `IntersectionObserver`. A cursor is used instead of an offset so deleting tasks while scrolling doesn't skip items.

Field names are in English: `titulo` is `title`, `descricao` is `description` and `dataCriacao` is `createdAt`.

## Limitations

No database and no auth. In-memory state also only works with a single server instance; a real deployment would need a database.
