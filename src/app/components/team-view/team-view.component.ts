import { Component, OnInit } from '@angular/core';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam } from '../../interfaces/team.interface';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-view',
  templateUrl: './team-view.component.html',
  styleUrls: ['./team-view.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class TeamViewComponent implements OnInit {
  teams: LockedTeam[] = [];

  constructor(private teamsService: TeamsService) {}

  ngOnInit() {
    this.teamsService.lockedTeams$.subscribe(teams => {
      this.teams = teams;
    });
  }
} 