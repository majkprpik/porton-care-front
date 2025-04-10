import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { SupabaseService } from '../../services/supabase.service';
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
  messageToShow = '';

  constructor(
    private supabaseService: SupabaseService,
    private mobileHomesService: MobileHomesService,
    private cdr: ChangeDetectorRef
  ) {
        
  }

  ngOnInit(){
    this.cdr.detectChanges();
    this.updateHouseOccupiedStatus();
    this.supabaseService.$houseAvailabilitiesUpdate.subscribe(async res => {
      if(res){
        let houseNumber = await this.mobileHomesService.getHouseNumberByHouseId(res.new.house_id);
        if(this.task.house == houseNumber) {
          this.houseOccupied = !res.new.has_departed;
        }        
      }
    });
  }

  getTaskIcon(): string{
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
    this.updateTaskProgressInSupabase(this.task);
  }

  pauseTask() {
    this.task.progressType = TaskProgressType.ASSIGNED;
    // this.updateTeam();
    this.updateTaskProgressInSupabase(this.task);
  }

  finishTask() {
    this.task.progressType = TaskProgressType.COMPLETED;
    // this.updateTeam();
    this.updateTaskProgressInSupabase(this.task);
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
