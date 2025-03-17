import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Task } from '../../interfaces/team.interface';
import { CommonModule } from '@angular/common';

enum CleaningState {
  DIRTY = 'red',
  CLEANING = 'orange',
  PARTIALLY_CLEANED = 'yellow',
  FULLY_CLEANED = 'green'
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss']
})
export class TeamDetailComponent implements OnInit {
  team: LockedTeam | undefined;
  CleaningState = CleaningState; // Make enum available in template

  constructor(
    private route: ActivatedRoute,
    private teamsService: TeamsService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.teamsService.lockedTeams$.subscribe(teams => {
      this.team = teams.find(t => t.id === id);
      
      // Initialize tasks array if it doesn't exist
      if (this.team && !this.team.tasks) {
        this.team.tasks = [];
      }
      
      // Initialize all tasks with default values if needed
      if (this.team?.tasks) {
        this.team.tasks.forEach(task => {
          // Set default status if not provided
          if (!task.status) {
            task.status = CleaningState.DIRTY;
          }
          
          // Set default task type if not provided
          if (!task.taskType) {
            task.taskType = 'Cleaning';
          }
          
          // Set default progress type based on status if not provided
          if (!task.progressType) {
            task.progressType = this.getProgressTypeFromStatus(task.status);
          }
          
          // Set default house if not provided
          if (!task.house) {
            task.house = task.number;
          }
        });
      }
    });
  }

  startCleaning(task: Task) {
    task.status = CleaningState.CLEANING;
    task.progressType = 'In Progress';
    this.updateTeam();
  }

  stopCleaning(task: Task) {
    task.status = CleaningState.PARTIALLY_CLEANED;
    task.progressType = 'Partially Complete';
    this.updateTeam();
  }

  markFullyCleaned(task: Task) {
    task.status = CleaningState.FULLY_CLEANED;
    task.progressType = 'Completed';
    this.updateTeam();
  }

  getProgressTypeFromStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    
    switch (status) {
      case CleaningState.DIRTY:
        return 'Not Started';
      case CleaningState.CLEANING:
        return 'In Progress';
      case CleaningState.PARTIALLY_CLEANED:
        return 'Partially Complete';
      case CleaningState.FULLY_CLEANED:
        return 'Completed';
      default:
        return status;
    }
  }

  private updateTeam() {
    if (this.team) {
      const allTeams = this.teamsService.getLockedTeams();
      const updatedTeams = allTeams.map(t => 
        t.id === this.team?.id ? this.team : t
      );
      this.teamsService.saveLockedTeams(updatedTeams);
    }
  }
}