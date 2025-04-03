import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { MatIconModule } from '@angular/material/icon';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { BehaviorSubject } from 'rxjs';
import { TeamTaskCardComponent } from '../team-task-card/team-task-card.component';
import { TaskService } from '../../services/task.service';

enum TaskProgressType {
  ASSIGNED = 'Dodijeljeno',
  IN_PROGRESS = 'U progresu',
  COMPLETED = 'Završeno',
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule,
    TeamTaskCardComponent
  ],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss'],
})
export class TeamDetailComponent implements OnInit {
  team: LockedTeam | undefined;
  TaskProgressType = TaskProgressType; // Make enum available in template
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
      // Ensure all tasks have a progressType
      if (this.team?.tasks) {
        this.team.tasks.forEach((task) => {
          if (!task.progressType) {
            task.progressType = TaskProgressType.ASSIGNED;
          }
        });
      }
    });

    
    this.supabaseService.listenToChanges(id || '')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'work_group_tasks'
      },
      async (payload: any) => {
        window.location.reload();
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'work_group_profiles'
      },
      async (payload: any) => {
        window.location.reload();
      }
    ).subscribe();
  }
}
