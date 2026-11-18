-- Referência da migração aplicada pelo Supabase. Somente o servidor acessa estas tabelas.
begin;
create table public.carvejani_server_sessions (
 id text primary key check (id ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 payload text not null,
 deadline bigint not null
);
create index carvejani_server_sessions_user on public.carvejani_server_sessions(user_id);
create index carvejani_server_sessions_deadline on public.carvejani_server_sessions(deadline);
create table public.carvejani_server_limits (
 id text primary key,
 hits integer not null,
 deadline bigint not null
);
create index carvejani_server_limits_deadline on public.carvejani_server_limits(deadline);
create table public.carvejani_server_callbacks (
 id text primary key,
 deadline bigint not null
);
create index carvejani_server_callbacks_deadline on public.carvejani_server_callbacks(deadline);
alter table public.carvejani_server_sessions enable row level security;
alter table public.carvejani_server_limits enable row level security;
alter table public.carvejani_server_callbacks enable row level security;
revoke all on public.carvejani_server_sessions, public.carvejani_server_limits, public.carvejani_server_callbacks from public, anon, authenticated;
grant select, insert, update, delete on public.carvejani_server_sessions, public.carvejani_server_limits, public.carvejani_server_callbacks to service_role;

create function public.carvejani_server_rate(p_id text,p_max integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare stamp bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if p_max<1 or p_max>10000 or p_seconds<1 or p_seconds>86400 or length(p_id)<>64 then
  raise exception 'Invalid limit';
 end if;
 delete from public.carvejani_server_limits where deadline<=stamp;
 delete from public.carvejani_server_sessions where deadline<=stamp;
 delete from public.carvejani_server_callbacks where deadline<=stamp;
 insert into public.carvejani_server_limits as current_limit(id,hits,deadline)
 values(p_id,1,stamp+p_seconds::bigint*1000)
 on conflict(id) do update
 set hits=case when current_limit.deadline<=stamp then 1 else current_limit.hits+1 end,
     deadline=case when current_limit.deadline<=stamp then excluded.deadline else current_limit.deadline end
 where current_limit.deadline<=stamp or current_limit.hits<p_max;
 return found;
end;
$$;

create function public.carvejani_server_consume(p_id text,p_deadline bigint)
returns boolean language plpgsql security invoker set search_path='' as $$
declare stamp bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
 if length(p_id)<>64 or p_deadline<=stamp or p_deadline>stamp+86400000 then return false; end if;
 insert into public.carvejani_server_callbacks(id,deadline) values(p_id,p_deadline)
 on conflict(id) do nothing;
 return found;
end;
$$;
revoke all on function public.carvejani_server_rate(text,integer,integer), public.carvejani_server_consume(text,bigint) from public, anon, authenticated;
grant execute on function public.carvejani_server_rate(text,integer,integer), public.carvejani_server_consume(text,bigint) to service_role;
commit;
