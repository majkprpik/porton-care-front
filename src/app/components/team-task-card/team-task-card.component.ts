import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { SupabaseService } from '../../services/supabase.service';
import { TeamsService } from '../../services/teams.service';
import { MobileHomesService } from '../../services/mobile-homes.service';

enum TaskProgressType {
  ASSIGNED = 'Dodijeljeno',
  IN_PROGRESS = 'U progresu',
  COMPLETED = 'Završeno',
}

@Component({
  selector: 'app-team-task-card',
  imports: [CommonModule, MatIconModule],
  templateUrl: './team-task-card.component.html',
  styleUrl: './team-task-card.component.scss'
})
export class TeamTaskCardComponent {
  @Input() task!: Task; 
  @Input() team: LockedTeam | undefined;
  @Input() teams: any;
  houseOccupied: boolean = false;
  isUrgent = false;

  constructor(
    private supabaseService: SupabaseService,
    private teamsService: TeamsService,
    private mobileHomesService: MobileHomesService
  ) {
        
  }

  ngOnInit(){
    this.updateHouseOccupiedStatus();
    this.supabaseService.listenToChanges(this.task.house || '').on(
      'postgres_changes',
      { 
        event: 'UPDATE',
        schema: 'porton',
        table: 'house_availabilities'
      },
      async (payload: any) => {
        console.log('House table change: ', payload);
        if(payload.table == 'house_availabilities'){
          let houseNumber = await this.mobileHomesService.getHouseNumberByHouseId(payload.new.house_id);
          if(this.task.house == houseNumber){
            console.log('Real-time update received:', payload);
            this.houseOccupied = !payload.new.has_departed
          }
        }
      }
    ).subscribe();
  }

  getTaskIcon(): string {
    if (!this.task.taskType) return 'task_alt';
    
    const taskType = this.task.taskType.toLowerCase();
    if (taskType.includes('čišćenje') && taskType.includes('terase')) {
      return 'deck';
    }
    if (taskType.includes('čišćenje') && taskType.includes('kućice')) {
      return 'cleaning_services';
    }
    if (taskType.includes('mijenjanje') && taskType.includes('ručnika')) {
      return 'dry_cleaning';
    }
    if (taskType.includes('mijenjanje') && taskType.includes('posteljine')) {
      return 'bed';
    }
    return 'task_alt';
  }

  isTaskInProgress(): boolean {
    return this.task.progressType === TaskProgressType.IN_PROGRESS;
  }

  isTaskAssigned(): boolean {
    return this.task.progressType === TaskProgressType.ASSIGNED;
  }

  isTaskCompleted(): boolean {
    return this.task.progressType === TaskProgressType.COMPLETED;
  }

  startTask() {
    this.task.progressType = TaskProgressType.IN_PROGRESS;
    console.log(
      `Started cleaning house ${this.task.number}, status: ${this.task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(this.task);
  }

  pauseTask() {
    this.task.progressType = TaskProgressType.ASSIGNED;
    console.log(
      `Paused cleaning house ${this.task.number}, status: ${this.task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(this.task);
  }

  finishTask() {
    this.task.progressType = TaskProgressType.COMPLETED;
    console.log(
      `Finished cleaning house ${this.task.number}, status: ${this.task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(this.task);
  }

  private updateTeam() {
    if (this.team) {
      const allTeams = this.teamsService.getLockedTeams();
      const updatedTeams = allTeams.map((t) =>
        t.id === this.team?.id ? this.team : t
      );
      this.teamsService.saveLockedTeams(updatedTeams);
    }
  }

  private async updateTaskProgressInSupabase(task: Task) {
    try {
      const supabase = this.supabaseService.getClient();

      // First, get the progress type ID for the current progress type
      const { data: progressTypeData, error: progressTypeError } =
        await supabase
          .schema('porton')
          .from('task_progress_types')
          .select('task_progress_type_id')
          .ilike('task_progress_type_name', task.progressType || '')
          .limit(1);

      if (progressTypeError) {
        console.error('Error finding progress type:', progressTypeError);
        return;
      }

      let progressTypeId = null;

      // If progress type exists, use its ID
      if (progressTypeData && progressTypeData.length > 0) {
        progressTypeId = progressTypeData[0].task_progress_type_id;
      } else {
        // If progress type doesn't exist, create it
        const { data: newProgressType, error: createError } = await supabase
          .schema('porton')
          .from('task_progress_types')
          .insert({ task_progress_type_name: task.progressType })
          .select()
          .single();

        if (createError) {
          console.error('Error creating progress type:', createError);
          return;
        }

        progressTypeId = newProgressType.task_progress_type_id;
      }

      // Update the task in the database with the new progress type
      if (progressTypeId) {
        const { error: updateError } = await supabase
          .schema('porton')
          .from('tasks')
          .update({ task_progress_type_id: progressTypeId })
          .eq('task_id', parseInt(task.id));

        if (updateError) {
          console.error('Error updating task progress type:', updateError);
        } else {
          console.log(
            `Successfully updated task ${task.id} progress to ${task.progressType} in Supabase`
          );
        }
      }
    } catch (error) {
      console.error('Error updating task progress in Supabase:', error);
    }
  }

  hasToBeCleaned(): boolean {
    if (!this.task || !this.task.house || !this.teams) return false;

    if(this.task.taskType !== 'Čišćenje terase'){
      return false;
    }
  
    // Find the matching house in all teams
    const houseTasks = this.teams.flatMap((team: any) => team.tasks).filter((t: any) => t.house === this.task.house);
  
    // Find the 'Čišćenje kućice' task in the same house
    const cleaningHouseTask = houseTasks.find((t: any) => t.taskType === 'Čišćenje kućice');

    if(!cleaningHouseTask){
      return false;
    }
  
    return cleaningHouseTask?.progressType !== 'Završeno';
  }

  async checkIfHouseOccupied(): Promise<boolean> {
    try {
      let houseId;

      if(this.task.house){
        houseId = await this.mobileHomesService.getHouseIdByHouseNumber(this.task.house);
      }

      if (!houseId){
        return false;
      } 
  
      let houseAvailability = await this.mobileHomesService.getHouseAvailabilityByHouseId(houseId);

      if(houseAvailability){
        houseAvailability.sort((a, b) => {
          const dateA = new Date(a.house_availability_end_date);
          const dateB = new Date(b.house_availability_end_date);
          
          return dateA.getTime() - dateB.getTime()
        });
      }

      if(houseAvailability && houseAvailability.length == 2){
        this.isUrgent = true;
      }

      if(houseAvailability && houseAvailability.length > 0 && houseAvailability[0]?.has_departed){
        return false;
      } else if(houseAvailability && houseAvailability.length > 0 && !houseAvailability[0]?.has_departed){
        return true;
      } else{
        return false;
      }
    } catch (error) {
      console.error('Error checking house occupation:', error);
      return true; 
    }
  }

  async updateHouseOccupiedStatus() {
    this.houseOccupied = await this.checkIfHouseOccupied();
  }
}
