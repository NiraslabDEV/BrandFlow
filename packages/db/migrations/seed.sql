-- Seed data for BrandFlow
-- DECISÃO: 1 tenant demo para testes
-- DECISÃO: platform_settings já criado no migration (singleton)

-- Demo tenant (trial)
-- Nota: Este seed será executado via supabase db reset
-- O user_id deve ser substituído pelo ID real do usuário criado

-- Criar tenant demo
insert into tenants (name, slug, plan, status, trial_ends_at)
values (
  'Restaurante Demo',
  'restaurante-demo',
  'base',
  'trial',
  now() + interval '14 days'
);

-- Nota: As memberships, restaurants e credit_wallets serão criados
-- quando o usuário se registrar via create_tenant RPC
-- O seed aqui é apenas para ter um tenant base para testes