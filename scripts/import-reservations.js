const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for house IDs and type IDs to avoid multiple queries
const houseIdCache = new Map();
let occupiedTypeId = null;

async function getOccupiedTypeId() {
    if (occupiedTypeId !== null) {
        return occupiedTypeId;
    }

    const { data, error } = await supabase
        .schema('porton')
        .from('house_availability_types')
        .select('house_availability_type_id')
        .eq('house_availability_type_name', 'Occupied')
        .single();

    if (error) {
        throw new Error(`Failed to fetch Occupied type ID: ${error.message}`);
    }

    if (!data) {
        throw new Error('No Occupied type found in house_availability_types');
    }

    occupiedTypeId = data.house_availability_type_id;
    return occupiedTypeId;
}

async function getHouseId(houseNumber) {
    if (houseIdCache.has(houseNumber)) {
        return houseIdCache.get(houseNumber);
    }

    const { data, error } = await supabase
        .schema('porton')
        .from('houses')
        .select('house_id')
        .eq('house_number', houseNumber)
        .single();

    if (error) {
        throw new Error(`Failed to fetch house ID for house number ${houseNumber}: ${error.message}`);
    }

    if (!data) {
        throw new Error(`No house found with house number ${houseNumber}`);
    }

    houseIdCache.set(houseNumber, data.house_id);
    return data.house_id;
}

function parseDate(dateStr) {
    // Remove any trailing dots and split by dot
    const parts = dateStr.replace(/\.+$/, '').split('.');
    if (parts.length !== 2) {
        throw new Error(`Invalid date format: ${dateStr}. Expected D.M format`);
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = new Date().getFullYear();

    // Validate day and month
    if (isNaN(day) || day < 1 || day > 31) {
        throw new Error(`Invalid day in date: ${dateStr}`);
    }
    if (isNaN(month) || month < 1 || month > 12) {
        throw new Error(`Invalid month in date: ${dateStr}`);
    }

    // Create date in UTC at 00:00:00
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

    // Verify the date is valid (e.g., not 31st of a month with 30 days)
    if (date.getUTCDate() !== day) {
        throw new Error(`Invalid date: ${dateStr} (day does not exist in specified month)`);
    }

    // Return just the date part in ISO format (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
}

async function importReservations() {
    try {
        // Get the Occupied type ID first
        const occupiedId = await getOccupiedTypeId();
        console.log('Found Occupied type ID:', occupiedId);

        // Read the JSON file
        const data = await fs.readFile('reservations.json', 'utf8');
        const jsonData = JSON.parse(data);

        // Get all reservations from all house types
        const allReservations = [];
        const houseTypes = jsonData.houseTypes;

        // Process each house type
        for (const houseType in houseTypes) {
            const rooms = houseTypes[houseType].rooms;
            if (!rooms) continue;

            // Process each room in this house type
            for (const roomNumber in rooms) {
                const roomReservations = rooms[roomNumber];
                if (Array.isArray(roomReservations)) {
                    allReservations.push(...roomReservations);
                }
            }
        }

        console.log(`Found ${allReservations.length} total reservations to import across all house types`);

        for (const reservation of allReservations) {
            const {
                roomNumber,
                startDate,
                endDate,
                guestName,
                reservationNumber,
                color,
                reservationLength,
                prevConnected,
                nextConnected,
                adults,
                babies,
                cribs,
                dogs,
                note
            } = reservation;

            try {
                // Get the actual house_id from the houses table
                const houseId = await getHouseId(roomNumber);

                // Convert null to false for connected fields
                const prevConnectedValue = prevConnected === null ? false : prevConnected;
                const nextConnectedValue = nextConnected === null ? false : nextConnected;

                // Parse dates (will return YYYY-MM-DD format)
                const startDateOnly = parseDate(startDate);
                const endDateOnly = parseDate(endDate);

                console.log(`Processing reservation: ${guestName}, dates: ${startDate} -> ${endDate} (${startDateOnly} -> ${endDateOnly})`);

                const { data, error } = await supabase
                    .schema('porton')
                    .from('house_availabilities')
                    .insert({
                        house_id: houseId,
                        house_availability_type_id: occupiedId,
                        last_name: guestName,
                        reservation_number: reservationNumber,
                        reservation_length: reservationLength || 0,
                        prev_connected: prevConnectedValue,
                        next_connected: nextConnectedValue,
                        adults: adults || 0,
                        babies: babies || 0,
                        cribs: cribs || 0,
                        dogs_d: dogs?.default || 0,
                        dogs_s: dogs?.small || 0,
                        dogs_b: dogs?.big || 0,
                        color_theme: color?.theme || 0,
                        color_tint: color?.tint || 0.0,
                        house_availability_start_date: startDateOnly,
                        house_availability_end_date: endDateOnly,
                        has_arrived: false,
                        has_departed: false
                    });

                if (error) {
                    console.error('Error inserting reservation:', error);
                    console.error('Failed reservation:', reservation);
                } else {
                    console.log('Successfully inserted reservation for:', guestName, 'in house', roomNumber);
                }
            } catch (err) {
                console.error(`Failed to process reservation for house ${roomNumber}:`, err.message);
                console.error('Reservation:', reservation);
            }
        }

        console.log('Import completed');

    } catch (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
    }
}

importReservations(); 