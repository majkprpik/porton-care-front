import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Home } from '../../interfaces/team.interface';
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
      // Initialize all homes as dirty if they don't have a status
      this.team?.homes.forEach(home => {
        if (!home.status) home.status = CleaningState.DIRTY;
      });
    });
  }

  startCleaning(home: Home) {
    home.status = CleaningState.CLEANING;
    this.updateTeam();
  }

  stopCleaning(home: Home) {
    home.status = CleaningState.PARTIALLY_CLEANED;
    this.updateTeam();
  }

  markFullyCleaned(home: Home) {
    home.status = CleaningState.FULLY_CLEANED;
    this.updateTeam();
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