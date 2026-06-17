-- Migration 0002: Integrações — RPC get_public_tracking() + Vault encryption
-- DECISÃO: Segredos (B) cifrados via Supabase Vault (1.2.7)
-- DECISÃO: get_public_tracking() só devolve IDs públicos (A), NUNCA segredos (B)
-- DECISÃO: Colunas explícitas, nunca select *

-- ============================================================================
-- RPC: get_public_tracking()
-- Devolve só IDs públicos (A) — anon, SECURITY DEFINER
-- NUNCA devolve segredos (B)
-- ============================================================================
create or replace function public.get_public_tracking()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'gtm_container_id', coalesce(gtm_container_id, ''),
    'meta_pixel_id', coalesce(meta_pixel_id, ''),
    'ga4_measurement_id', coalesce(ga4_measurement_id, ''),
    'gads_conversion_id', coalesce(gads_conversion_id, ''),
    'gads_conversion_label', coalesce(gads_conversion_label, '')
  )
  from platform_settings
  where id = 1;
$$;

grant execute on function public.get_public_tracking() to anon;
grant execute on function public.get_public_tracking() to authenticated;

-- ============================================================================
-- Funções auxiliares para Vault encryption (Supabase Vault)
-- ============================================================================
create or replace function public.vault_encrypt(p_value text, p_secret_id text)
returns text language plpgsql security definer set search_path = public as $$
begin
  -- DECISÃO: Usa Supabase Vault para cifrar segredos
  -- A chave master do Vault é gerida pela Supabase, não pela aplicação
  return pgsodium.encrypt(p_value, p_secret_id);
end;
$$;

create or replace function public.vault_decrypt(p_encrypted text, p_secret_id text)
returns text language plpgsql security definer set search_path = public as $$
begin
  return pgsodium.decrypt(p_encrypted, p_secret_id);
end;
$$;