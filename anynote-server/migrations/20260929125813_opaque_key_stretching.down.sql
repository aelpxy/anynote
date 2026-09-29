alter table users rename column key_stretching to kdf_params;
alter table users add column kdf_salt bytea not null default '\x00000000000000000000000000000000' check (octet_length(kdf_salt) = 16);
alter table users alter column kdf_salt drop default;
