import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHome, Reservation } from '../models/mobile-home.interface';

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