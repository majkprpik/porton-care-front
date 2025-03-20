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

  async getHomesWithRepairTasks(){
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_statuses_view')
        .select('*');

      if (error) throw error;

      let housesWithRepairTasks = data.flatMap(house => 
        house.housetasks
            .filter((houseTask: any) => houseTask.taskTypeName === "Popravak")
            .map((houseTask: any) => ({
                ...house,
                ...houseTask,
            }))
      );
      
      console.log('Houses with repair tasks:', housesWithRepairTasks);

      return housesWithRepairTasks;
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

  /**
   * Locks a house by updating its availability status to "Locked"
   * @param houseId The ID of the house to lock
   * @returns Promise that resolves when the house is locked
   */
  async lockHouse(houseId: number): Promise<void> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if there's an existing house_availability record for today
      const { data: existingAvailability, error: checkError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*')
        .eq('house_id', houseId)
        .gte('date', `${today}T00:00:00`)
        .lte('date', `${today}T23:59:59`)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Get the ID for "Locked" status from the availability_types table
      const { data: lockedStatus, error: statusError } = await this.supabase.getClient()
        .schema('porton')
        .from('availability_types')
        .select('availability_type_id')
        .eq('name', 'Locked')
        .single();
      
      if (statusError) {
        // If "Locked" status doesn't exist, use a default ID (you may need to adjust this)
        console.warn('Could not find "Locked" status, using default ID 99');
        const lockedStatusId = 99;
        
        if (existingAvailability) {
          // Update existing availability
          const { error: updateError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .update({ availability_type_id: lockedStatusId })
            .eq('house_availability_id', existingAvailability.house_availability_id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new availability
          const { error: insertError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .insert({
              house_id: houseId,
              availability_type_id: lockedStatusId,
              date: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
        }
      } else {
        const lockedStatusId = lockedStatus.availability_type_id;
        
        if (existingAvailability) {
          // Update existing availability
          const { error: updateError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .update({ availability_type_id: lockedStatusId })
            .eq('house_availability_id', existingAvailability.house_availability_id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new availability
          const { error: insertError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .insert({
              house_id: houseId,
              availability_type_id: lockedStatusId,
              date: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
        }
      }
      
      console.log(`House ${houseId} locked successfully`);
    } catch (error) {
      console.error(`Error locking house ${houseId}:`, error);
      throw error;
    }
  }

  /**
   * Updates the status of a task
   * @param taskId The ID of the task to update
   * @param newStatus The new status to set (e.g., 'U tijeku', 'Dodijeljeno', 'Završeno')
   * @returns Promise that resolves when the task is updated
   */
  async updateTaskStatus(taskId: number, newStatus: string): Promise<void> {
    try {
      // First, get the task progress type ID for the new status
      const { data: progressType, error: progressTypeError } = await this.supabase.getClient()
        .schema('porton')
        .from('task_progress_types')
        .select('task_progress_type_id')
        .eq('task_progress_type_name', newStatus)
        .single();
      
      if (progressTypeError) {
        console.error('Error finding task progress type:', progressTypeError);
        throw progressTypeError;
      }
      
      const progressTypeId = progressType.task_progress_type_id;
      
      // Update the task with the new progress type
      const { error: updateError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({ 
          task_progress_type_id: progressTypeId,
          // If starting a task, set the start time
          ...(newStatus === 'u progresu' && { start_time: new Date().toISOString() }),
          // If completing a task, set the end time
          ...(newStatus === 'Završeno' && { end_time: new Date().toISOString() })
        })
        .eq('task_id', taskId);
      
      if (updateError) {
        console.error('Error updating task status:', updateError);
        throw updateError;
      }
      
      console.log(`Task ${taskId} updated to status: ${newStatus}`);
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  }
} 
