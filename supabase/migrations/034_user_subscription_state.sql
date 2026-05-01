create table user_subscription_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revenuecat_app_user_id text,
  entitlement_identifier text,
  product_identifier text,
  offering_identifier text,
  store text,
  is_active boolean not null default false,
  will_renew boolean not null default false,
  period_type text,
  latest_purchase_at timestamptz,
  expires_at timestamptz,
  unsubscribe_detected_at timestamptz,
  billing_issue_detected_at timestamptz,
  management_url text,
  raw_customer_info jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_subscription_state_active
  on user_subscription_state (is_active, expires_at desc);

alter table user_subscription_state enable row level security;

create policy "Users manage own subscription state"
  on user_subscription_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
