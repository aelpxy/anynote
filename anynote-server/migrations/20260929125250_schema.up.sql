create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  opaque_record bytea not null,
  kdf_salt bytea not null check (octet_length(kdf_salt) = 16),
  kdf_params jsonb not null,
  public_key bytea not null check (octet_length(public_key) = 32),
  encrypted_private_key bytea not null,
  created_at timestamptz not null default now()
);

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users on delete cascade,
  opaque_server_state bytea not null,
  expires_at timestamptz not null
);

create index login_attempts_expires_at_idx on login_attempts (expires_at);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users on delete cascade,
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  encrypted_name bytea not null,
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces on delete cascade,
  user_id uuid not null references users on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  encrypted_workspace_key bytea not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on workspace_members (user_id);

create table notes (
  id uuid primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  encrypted_data bytea not null,
  version integer not null default 1 check (version > 0),
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create index notes_workspace_id_idx on notes (workspace_id);
create index notes_trashed_at_idx on notes (trashed_at) where trashed_at is not null;

create trigger notes_set_updated_at before update on notes
for each row execute function set_updated_at();

create table collections (
  id uuid primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  parent_id uuid,
  encrypted_name bytea not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  check (parent_id <> id),
  foreign key (workspace_id, parent_id) references collections (workspace_id, id) on delete cascade
);

create index collections_workspace_id_idx on collections (workspace_id);
create index collections_parent_id_idx on collections (parent_id);

create trigger collections_set_updated_at before update on collections
for each row execute function set_updated_at();

create table collection_notes (
  workspace_id uuid not null,
  collection_id uuid not null,
  note_id uuid not null,
  position integer not null default 0,
  primary key (collection_id, note_id),
  foreign key (workspace_id, collection_id) references collections (workspace_id, id) on delete cascade,
  foreign key (workspace_id, note_id) references notes (workspace_id, id) on delete cascade
);

create index collection_notes_note_id_idx on collection_notes (note_id);

create table attachments (
  id uuid primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  size bigint not null check (size > 0),
  created_at timestamptz not null default now()
);

create index attachments_workspace_id_idx on attachments (workspace_id);

create table changes (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  entity text not null check (entity in ('workspace', 'note', 'collection', 'attachment')),
  entity_id uuid not null,
  operation text not null check (operation in ('upsert', 'delete')),
  created_at timestamptz not null default now()
);

create index changes_workspace_id_id_idx on changes (workspace_id, id);
