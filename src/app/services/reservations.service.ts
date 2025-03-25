import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHome, Reservation } from '../models/mobile-home.interface';
import { ReservationInfo } from '../components/reservations2/reservations2.component';

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {
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
 
  reservations: { [key: number]: { [key: string]: ReservationInfo }} = {}
  generateMockReservations(mobileHomes: any, reservationColors: any): { [key: number]: { [key: string]: ReservationInfo } } {
    // const reservations: { [key: number]: { [key: string]: ReservationInfo } } = {};

    if(this.reservations != null && Object.keys(this.reservations).length > 0) {
      return this.reservations;
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
      const totalReservations = Math.floor(mobileHomes.length * 0.4);
      
      for (let i = 0; i < totalReservations; i++) {
        // Random house from our array
        const randomHouseIndex = Math.floor(Math.random() * mobileHomes.length);
        const house = mobileHomes[randomHouseIndex];
        
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
              reservationId: reservationId,
              guest: guestName,
              color: colorEntry.color,
              phone: phone,
              adults: adults,
              children: children,
              extraBeds: extraBeds,
              pets: pets,
              notes: notes,
              startDay: startDay,
              startMonth: month,
              endDay: endDay,
              endMonth: month,
              isFirstDay: day === startDay,
              isLastDay: day === endDay,
              house_id: house.house_id
            };
          }
        }
      }
    }
    
    return this.reservations;
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
  async createReservation(reservation: {
    house_id: number,
    availability_type_id: number,
    start_date: string,
    end_date: string,
    guest_name: string,
    guest_phone?: string,
    notes?: string
  }): Promise<any> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .insert({
          house_id: reservation.house_id,
          availability_type_id: reservation.availability_type_id,
          house_availability_start_date: reservation.start_date,
          house_availability_end_date: reservation.end_date,
          guest_name: reservation.guest_name,
          guest_phone: reservation.guest_phone,
          notes: reservation.notes
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
  async updateReservation(reservationId: number, updates: any): Promise<any> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update(updates)
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