-- Preferências de marca (white label) por usuário.
--
-- Como aplicar: no painel do Supabase, abra SQL → New query, cole este arquivo
-- e execute. (Ou use a CLI: `supabase db push` se o projeto estiver ligado ao remote.)
--
-- Se o `insert into storage.buckets` falhar por permissão, crie o bucket manualmente:
-- Storage → New bucket → id: branding-logos → público: sim.

create table if not exists public.user_branding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  primary_color text not null default '#2563eb',
  logo_url text,
  updated_at timestamptz not null default now()
);

comment on table public.user_branding is 'Cores e logotipo personalizados da plataforma por usuário.';

alter table public.user_branding enable row level security;

create policy "user_branding_select_own"
  on public.user_branding
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_branding_insert_own"
  on public.user_branding
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_branding_update_own"
  on public.user_branding
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_branding_delete_own"
  on public.user_branding
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Bucket público para URLs de logo simples (substitua por signed URLs se preferir privado).
insert into storage.buckets (id, name, public)
values ('branding-logos', 'branding-logos', true)
on conflict (id) do update set public = excluded.public;

create policy "branding_logos_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding-logos');

create policy "branding_logos_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'branding-logos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "branding_logos_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'branding-logos'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'branding-logos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "branding_logos_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'branding-logos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
