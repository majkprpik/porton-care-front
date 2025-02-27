import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LockedTeam, Staff, Home } from '../interfaces/team.interface';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private defaultTeams: LockedTeam[] = [
    {
      id: '1',
      name: 'Team 1',
      members: [
        { id: '1', name: 'Ana K.' }
      ],
      homes: [
        { number: '110', status: 'yellow' },
        { number: '106', status: 'green' }
      ]
    },
    {
      id: '2',
      name: 'Team 2',
      members: [
        { id: '2', name: 'Marko P.' },
        { id: '3', name: 'Luka R.' }
      ],
      homes: [
        { number: '109', status: 'green' },
        { number: '108', status: 'black' }
      ]
    },
    {
      id: '3',
      name: 'Team 3',
      members: [
        { id: '4', name: 'Ivan M.' }
      ],
      homes: [
        { number: '105', status: 'yellow' },
        { number: '103', status: 'red' },
        { number: '102', status: 'yellow' }
      ]
    },
    {
      id: '4',
      name: 'Team 4',
      members: [
        { id: '5', name: 'Petra S.' }
      ],
      homes: [
        { number: '101', status: 'green' },
        { number: '107', status: 'yellow' },
        { number: '104', status: 'black' }
      ]
    }
  ];

  private lockedTeams = new BehaviorSubject<LockedTeam[]>(this.defaultTeams);
  lockedTeams$ = this.lockedTeams.asObservable();

  constructor() {
    // Initialize with default teams if no teams are saved
    if (this.getLockedTeams().length === 0) {
      this.saveLockedTeams(this.defaultTeams);
    }
  }

  saveLockedTeams(teams: LockedTeam[]) {
    this.lockedTeams.next(teams);
  }

  getLockedTeams() {
    return this.lockedTeams.getValue();
  }

  resetToDefaultTeams() {
    this.saveLockedTeams(this.defaultTeams);
  }
} 