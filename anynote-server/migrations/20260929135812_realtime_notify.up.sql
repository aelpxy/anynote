create function notify_workspace_change() returns trigger
language plpgsql as $$
begin
  perform pg_notify('workspace_changes', new.workspace_id::text || ':' || new.id::text);
  return new;
end;
$$;

create trigger changes_notify after insert on changes
for each row execute function notify_workspace_change();
