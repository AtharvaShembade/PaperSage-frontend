# PaperSage — Frontend

React frontend for PaperSage, an agentic RAG research assistant for academics.

## Live App

https://papersage-research.vercel.app

## Tech Stack

- React 18, TypeScript, Vite
- TailwindCSS, shadcn/ui
- Supabase (auth)

## Local Development

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the root:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

For production, set `VITE_API_BASE_URL` to the deployed backend URL in Vercel environment settings.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # lint
```
