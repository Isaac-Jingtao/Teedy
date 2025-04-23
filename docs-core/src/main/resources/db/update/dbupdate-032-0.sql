-- DBUPDATE-032-0.SQL

-- Insert the default storage quota configuration
insert into T_CONFIG(CFG_ID_C, CFG_VALUE_C) values('QUOTA_DEFAULT', '10000000');

-- Update the database version
update T_CONFIG set CFG_VALUE_C = '32' where CFG_ID_C = 'DB_VERSION'; 