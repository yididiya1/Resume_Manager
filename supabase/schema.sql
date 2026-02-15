-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Resume',
  resume_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resumes enable row level security;

create policy "Resumes are selectable by owner"
on public.resumes for select
using (auth.uid() = user_id);

create policy "Resumes are insertable by owner"
on public.resumes for insert
with check (auth.uid() = user_id);

create policy "Resumes are updatable by owner"
on public.resumes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Resumes are deletable by owner"
on public.resumes for delete
using (auth.uid() = user_id);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  item_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items enable row level security;

create policy "Content items are selectable by owner"
on public.content_items for select
using (auth.uid() = user_id);

create policy "Content items are insertable by owner"
on public.content_items for insert
with check (auth.uid() = user_id);

create policy "Content items are updatable by owner"
on public.content_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Content items are deletable by owner"
on public.content_items for delete
using (auth.uid() = user_id);
