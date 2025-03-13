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
    free_days INT;
    occupation_days INT;
    occupied_type_id INT;
    free_type_id INT;
    current_type_id INT;
BEGIN
    -- Get the 'occupied' type ID
    SELECT house_availability_type_id INTO occupied_type_id 
    FROM porton.house_availability_types 
    WHERE house_availability_type_name = 'Occupied';

    -- Get the 'free' type ID
    SELECT house_availability_type_id INTO free_type_id 
    FROM porton.house_availability_types 
    WHERE house_availability_type_name = 'Free';

    -- Loop through all houses
    FOR house_rec IN (SELECT house_id FROM porton.houses) LOOP
        -- Set the start date to January 1st of this year at 2 PM
        start_date := DATE_TRUNC('year', NOW()) + INTERVAL '2 hours';

        -- Generate random availabilities for the whole year
        WHILE start_date < DATE_TRUNC('year', NOW()) + INTERVAL '1 year' LOOP
            -- Decide whether this period is occupied or free
            IF RANDOM() > 0.3 THEN -- 70% chance to be "Occupied", 30% "Free"
                current_type_id := occupied_type_id;
                
                -- Weighted random selection for occupation length
                occupation_days := 
                    CASE 
                        WHEN RANDOM() < 0.6 THEN FLOOR(RANDOM() * 3) + 1  -- 60% → 1-3 days
                        WHEN RANDOM() < 0.9 THEN FLOOR(RANDOM() * 4) + 3  -- 30% → 3-7 days
                        ELSE FLOOR(RANDOM() * 13) + 7  -- 10% → 7-20 days
                    END;

                end_date := start_date + (occupation_days || ' days')::INTERVAL;
            ELSE
                current_type_id := free_type_id;
                free_days := FLOOR(RANDOM() * 5) + 1; -- Free 0-5 days
                end_date := start_date + (free_days || ' days')::INTERVAL;
            END IF;

            -- Set check-in at 2 PM and check-out at 10 AM if occupied
            IF current_type_id = occupied_type_id THEN
                start_date := start_date + INTERVAL '14 hours'; -- 2 PM
                end_date := end_date + INTERVAL '10 hours'; -- 10 AM next day
            END IF;

            -- Insert availability period (Occupied or Free)
            INSERT INTO porton.house_availabilities 
            (house_id, house_availability_type_id, house_availability_start_date, house_availability_end_date)
            VALUES 
            (house_rec.house_id, current_type_id, start_date, end_date);

            -- Move start date to the next period
            start_date := end_date;
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
BEGIN
    -- Get the task progress type ID for "Nije dodijeljeno"
    SELECT task_progress_type_id INTO task_status_id 
    FROM porton.task_progress_types 
    WHERE task_progress_type_name = 'Nije dodijeljeno';

    -- 1️⃣ Assign "Punjenje", "Čišćenje kućice", and "Čišćenje terase" 
    -- to houses where guests **left yesterday**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        task_type_id, 
        task_status_id, 
        ha.house_id, 
        NOW() 
    FROM porton.house_availabilities ha
    CROSS JOIN porton.task_types tt
    WHERE ha.house_availability_end_date::DATE = '2025-03-10' -- Yesterday
    AND tt.task_type_name IN ('Punjenje', 'Čišćenje kućice', 'Čišćenje terase');

    -- 2️⃣ Assign "Čišćenje terase" to houses where guests **arrive today**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Čišćenje terase'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE ha.house_availability_start_date::DATE = '2025-03-11'; -- Today

    -- 3️⃣ Assign "Mijenjanje posteljine" to houses occupied **more than 4 days** 
    -- but **not their last day**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje posteljine'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE ha.house_availability_start_date <= '2025-03-07' -- Occupied for 4+ days
    AND ha.house_availability_end_date > '2025-03-11'; -- Not their last day

    -- 4️⃣ Assign "Mijenjanje ručnika" to houses occupied **more than 2 days**
    -- but **not their last day**
    INSERT INTO porton.tasks (task_type_id, task_progress_type_id, house_id, start_time)
    SELECT 
        (SELECT task_type_id FROM porton.task_types WHERE task_type_name = 'Mijenjanje ručnika'),
        task_status_id, 
        ha.house_id, 
        NOW()
    FROM porton.house_availabilities ha
    WHERE ha.house_availability_start_date <= '2025-03-09' -- Occupied for 2+ days
    AND ha.house_availability_end_date > '2025-03-11'; -- Not their last day
END $$;
