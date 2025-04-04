import { Component, OnInit } from '@angular/core';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam } from '../../interfaces/team.interface';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-team-view',
  templateUrl: './team-view.component.html',
  styleUrls: ['./team-view.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class TeamViewComponent implements OnInit {
  teams: LockedTeam[] = [];
  workGroup: any;

  constructor(
    private teamsService: TeamsService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.teamsService.lockedTeams$.subscribe(teams => {
      this.teams = teams;
    });

    this.supabaseService.$workGroups.subscribe(res => {
      if(res && res.eventType == 'INSERT') {
        if(!this.teams.find((team: LockedTeam) => team.id == res.new.work_group_id)) {
          let newLockedTeam: LockedTeam = {
            homes: [],
            id: res.new.work_group_id.toString(),
            isLocked: false,
            members: [],
            name: "Team " + res.new.work_group_id,
            tasks: [],
          }
          this.teams.push(newLockedTeam);
        }
      } else if(res && res.eventType == 'DELETE') {
        this.teams = this.teams.filter((team: LockedTeam) => team.id != res.old.work_group_id);
        this.teamsService.updateLockedTeams(this.teams);
      }
    });
  }
} 