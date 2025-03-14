-- Delete existing data
DELETE FROM porton.house_availabilities;
DELETE FROM porton.house_availability_types;
DELETE FROM porton.tasks;
DELETE FROM porton.task_types;
DELETE FROM porton.task_progress_types;
DELETE FROM porton.houses;
DELETE FROM porton.house_types;

-- Insert House Types
INSERT INTO porton.house_types (house_type_name) VALUES
('Family1'),
('Family2'),
('Couple'),
('Test');

-- Insert Couple Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(641, '641', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(642, '642', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(643, '643', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(644, '644', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(645, '645', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(646, '646', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(647, '647', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(648, '648', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(649, '649', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple')),
(650, '650', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Couple'));

-- Insert Family1 Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(205, '205', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(206, '206', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(301, '301', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(418, '418', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(514, '514', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(515, '515', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(516, '516', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(517, '517', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(518, '518', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(519, '519', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(520, '520', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(521, '521', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(522, '522', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1')),
(523, '523', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family1'));

-- Insert Family2 Houses with house_name
INSERT INTO porton.houses (house_number, house_name, house_type_id) 
VALUES 
(201, '201', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(202, '202', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(203, '203', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(204, '204', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(401, '401', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(402, '402', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(403, '403', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(404, '404', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(405, '405', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(406, '406', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(407, '407', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(408, '408', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(409, '409', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(410, '410', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(411, '411', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(412, '412', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(413, '413', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(414, '414', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(415, '415', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(416, '416', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2')),
(417, '417', (SELECT house_type_id FROM porton.house_types WHERE house_type_name = 'Family2'));


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
                    WHEN RANDOM() < 0.3 THEN FLOOR(RANDOM() * 2) + 1  -- 30% → 1-2 days (rare)
                    WHEN RANDOM() < 0.7 THEN FLOOR(RANDOM() * 4) + 3  -- 40% → 3-6 days (common)
                    ELSE FLOOR(RANDOM() * 7) + 7  -- 30% → 7-13 days (less frequent)
                END;

            -- 🚨 Ensure `end_date` is **always** after `start_date`
            end_date := start_date + (occupation_days || ' days')::INTERVAL;

            -- ✅ Insert Occupied period
            INSERT INTO porton.house_availabilities 
            (house_id, house_availability_type_id, house_availability_start_date, house_availability_end_date)
            VALUES 
            (house_rec.house_id, occupied_type_id, start_date, end_date);

            -- 🎯 Generate random free period (1-5 days)
            free_days := FLOOR(RANDOM() * 5) + 1; -- Always at least 1 day free

            -- ✅ Insert Free period (to ensure a gap)
            INSERT INTO porton.house_availabilities 
            (house_id, house_availability_type_id, house_availability_start_date, house_availability_end_date)
            VALUES 
            (house_rec.house_id, free_type_id, end_date, end_date + (free_days || ' days')::INTERVAL);

            -- 🚨 Ensure the **next occupation starts AFTER the free period**
            start_date := end_date + (free_days || ' days')::INTERVAL;
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

    -- 1️⃣ Assign "Punjenje", "Čišćenje kućice", "Čišćenje terase" 
    -- If guests left TODAY (meaning they stayed until YESTERDAY) OR new guests are arriving today
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        tt.task_type_id, 
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    CROSS JOIN porton.task_types tt
    WHERE (
        ha.house_availability_end_date::DATE = yesterday  -- Left today (stayed until yesterday)
        OR ha.house_availability_start_date::DATE = today -- Arriving today
    )
    AND tt.task_type_name IN ('Punjenje', 'Čišćenje kućice', 'Čišćenje terase')
    AND NOT EXISTS (  -- Prevent duplicate tasks
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = tt.task_type_id
        AND t.start_time::DATE = today
    );

    -- 2️⃣ Assign "Mijenjanje ručnika" for houses occupied **more than 2 days** 
    -- but **not their last day**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje ručnika'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE ha.house_availability_start_date <= today - INTERVAL '2 days' -- Occupied for more than 2 days
    AND ha.house_availability_end_date > today  -- Not their last day
    AND NOT EXISTS (  -- Prevent duplicate tasks
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje ručnika')
        AND t.start_time::DATE = today
    );

    -- 3️⃣ Assign "Mijenjanje posteljine" for houses occupied **more than 4 days** 
    -- but **not their last day**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje posteljine'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE ha.house_availability_start_date <= today - INTERVAL '4 days' -- Occupied for more than 4 days
    AND ha.house_availability_end_date > today  -- Not their last day
    AND NOT EXISTS (  -- Prevent duplicate tasks
        SELECT 1 FROM porton.tasks t 
        WHERE t.house_id = ha.house_id 
        AND t.task_type_id = (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje posteljine')
        AND t.start_time::DATE = today
    );
END $$;