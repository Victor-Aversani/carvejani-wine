create table public.customer_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(char_length(full_name) between 2 and 100)
);
alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from anon, authenticated;
grant select on public.customer_profiles to authenticated;
grant update(full_name) on public.customer_profiles to authenticated;
create policy own_profile_read on public.customer_profiles for select to authenticated using ((select auth.uid())=id);
create policy own_profile_update on public.customer_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create function public.carvejani_new_customer() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.customer_profiles(id,full_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Cliente'),100));
 return new;
end; $$;
revoke all on function public.carvejani_new_customer() from public, anon, authenticated;
create trigger carvejani_create_profile after insert on auth.users for each row execute function public.carvejani_new_customer();
