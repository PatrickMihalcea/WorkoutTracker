alter table user_profiles
  add column ai_generation_credits integer not null default 1,
  add column ai_generation_credits_refilled_at timestamptz;

alter table user_profiles
  add constraint user_profiles_ai_generation_credits_nonnegative
  check (ai_generation_credits >= 0);

create or replace function consume_ai_generation_credit(p_is_premium boolean)
returns table (
  allowed boolean,
  remaining_credits integer,
  reason text
)
language plpgsql
security invoker
as $$
declare
  v_user_id uuid;
  v_credits integer;
  v_refilled_at timestamptz;
  v_now timestamptz := now();
  v_current_month timestamptz := date_trunc('month', now());
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select false, 0, 'unauthorized';
    return;
  end if;

  select ai_generation_credits, ai_generation_credits_refilled_at
    into v_credits, v_refilled_at
  from user_profiles
  where id = v_user_id
  for update;

  if not found then
    return query select false, 0, 'profile_not_found';
    return;
  end if;

  if p_is_premium and (
    v_refilled_at is null
    or date_trunc('month', v_refilled_at) < v_current_month
  ) then
    update user_profiles
      set ai_generation_credits = 3,
          ai_generation_credits_refilled_at = v_now
      where id = v_user_id
      returning ai_generation_credits, ai_generation_credits_refilled_at
      into v_credits, v_refilled_at;
  end if;

  if v_credits <= 0 then
    return query select false, v_credits, case when p_is_premium then 'no_credits' else 'premium_required' end;
    return;
  end if;

  update user_profiles
    set ai_generation_credits = ai_generation_credits - 1
    where id = v_user_id
    returning ai_generation_credits
    into v_credits;

  return query select true, v_credits, case when p_is_premium then 'premium' else 'free' end;
end;
$$;
