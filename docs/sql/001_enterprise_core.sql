-- Bitey Enterprise core persistence schema
-- UNAPPLIED MIGRATION: do not execute against any existing database until the
-- Enterprise persistence target is explicitly assigned.

create table if not exists companies (
  id uuid primary key,
  name text not null,
  website text,
  location text,
  description text,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_members (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists assistants (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  tone text,
  language text,
  greeting text,
  instructions text,
  lifecycle_state text not null default 'DRAFT'
    check (lifecycle_state in ('DRAFT','CONFIGURING','TESTING','READY','ACTIVE','NEEDS_REVIEW')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists knowledge_sources (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  assistant_id uuid references assistants(id) on delete cascade,
  source_type text not null check (source_type in ('url','pdf','docx','txt','csv','faq','manual','catalog','policy')),
  title text,
  source_uri text,
  status text not null default 'pending' check (status in ('pending','processing','ready','failed','disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists channel_identities (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  assistant_id uuid not null references assistants(id) on delete cascade,
  channel text not null check (channel in ('web','telegram','whatsapp')),
  external_identity text,
  status text not null default 'disabled' check (status in ('disabled','configured','testing','active','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assistant_id, channel)
);

create table if not exists customers (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  external_identity text,
  display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, external_identity)
);

create table if not exists conversations (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  assistant_id uuid not null references assistants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  channel_identity_id uuid references channel_identities(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed','escalated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists readiness_checks (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  assistant_id uuid not null references assistants(id) on delete cascade,
  check_key text not null,
  passed boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  unique (assistant_id, check_key)
);

create table if not exists entitlements (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  tier text not null default 'starter' check (tier in ('starter','business','enterprise')),
  features jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

create index if not exists idx_company_members_user on company_members(user_id);
create index if not exists idx_assistants_company on assistants(company_id);
create index if not exists idx_knowledge_company on knowledge_sources(company_id);
create index if not exists idx_knowledge_assistant on knowledge_sources(assistant_id);
create index if not exists idx_channels_company on channel_identities(company_id);
create index if not exists idx_channels_assistant on channel_identities(assistant_id);
create index if not exists idx_customers_company on customers(company_id);
create index if not exists idx_conversations_company on conversations(company_id);
create index if not exists idx_conversations_customer on conversations(customer_id);
create index if not exists idx_readiness_company on readiness_checks(company_id);

-- Security requirement for a Supabase/Postgres deployment:
-- enable RLS on every tenant-owned table and derive the tenant from the
-- authenticated user's membership. The browser must never supply company_id
-- as an authorization boundary. Policies are intentionally not applied here
-- because the destination database has not been selected.