Resume Manager (MVP)

Next.js (App Router) app for:
- Resume Builder: two-pane editor + live PDF preview
- Resume Adjuster: paste job description, select a resume, and create an adjusted copy (AI actions stubbed for now)
- Content Library: placeholder page (to be implemented next)

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Supabase

1. Create a Supabase project
2. In Supabase Dashboard:
	- Authentication → Providers → enable Google
	- Authentication → URL Configuration
	  - Set Site URL to `http://localhost:3000`
	  - Add Redirect URL: `http://localhost:3000/auth/callback`
3. Create `.env.local` and copy values from `.env.example`:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor

### 3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Adjuster AI setup

### OpenAI env vars

Add to `.env.local`:

- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional; defaults to `gpt-4o-mini`)

### Prompt templates (editable)

Demo prompts live in:

- [src/lib/ai/prompts/adjustResume.ts](src/lib/ai/prompts/adjustResume.ts)
- [src/lib/ai/prompts/optimizeResume.ts](src/lib/ai/prompts/optimizeResume.ts)
- [src/lib/ai/prompts/addProjects.ts](src/lib/ai/prompts/addProjects.ts)

You can edit these directly to refine prompt engineering.

## What’s implemented

- Landing page at `/`
- Google sign-in at `/login`
- Dashboard at `/app`: list/create/delete resumes
- Builder at `/builder/[id]`: edit resume sections and see a live PDF preview
	- Rich text supports: bold, italic, links, bullet lists
	- The same formatting is rendered in the PDF preview
- Adjuster at `/adjuster`: job description field + resume selection + action buttons (AI actions are placeholders)

## Notes

- PDF preview uses `@react-pdf/renderer`.
- Rich text editing uses Tiptap (ProseMirror JSON) and is rendered into the PDF with a small custom renderer.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
