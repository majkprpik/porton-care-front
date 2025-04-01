DELETE FROM porton.house_availabilities;
DELETE FROM porton.work_group_tasks;
DELETE FROM porton.work_group_profiles;
DELETE FROM porton.house_availability_types;
DELETE FROM porton.tasks;
DELETE FROM porton.task_progress_types;
DELETE FROM porton.task_types;
DELETE FROM porton.houses;
DELETE FROM porton.house_types;


-- Insert House Types
INSERT INTO porton.house_types (house_type_name) VALUES
('family 1'),
('family 2'),
('couple'),
('mobilne');

-- Insert Couple Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(641, '641', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(642, '642', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(643, '643', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(644, '644', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(645, '645', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(646, '646', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(647, '647', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(648, '648', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(649, '649', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple')),
(650, '650', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'couple'));

-- Insert Family1 Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(205, '205', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(206, '206', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(301, '301', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(418, '418', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(514, '514', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(515, '515', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(516, '516', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(517, '517', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(518, '518', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(519, '519', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(520, '520', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(521, '521', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(522, '522', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1')),
(523, '523', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 1'));

-- Insert Family2 Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(201, '201', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(202, '202', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(203, '203', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(204, '204', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(401, '401', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(402, '402', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(403, '403', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(404, '404', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(405, '405', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(406, '406', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(407, '407', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(408, '408', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(409, '409', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(410, '410', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(411, '411', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(412, '412', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(413, '413', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(414, '414', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(415, '415', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(416, '416', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2')),
(417, '417', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'family 2'));

-- Insert Mobilne Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(630, '630', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'mobilne')),
(631, '631', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'mobilne')),
(632, '632', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'mobilne')),
(638, '638', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'mobilne')),
(157, '157', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'mobilne'));


INSERT INTO porton.house_availability_types (house_availability_type_name) 
VALUES 
('Occupied'),
('Free');

DO $$ 
DECLARE 
    house_rec RECORD;
    start_date TIMESTAMP;
    end_date TIMESTAMP;
    occupation_days INT;
    free_days INT;
    occupied_type_id INT;
    free_type_id INT;
BEGIN
    -- Get the 'Occupied' and 'Free' type IDs
    SELECT house_availability_type_id INTO occupied_type_id 
    FROM porton.house_availability_types 
    WHERE house_availability_type_name = 'Occupied';

    SELECT house_availability_type_id INTO free_type_id 
    FROM porton.house_availability_types 
    WHERE house_availability_type_name = 'Free';

    -- 🚨 Ensure we have valid type IDs
    IF occupied_type_id IS NULL OR free_type_id IS NULL THEN
        RAISE EXCEPTION 'Error: One or both house_availability_type_id values are NULL (Occupied: %, Free: %)', occupied_type_id, free_type_id;
    END IF;

    -- Loop through all houses
    FOR house_rec IN (SELECT house_id FROM porton.houses) LOOP
        -- Set initial start date to January 1st of this year
        start_date := DATE_TRUNC('year', NOW());

        -- Generate availabilities for the whole year
        WHILE start_date < DATE_TRUNC('year', NOW()) + INTERVAL '1 year' LOOP
            -- 🎯 Generate realistic stay durations
            occupation_days := 
                CASE 
                    WHEN RANDOM() < 0.3 THEN FLOOR(RANDOM() * 2) + 1  -- 30% → 1-2 days
                    WHEN RANDOM() < 0.7 THEN FLOOR(RANDOM() * 4) + 3  -- 40% → 3-6 days
                    ELSE FLOOR(RANDOM() * 7) + 7  -- 30% → 7-13 days
                END;

            -- Ensure `end_date` is **always** after `start_date`
            end_date := start_date + (occupation_days || ' days')::INTERVAL;

            -- ✅ Insert Occupied period
            INSERT INTO porton.house_availabilities 
            (house_id, house_availability_type_id, house_availability_start_date, house_availability_end_date)
            VALUES 
            (house_rec.house_id, occupied_type_id, start_date, end_date);

            -- 🚨 Ensure at least **1 full free day before the next reservation**
            free_days := FLOOR(RANDOM() * 5) + 1; -- 1 to 5 days

            -- ✅ Insert Free period
            INSERT INTO porton.house_availabilities 
            (house_id, house_availability_type_id, house_availability_start_date, house_availability_end_date)
            VALUES 
            (house_rec.house_id, free_type_id, end_date + INTERVAL '1 day', end_date + (free_days || ' days')::INTERVAL);

            -- 🚨 Ensure the **next occupation starts AFTER the free period**
            start_date := end_date + (free_days + 1 || ' days')::INTERVAL;
        END LOOP;
    END LOOP;
END $$;




INSERT INTO porton.task_types (task_type_name) 
VALUES 
('Punjenje'),
('Čišćenje kućice'),
('Čišćenje terase'),
('Popravak'),
('Mijenjanje posteljine'),
('Mijenjanje ručnika');

INSERT INTO porton.task_progress_types (task_progress_type_name) 
VALUES 
('Nije dodijeljeno'), -- Initial state when the task just exists
('Dodijeljeno'),      -- Assigned to someone
('U progresu'),       -- Task is in progress
('Završeno');         -- Task is completed


DO $$ 
DECLARE task_status_id INT;
DECLARE today DATE := CURRENT_DATE;
DECLARE yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Get the task progress type ID for "Nije dodijeljeno"
    SELECT task_progress_type_id INTO task_status_id 
    FROM porton.task_progress_types 
    WHERE task_progress_type_name = 'Nije dodijeljeno';

    -- 1️⃣ Assign "Čišćenje kućice" for checkouts (ended yesterday)
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT DISTINCT ON (ha.house_id)
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje kućice'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE DATE(ha.house_availability_end_date) = yesterday
    AND NOT EXISTS (
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje kućice')
        AND DATE(t.start_time) = today
    );

    -- 1️⃣.1 Assign "Čišćenje terase" for checkouts (ended yesterday)
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT DISTINCT ON (ha.house_id)
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje terase'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE DATE(ha.house_availability_end_date) = yesterday
    AND NOT EXISTS (
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje terase')
        AND DATE(t.start_time) = today
    );

    -- 1️⃣.2 Assign "Čišćenje terase" for check-ins where last checkout was more than 3 days ago
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT DISTINCT ON (new_arrival.house_id)
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje terase'),
        task_status_id, 
        new_arrival.house_id, 
        NOW()
    FROM porton.house_availabilities new_arrival
    WHERE DATE(new_arrival.house_availability_start_date) = today
    AND (
        -- Get the last checkout date for this house
        SELECT MAX(DATE(last_checkout.house_availability_end_date))
        FROM porton.house_availabilities last_checkout
        WHERE last_checkout.house_id = new_arrival.house_id
        AND DATE(last_checkout.house_availability_end_date) < today
    ) <= today - INTERVAL '3 days'
    AND NOT EXISTS (
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = new_arrival.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje terase')
        AND DATE(t.start_time) = today
    );

    -- 2️⃣ Assign "Mijenjanje ručnika" for houses occupied more than 2 days but not their last day
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT DISTINCT ON (ha.house_id)
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje ručnika'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE DATE(ha.house_availability_start_date) <= today - INTERVAL '2 days'
    AND DATE(ha.house_availability_end_date) > today
    AND NOT EXISTS (
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje ručnika')
        AND DATE(t.start_time) = today
    );

    -- 3️⃣ Assign "Mijenjanje posteljine" for houses occupied more than 4 days but not their last day
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT DISTINCT ON (ha.house_id)
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje posteljine'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE DATE(ha.house_availability_start_date) <= today - INTERVAL '4 days'
    AND DATE(ha.house_availability_end_date) > today
    AND NOT EXISTS (
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje posteljine')
        AND DATE(t.start_time) = today
    );
END $$;

-- ovo je portrebno ako izbaci gresku code:"PGRST106", message : "The schema must be one of the following: public, graphql_public"
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, graphql_public, porton';
NOTIFY pgrst;

-- GRANT SELECT ON TABLE porton.task_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.task_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.task_progress_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.task_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.house_availability_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.house_availabilities TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.houses TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE porton.house_types TO authenticated, anon;


-- ALTER TABLE porton.work_group_profiles 
-- DROP CONSTRAINT work_group_profiles_work_group_id_fkey,
-- ADD CONSTRAINT work_group_profiles_work_group_id_fkey
-- FOREIGN KEY (work_group_id)
-- REFERENCES porton.work_groups(work_group_id)
-- ON DELETE CASCADE;

-- ALTER TABLE porton.work_group_houses 
-- DROP CONSTRAINT work_group_houses_work_group_id_fkey,
-- ADD CONSTRAINT work_group_houses_work_group_id_fkey
-- FOREIGN KEY (work_group_id)
-- REFERENCES porton.work_groups(work_group_id)
-- ON DELETE CASCADE;

-- ALTER TABLE porton.work_group_tasks
-- DROP CONSTRAINT work_group_tasks_work_group_id_fkey,
-- ADD CONSTRAINT work_group_tasks_work_group_id_fkey
-- FOREIGN KEY (work_group_id)
-- REFERENCES porton.work_groups(work_group_id)
-- ON DELETE CASCADE;



-- grant usage on schema "porton" to anon;
-- grant usage on schema "porton" to authenticated;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "porton" TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "porton" TO anon;


-- GRANT USAGE ON SCHEMA "porton" TO anon, authenticated, service_role;
-- GRANT ALL ON ALL TABLES IN SCHEMA "porton" TO anon, authenticated, service_role;
-- GRANT ALL ON ALL ROUTINES IN SCHEMA "porton" TO anon, authenticated, service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA "porton" TO anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "porton" GRANT ALL ON TABLES TO anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "porton" GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "porton" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;