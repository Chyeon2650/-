-- Run in Supabase SQL Editor after schema.sql. Read-only assertions.
do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if not has_column_privilege(role_name, 'public.memos', 'title', 'SELECT')
       or not has_column_privilege(role_name, 'public.memos', 'content', 'SELECT')
       or not has_column_privilege(role_name, 'public.memos', 'id', 'SELECT')
       or not has_column_privilege(role_name, 'public.memos', 'created_at', 'SELECT') then
      raise exception '% cannot read public memo fields', role_name;
    end if;
    if has_column_privilege(role_name, 'public.memos', 'password_hash', 'SELECT')
       or has_any_column_privilege(role_name, 'public.memos', 'INSERT')
       or has_any_column_privilege(role_name, 'public.memos', 'UPDATE')
       or has_table_privilege(role_name, 'public.memos', 'DELETE')
       or has_table_privilege(role_name, 'public.memos', 'TRUNCATE') then
      raise exception '% has excessive memo privileges', role_name;
    end if;
  end loop;
  if not (select relrowsecurity from pg_class where oid = 'public.memos'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
  if not has_table_privilege('service_role', 'public.memos', 'SELECT')
     or not has_table_privilege('service_role', 'public.memos', 'INSERT')
     or not has_table_privilege('service_role', 'public.memos', 'DELETE') then
    raise exception 'Server role is missing required privileges';
  end if;
end $$;
