select * from porton.house_availabilities;
select * from porton.house_availability_types;
select * from porton.houses;
select * from porton.house_types;
select * from porton.tasks;
select * from porton.task_progress_types;
select * from porton.task_types;
select * from porton.profiles;
select * from auth.users;
select * from porton.work_group_houses;
select * from porton.work_groups;
select * from porton.work_group_profiles;
select * from porton.work_group_tasks;

-- VIEW
select * from porton.house_statuses_view;
select * from porton.work_groups_view;

-- LOOK VIEW CODE
-- porton.house_statuses_view
SELECT definition
FROM pg_views
WHERE viewname = 'house_statuses_view';

-- porton.house_statuses_view
SELECT definition
FROM pg_views
WHERE viewname = 'work_groups_view';

-- columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'house_availabilities';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'tasks';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'work_groups';


SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'work_group_profiles';


SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'work_group_tasks';


SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'profiles';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'porton' AND
table_name = 'houses';





-- indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'house_availabilities';

-- triggers
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'house_availabilities';
