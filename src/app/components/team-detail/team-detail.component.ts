import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

enum TaskProgressType {
  ASSIGNED = 'Dodijeljeno',
  IN_PROGRESS = 'U progresu',
  COMPLETED = 'Završeno',
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss'],
})
export class TeamDetailComponent implements OnInit {
  team: LockedTeam | undefined;
  TaskProgressType = TaskProgressType; // Make enum available in template

  constructor(
    private route: ActivatedRoute,
    private teamsService: TeamsService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.teamsService.lockedTeams$.subscribe((teams) => {
      this.team = teams.find((t) => t.id === id);

      // Initialize tasks array if it doesn't exist
      if (this.team && !this.team.tasks) {
        this.team.tasks = [];
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
}
