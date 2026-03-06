# PaperSage — Frontend

React + TypeScript frontend for PaperSage. Requires the backend to be running locally.

## Tech Stack

- React 18, TypeScript, Vite
- TailwindCSS, shadcn/ui
- Supabase (auth)

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. Expects the backend at `http://localhost:8000`.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # lint
```

## Notes

- Auth is handled by Supabase — configure your Supabase project credentials in `src/lib/supabase.ts`
- All API calls are in `src/services/api.ts`
- The backend URL is hardcoded to `http://localhost:8000/api/v1` — update this for deployment
