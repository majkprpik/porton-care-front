import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { CleaningStaffService } from '../../services/cleaning-staff.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CleaningPerson } from '../../models/cleaning-person.interface';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam } from '../../interfaces/team.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';

interface Team {
  id: string;
  members: CleaningPerson[];
  homes: MobileHome[];
}

@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [DragDropModule, CommonModule, MobileHomeCardComponent],
  templateUrl: './daily-sheet.component.html',
  styleUrls: ['./daily-sheet.component.scss']
})
export class DailySheetComponent implements OnInit {
  mobileHomes: MobileHome[] = [];
  cleaningStaff: CleaningPerson[] = [];
  assignedTeams: Team[] = [];
  private teamCounter = 1;

  constructor(
    private mobileHomesService: MobileHomesService,
    private cleaningStaffService: CleaningStaffService,
    private teamsService: TeamsService
  ) {}

  ngOnInit() {
    this.loadTodayData();
  }

  private loadTodayData() {
    const today = new Date().toISOString().split('T')[0];
    
    this.mobileHomesService.getMockHomesForDate(today)
      .subscribe(homes => this.mobileHomes = homes);

    this.cleaningStaffService.getMockCleaningStaff()
      .subscribe(staff => this.cleaningStaff = staff);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  createNewTeam() {
    const newTeam = {
      id: this.teamCounter.toString(),
      name: `Team ${this.teamCounter}`,
      members: [],
      homes: []
    };
    this.assignedTeams.push(newTeam);
    this.teamCounter++;
  }

  getConnectedLists(teamId: string): string[] {
    return ['staff-list', 'homes-list', ...this.assignedTeams.map(t => `team-${t.id}`)];
  }

  getTeamDropLists(): string[] {
    return this.assignedTeams.map(t => `team-${t.id}-members`);
  }

  getTeamHomeDropLists(): string[] {
    return this.assignedTeams.map(t => `team-${t.id}-homes`);
  }

  getTeamMemberDropLists(): string[] {
    return this.assignedTeams.map(team => `team-${team.id}-members`);
  }

  lockTeams() {
    const teamsToLock = this.assignedTeams.map(team => ({
      id: team.id,
      members: [...team.members],
      homes: [...team.homes]
    }));
    
    this.teamsService.saveLockedTeams(teamsToLock as unknown as LockedTeam[]);

  }
} 