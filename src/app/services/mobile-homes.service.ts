import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHome, HouseTask } from '../models/mobile-home.interface';
import { MobileHomeStatus } from '../models/mobile-home-status.enum';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileHomesService {
  constructor(private supabase: SupabaseService) {}

  async getHomesForDate(date: string): Promise<MobileHome[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_statuses_view')
        .select('*');

      if (error) throw error;
      
      console.log('Fetched data:', data);

      // Return the data directly as it already matches our interface
      return data || [];
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  }

  // Helper method to check if a house has active tasks
  hasActiveTasks(house: MobileHome): boolean {
    if (!house.housetasks || house.housetasks.length === 0) {
      return false;
    }
    
    // Check if any task is active (has a startTime but no endTime)
    return house.housetasks.some(task => 
      task.startTime && task.endTime === null
    );
  }

  // Helper method to get pending tasks (tasks that are not completed)
  getPendingTasks(house: MobileHome): HouseTask[] {
    if (!house.housetasks || house.housetasks.length === 0) {
      return [];
    }
    
    return house.housetasks.filter(task => task.endTime === null);
  }

  // Helper method to get the status as enum
  getStatusAsEnum(house: MobileHome): MobileHomeStatus {
    switch (house.availabilityname) {
      case 'Free':
        return MobileHomeStatus.FREE;
      case 'Occupied':
        return MobileHomeStatus.OCCUPIED;
      // Add other cases as needed
      default:
        return MobileHomeStatus.FREE;
    }
  }

  // Mock implementation for current use
  getMockHomesForDate(date: string): Observable<MobileHome[]> {
    const mockHomes: MobileHome[] = [
      { house_id: 1, housename: '101', housetype: 1, housetypename: 'Standard', availabilityid: 1, availabilityname: 'Free', housetasks: [] },
      { house_id: 2, housename: '102', housetype: 2, housetypename: 'Deluxe', availabilityid: 2, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 3, housename: '103', housetype: 3, housetypename: 'Premium', availabilityid: 3, availabilityname: 'Urgent', housetasks: [] },
      { house_id: 4, housename: '104', housetype: 4, housetypename: 'VIP', availabilityid: 4, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 5, housename: '105', housetype: 5, housetypename: 'Executive', availabilityid: 5, availabilityname: 'Pending', housetasks: [] },
      { house_id: 6, housename: '106', housetype: 6, housetypename: 'Luxury', availabilityid: 6, availabilityname: 'Ready', housetasks: [] },
      { house_id: 7, housename: '107', housetype: 7, housetypename: 'Standard', availabilityid: 7, availabilityname: 'In Progress', housetasks: [] },
      { house_id: 8, housename: '108', housetype: 8, housetypename: 'Deluxe', availabilityid: 8, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 9, housename: '109', housetype: 9, housetypename: 'Standard', availabilityid: 9, availabilityname: 'Ready', housetasks: [] },
      { house_id: 10, housename: '110', housetype: 10, housetypename: 'Deluxe', availabilityid: 10, availabilityname: 'Pending', housetasks: [] },
    ];

    return of(mockHomes);
  }
} 