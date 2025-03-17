import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHomesService } from './mobile-homes.service';
import { HouseTask, MobileHome } from '../models/mobile-home.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  mobileHomes: MobileHome[] = [];

  constructor(
    private supabase: SupabaseService,
    private mobileHomesService: MobileHomesService
  ) {

  }

  async createTaskForHouse(houseId: string, description: string){
    try {
      let taskTypeId = await this.getTaskTypeIdByTaskName('Popravak');
      let taskProgressTypeId = await this.getTaskProgressTypeIdByTaskProgressTypeName('Nije dodijeljeno');

      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .insert({
          task_type_id: taskTypeId,
          task_progress_type_id: taskProgressTypeId,
          house_id: parseInt(houseId),
          start_time: this.getFormattedDateTimeNowForSupabase(),
          description: description,
        });

      if (error) throw error;
      
      console.log('Fetched data:', data);

      return data;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return null;
    }
  }

  async getAllHousesByTaskTypeName(taskTypeName: string){
    try{
      const today = new Date().toISOString().split('T')[0];
      let taskTypeId = await this.getTaskTypeIdByTaskName(taskTypeName);
      let mobileHomesForRepair;

      const { data: existingHouseIds, error: houseIdError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .select('house_id')
        .eq('task_type_id', taskTypeId)

      this.mobileHomesService.getHomesForDate(today)
        .then(homes => {
          console.log('Fetched homes:', homes);
          this.mobileHomes = homes;
        });

      if(houseIdError) throw houseIdError

      const houseIdList = existingHouseIds.map(house => house.house_id);
      const homes = await this.mobileHomesService.getHomesForDate(today);
      mobileHomesForRepair = homes.filter(home => houseIdList.includes(home.house_id));
      
      console.log("Mobile homes for repair: ");
      console.log(mobileHomesForRepair);

      return mobileHomesForRepair;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return [];
    }
  }

  async getAllTasksByTaskTypeName(taskTypeName: string): Promise<HouseTask[]>{
    try {
      let taskTypeId = await this.getTaskTypeIdByTaskName(taskTypeName);

      const { data: existingHouseIds, error: houseIdError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .select('*')
        .eq('task_type_id', taskTypeId)

      if (houseIdError) throw houseIdError;
      
      console.log('Taks ids:', existingHouseIds);

      return existingHouseIds;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  }

  async uploadCommentForTask(taskId: number, comment: string){
    try{
      const { error: commentUploadError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({ description: comment })
        .eq('task_id', taskId);

      if(commentUploadError) throw commentUploadError

      return true;
    } catch (error){
      console.error('Error uploading comment:', error);
      return [];
    }
  }

  private async getTaskTypeIdByTaskName(taskName: string){
    try{
      const { data: existingTaskTypeId, error: taskTypeIdError } = await this.supabase.getClient()
        .schema('porton')
        .from('task_types')
        .select('task_type_id')
        .eq('task_type_name', taskName)
        .single();

      if(taskTypeIdError) throw taskTypeIdError

      return existingTaskTypeId?.task_type_id;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return null;
    }
  }

  private async getTaskProgressTypeIdByTaskProgressTypeName(taskProgressTypeName: string){
    try{
      const { data: existingProgressTypeId, error: progressTypeIdError } = await this.supabase.getClient()
        .schema('porton')
        .from('task_progress_types')
        .select('task_progress_type_id')
        .eq('task_progress_type_name', taskProgressTypeName)
        .single();

      if(progressTypeIdError) throw progressTypeIdError

      return existingProgressTypeId?.task_progress_type_id;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return null;
    }
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
  }
}
