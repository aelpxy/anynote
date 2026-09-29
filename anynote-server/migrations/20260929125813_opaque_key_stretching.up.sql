alter table users drop column kdf_salt;
alter table users rename column kdf_params to key_stretching;
