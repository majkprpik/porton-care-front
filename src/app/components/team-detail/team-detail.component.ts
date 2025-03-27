import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { MatIconModule } from '@angular/material/icon';

enum TaskProgressType {
  ASSIGNED = 'Dodijeljeno',
  IN_PROGRESS = 'U progresu',
  COMPLETED = 'Završeno',
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss'],
})
export class TeamDetailComponent implements OnInit {
  team: LockedTeam | undefined;
  TaskProgressType = TaskProgressType; // Make enum available in template
  housesWithCleaningHouseAndDeckTasks: any[] = [];
  teams: any;

  constructor(
    private route: ActivatedRoute,
    private teamsService: TeamsService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.teamsService.lockedTeams$.subscribe((teams) => {
      this.teams = teams;
      this.team = teams.find((t) => t.id === id);
      // Initialize tasks array if it doesn't exist
      if (this.team && !this.team.tasks) {
        this.team.tasks = [];
      }

      if(id && teams && Object.keys(teams).length > 0){
        this.housesWithCleaningHouseAndDeckTasks = this.findTasksWithBothCleaningTypes(teams);
      }

      console.log(this.team);
      // Ensure all tasks have a progressType
      if (this.team?.tasks) {
        this.team.tasks.forEach((task) => {
          if (!task.progressType) {
            task.progressType = TaskProgressType.ASSIGNED;
          }
        });
      }
    });
  }

  hasToBeCleaned(task: any): boolean {
    if (!task || !task.house || !this.teams) return false;

    if(task.taskType !== 'Čišćenje terase'){
      return false;
    }
  
    // Find the matching house in all teams
    const houseTasks = this.teams.flatMap((team: any) => team.tasks).filter((t: any) => t.house === task.house);
  
    // Find the 'Čišćenje kućice' task in the same house
    const cleaningHouseTask = houseTasks.find((t: any) => t.taskType === 'Čišćenje kućice');

    if(!cleaningHouseTask){
      return false;
    }
  
    return cleaningHouseTask?.progressType !== 'Završeno';
  }

  findTasksWithBothCleaningTypes(teams: any[]): any[] {
    // Map to store house numbers and their tasks
    const houseTaskMap = new Map<number, { house: number, tasks: any[] }>();
  
    teams.forEach(team => {
      team.tasks.forEach((task: any) => {
        if (!houseTaskMap.has(task.house)) {
          houseTaskMap.set(task.house, { house: task.house, tasks: [] });
        }
        houseTaskMap.get(task.house)?.tasks.push(task);
      });
    });
  
    // Filter for houses that have both 'Čišćenje kućice' and 'Čišćenje terase'
    return Array.from(houseTaskMap.values())
      .filter(({ tasks }) => {
        const taskTypes = new Set(tasks.map(task => task.taskType));
        return taskTypes.has('Čišćenje kućice') && taskTypes.has('Čišćenje terase');
      })
      .flatMap(({ tasks }) => tasks); // Return all tasks for matching houses
  }

  startTask(task: Task) {
    task.progressType = TaskProgressType.IN_PROGRESS;
    console.log(
      `Started cleaning house ${task.number}, status: ${task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(task);
  }

  pauseTask(task: Task) {
    task.progressType = TaskProgressType.ASSIGNED;
    console.log(
      `Paused cleaning house ${task.number}, status: ${task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(task);
  }

  finishTask(task: Task) {
    task.progressType = TaskProgressType.COMPLETED;
    console.log(
      `Finished cleaning house ${task.number}, status: ${task.progressType}`
    );
    this.updateTeam();
    this.updateTaskProgressInSupabase(task);
  }

  // Helper method to check task status
  isTaskInProgress(task: Task): boolean {
    return task.progressType === TaskProgressType.IN_PROGRESS;
  }

  isTaskAssigned(task: Task): boolean {
    return task.progressType === TaskProgressType.ASSIGNED;
  }

  isTaskCompleted(task: Task): boolean {
    return task.progressType === TaskProgressType.COMPLETED;
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

  getTaskIcon(task: Task): string {
    if (!task.taskType) return 'task_alt';
    
    const taskType = task.taskType.toLowerCase();
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
}
