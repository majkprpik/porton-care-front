import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHome, Reservation } from '../models/mobile-home.interface';
import { ReservationInfo } from '../components/reservations2/reservations2.component';

const reservationColors = [
  { name: 'Zimak', color: '#f8c9c9' },  // Light red
  { name: 'Simon', color: '#ffffa5' },  // Light yellow
  { name: 'Becker', color: '#d8d8d8' }, // Light gray
  { name: 'Unterrainer', color: '#ffcccc' }, // Light pink
  { name: 'Pressl', color: '#ffffcc' }, // Light yellow
  { name: 'Monde', color: '#ccffff' }   // Light blue
];

export interface CreateReservationParams {
  house_id: number;
  availability_type_id: number;
  start_date: string;
  end_date: string;
  guest_name: string;
  last_name?: string;
  guest_phone?: string;
  reservation_number?: string;
  adults?: number;
  babies?: number;
  cribs?: number;
  dogs_d?: number;
  dogs_s?: number;
  dogs_b?: number;
  notes?: string;
  has_arrived?: boolean;
  has_departed?: boolean;
  prev_connected?: boolean;
  next_connected?: boolean;
  color_theme?: number;
  color_tint?: number;
}

interface DbUpdates {
  house_id?: number;
  house_availability_type_id?: number;
  house_availability_start_date?: string;
  house_availability_end_date?: string;
  guest_name?: string;
  last_name?: string;
  guest_phone?: string;
  reservation_number?: string;
  adults?: number;
  babies?: number;
  cribs?: number;
  dogs_d?: number;
  dogs_s?: number;
  dogs_b?: number;
  notes?: string;
  has_arrived?: boolean;
  has_departed?: boolean;
  prev_connected?: boolean;
  next_connected?: boolean;
  color_theme?: number;
  color_tint?: number;
  [key: string]: any; // Add index signature
}

interface DbReservationInfo {
  id: number;
  house_id: number;
  start_date: string;
  end_date: string;
  guest_name?: string;
  last_name?: string;
  guest_phone?: string;
  reservation_number?: string;
  adults?: number;
  babies?: number;
  cribs?: number;
  dogs_d?: number;
  dogs_s?: number;
  dogs_b?: number;
  notes?: string;
  has_arrived?: boolean;
  has_departed?: boolean;
  prev_connected?: boolean;
  next_connected?: boolean;
  color_theme?: number;
  color_tint?: number;
  children?: number;
  reservationId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {
  private currentDate: Date = new Date();
  reservations: { [key: number]: { [key: string]: Partial<DbReservationInfo> }} = {};

  constructor(private supabase: SupabaseService) {}

  /**
   * Fetch all house availabilities for a date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Promise with array of availability records
   */
  async getHouseAvailabilities(startDate: string, endDate: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select(`
          house_availability_id,
          house_id,
          house_availability_type_id,
          house_availability_start_date,
          house_availability_end_date,
          houses(house_name),
          house_availability_types(house_availability_type_id, house_availability_type_name)
        `)
        .gte('house_availability_start_date', startDate)
        .lte('house_availability_end_date', endDate);

      if (error) {
        console.error('Error fetching house availabilities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHouseAvailabilities:', error);
      return [];
    }
  }
 
  async generateMockReservations(houses: MobileHome[]): Promise<Partial<DbReservationInfo>[]> {
    if(this.reservations != null && Object.keys(this.reservations).length > 0) {
      return Object.values(this.reservations).flatMap(obj => Object.values(obj));
    }
    
    // Create guest names array for more variety
    const guestNames = [
      'Zimak', 'Simon', 'Becker', 'Unterrainer', 'Pressl', 'Monde',
      'Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 
      'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson'
    ];
    
    // Generate random reservations across all houses for relevant months (4-10)
    for (let month = 4; month <= 10; month++) {
      // Get days in this month
      const daysInMonth = new Date(2025, month, 0).getDate();
      
      // Generate multiple reservations per month (about 40% occupancy)
      const totalReservations = Math.floor(houses.length * 0.4);
      
      for (let i = 0; i < totalReservations; i++) {
        // Random house from our array
        const randomHouseIndex = Math.floor(Math.random() * houses.length);
        const house = houses[randomHouseIndex];
        
        // Random start/end dates for this month
        const startDay = Math.floor(Math.random() * (daysInMonth - 7)) + 1; // 1 to (daysInMonth-7)
        const duration = Math.floor(Math.random() * 10) + 3; // 3-12 days
        const endDay = Math.min(startDay + duration, daysInMonth); // Ensure we don't go beyond month
        
        // Random guest details
        const guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
        const adults = Math.floor(Math.random() * 3) + 1; // 1-3 adults
        const children = Math.floor(Math.random() * 4); // 0-3 children
        const extraBeds = Math.floor(Math.random() * 2); // 0-1 extra beds
        const pets = Math.random() > 0.8 ? 1 : 0; // 20% chance of pets
        
        // Notes options
        const notesOptions = [
          '', '', '', // Empty notes more likely
          'Early check-in requested',
          'Late check-out requested',
          'Anniversary celebration',
          'Birthday during stay',
          'Business trip',
          'Family vacation',
          'Returning guest',
          'Needs extra towels'
        ];
        const notes = notesOptions[Math.floor(Math.random() * notesOptions.length)];
        
        // Phone number generation
        const areaCode = Math.floor(Math.random() * 900) + 100;
        const prefix = Math.floor(Math.random() * 900) + 100;
        const lineNum = Math.floor(Math.random() * 9000) + 1000;
        const phone = `${areaCode}-${prefix}-${lineNum}`;
        
        // Only add if this house doesn't already have a reservation for these dates
        let hasOverlap = false;
        
        // Check if this house already has any reservations
        if (this.reservations[house.house_id]) {
          for (let day = startDay; day <= endDay; day++) {
            const dayStr = `${day}.${month}`;
            if (this.reservations[house.house_id][dayStr]) {
              hasOverlap = true;
              break;
            }
          }
        }
        
        // Add reservation if no overlap
        if (!hasOverlap) {
          // Generate unique reservation ID
          const reservationId = `res-${house.house_id}-${month}-${startDay}`;
          
          // Find or create color for this guest
          let colorEntry = reservationColors.find((c: any) => 
            c.name.toLowerCase() === guestName.toLowerCase()
          );
          
          // If no color found, generate a random pastel color
          if (!colorEntry) {
            const hue = Math.floor(Math.random() * 360);
            const pastelColor = `hsl(${hue}, 70%, 85%)`;
            colorEntry = { name: guestName, color: pastelColor };
          }
          
          // Initialize house reservations if not exists
          if (!this.reservations[house.house_id]) {
            this.reservations[house.house_id] = {};
          }
          
          // Add an entry for each day in the range
          for (let day = startDay; day <= endDay; day++) {
            const dayStr = `${day}.${month}`;
            
            this.reservations[house.house_id][dayStr] = {
              id: parseInt(reservationId.split('-')[2]),
              house_id: house.house_id,
              start_date: `${this.currentDate.getFullYear()}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`,
              end_date: `${this.currentDate.getFullYear()}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`,
              guest_name: guestName,
              guest_phone: phone,
              adults: adults,
              children: children,
              notes: notes,
              reservationId: parseInt(reservationId)
            };
          }
        }
      }
    }
    
    return Object.values(this.reservations).flatMap(obj => Object.values(obj));
  }

  /**
   * Get all houses with their availability status for a given date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Promise with houses and their availability status
   */
  async getHousesWithAvailabilityStatus(startDate: string, endDate: string): Promise<any[]> {
    try {
      // First, get all houses
      const { data: houses, error: housesError } = await this.supabase.getClient()
        .schema('porton')
        .from('houses')
        .select('*');

      if (housesError) {
        console.error('Error fetching houses:', housesError);
        throw housesError;
      }

      // Then get all availability types
      const { data: availabilityTypes, error: typesError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availability_types')
        .select('*');

      if (typesError) {
        console.error('Error fetching availability types:', typesError);
        throw typesError;
      }

      // Get all availability records for the date range
      const availabilities = await this.getHouseAvailabilities(startDate, endDate);

      // Create a map of houses with their availabilities
      const result = houses.map((house: any) => {
        const houseAvailabilities = availabilities.filter(
          (avail: any) => avail.house_id === house.house_id
        );

        return {
          ...house,
          availabilities: houseAvailabilities
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getHousesWithAvailabilityStatus:', error);
      return [];
    }
  }

  /**
   * Create a new reservation (house availability record)
   * @param reservation Reservation data
   * @returns Promise with created reservation
   */
  async createReservation(reservation: CreateReservationParams): Promise<any> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .insert({
          house_id: reservation.house_id,
          house_availability_type_id: reservation.availability_type_id,
          house_availability_start_date: reservation.start_date,
          house_availability_end_date: reservation.end_date,
          guest_name: reservation.guest_name,
          last_name: reservation.last_name,
          guest_phone: reservation.guest_phone,
          reservation_number: reservation.reservation_number,
          adults: reservation.adults || 1,
          babies: reservation.babies || 0,
          cribs: reservation.cribs || 0,
          dogs_d: reservation.dogs_d || 0,
          dogs_s: reservation.dogs_s || 0,
          dogs_b: reservation.dogs_b || 0,
          notes: reservation.notes,
          has_arrived: reservation.has_arrived || false,
          has_departed: reservation.has_departed || false,
          prev_connected: reservation.prev_connected || false,
          next_connected: reservation.next_connected || false,
          color_theme: reservation.color_theme || 0,
          color_tint: reservation.color_tint || 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reservation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createReservation:', error);
      throw error;
    }
  }

  /**
   * Update an existing reservation
   * @param reservationId Reservation ID
   * @param updates Fields to update
   * @returns Promise with updated reservation
   */
  async updateReservation(reservationId: number, updates: Partial<CreateReservationParams>): Promise<any> {
    try {
      // Convert field names to match database schema
      const dbUpdates: DbUpdates = {
        house_id: updates.house_id,
        house_availability_type_id: updates.availability_type_id,
        house_availability_start_date: updates.start_date,
        house_availability_end_date: updates.end_date,
        guest_name: updates.guest_name,
        last_name: updates.last_name,
        guest_phone: updates.guest_phone,
        reservation_number: updates.reservation_number,
        adults: updates.adults,
        babies: updates.babies,
        cribs: updates.cribs,
        dogs_d: updates.dogs_d,
        dogs_s: updates.dogs_s,
        dogs_b: updates.dogs_b,
        notes: updates.notes,
        has_arrived: updates.has_arrived,
        has_departed: updates.has_departed,
        prev_connected: updates.prev_connected,
        next_connected: updates.next_connected,
        color_theme: updates.color_theme,
        color_tint: updates.color_tint
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update(dbUpdates)
        .eq('house_availability_id', reservationId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating reservation ${reservationId}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error in updateReservation for ${reservationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a reservation
   * @param reservationId Reservation ID
   * @returns Promise indicating success
   */
  async deleteReservation(reservationId: number): Promise<void> {
    try {
      const { error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .delete()
        .eq('house_availability_id', reservationId);

      if (error) {
        console.error(`Error deleting reservation ${reservationId}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in deleteReservation for ${reservationId}:`, error);
      throw error;
    }
  }

  /**
   * Get all availability types (e.g., Occupied, Free)
   * @returns Promise with availability types
   */
  async getAvailabilityTypes(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availability_types')
        .select('*');

      if (error) {
        console.error('Error fetching availability types:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAvailabilityTypes:', error);
      return [];
    }
  }

  /**
   * Format date to YYYY-MM-DD format for Supabase
   * @param date Date to format
   * @returns Formatted date string
   */
  formatDateForSupabase(date: Date): string {
    return date.toISOString().split('T')[0];
  }
} 