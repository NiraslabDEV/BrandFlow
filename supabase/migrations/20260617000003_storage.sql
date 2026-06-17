-- Migration 0002: Storage bucket para assets de marca dos restaurantes
-- DECISÃO: bucket privado com RLS por tenant (logo, fotos, cores)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  false,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Tenant vê só os seus assets (pasta = tenant_id/)
create policy "brand_assets_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.tenants
      where id in (select public.auth_tenant_ids())
    )
  );

create policy "brand_assets_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.tenants
      where id in (select public.auth_tenant_ids())
    )
  );

create policy "brand_assets_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.tenants
      where id in (select public.auth_tenant_ids())
    )
  );

create policy "brand_assets_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.tenants
      where id in (select public.auth_tenant_ids())
    )
  );
