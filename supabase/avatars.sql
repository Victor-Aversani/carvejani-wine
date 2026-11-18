alter table public.customer_profiles add column avatar_version bigint;
grant update(avatar_version) on public.customer_profiles to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('customer-avatars','customer-avatars',false,262144,array['image/jpeg']);
create policy own_avatar_read on storage.objects for select to authenticated
using(bucket_id='customer-avatars' and name=(select auth.uid())::text||'/avatar.jpg');
create policy own_avatar_insert on storage.objects for insert to authenticated
with check(bucket_id='customer-avatars' and name=(select auth.uid())::text||'/avatar.jpg');
create policy own_avatar_update on storage.objects for update to authenticated
using(bucket_id='customer-avatars' and name=(select auth.uid())::text||'/avatar.jpg')
with check(bucket_id='customer-avatars' and name=(select auth.uid())::text||'/avatar.jpg');
create policy own_avatar_delete on storage.objects for delete to authenticated
using(bucket_id='customer-avatars' and name=(select auth.uid())::text||'/avatar.jpg');
