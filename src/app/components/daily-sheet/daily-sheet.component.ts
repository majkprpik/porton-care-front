import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { CleaningStaffService } from '../../services/cleaning-staff.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CleaningPerson } from '../../models/cleaning-person.interface';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Staff, Home } from '../../interfaces/team.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';
import { Subscription } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

interface Team {
  id: string;
  name: string;
  members: CleaningPerson[];
  homes: MobileHome[];
}

@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [DragDropModule, CommonModule, MobileHomeCardComponent, MatIcon],
  templateUrl: './daily-sheet.component.html',
  styleUrls: ['./daily-sheet.component.scss']
})
export class DailySheetComponent implements OnInit, OnDestroy {
  mobileHomes: MobileHome[] = [];
  cleaningStaff: CleaningPerson[] = [];
  assignedTeams: Team[] = [];
  lockedTeamIds: string[] = []; // Track which teams are locked
  private teamCounter = 1;
  private teamsSubscription: Subscription | null = null;
  private loadedTeamIds: Set<string> = new Set(); // Track which team IDs have been loaded

  constructor(
    private mobileHomesService: MobileHomesService,
    private cleaningStaffService: CleaningStaffService,
    private teamsService: TeamsService
  ) {}

  ngOnInit() {
    this.loadTodayData();
    this.loadExistingTeams();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
    }
  }

  private async loadTodayData() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const homes = await this.mobileHomesService.getHomesForDate(today);
      this.mobileHomes = homes.filter(home => 
        home.housetasks && home.housetasks.length > 0
      );
    } catch (error) {
      console.error('Error loading mobile homes:', error);
      this.mobileHomes = [];
    }

    this.cleaningStaffService.getMockCleaningStaff()
      .subscribe(staff => this.cleaningStaff = staff);
  }

  private async loadExistingTeams() {
    try {
      // Subscribe to the teams from the service
      this.teamsSubscription = this.teamsService.lockedTeams$.subscribe(async (lockedTeams) => {
        if (!lockedTeams || lockedTeams.length === 0) {
          // No teams found, just reset the assigned teams
          this.assignedTeams = [];
          this.lockedTeamIds = [];
          return;
        }
        
        // Convert LockedTeam objects to the component's Team format
        const componentTeams: Team[] = [];
        const lockedIds: string[] = [];
        
        for (const lockedTeam of lockedTeams) {
          // Skip teams we've already processed to avoid duplicates
          if (this.loadedTeamIds.has(lockedTeam.id)) {
            // Update existing team if it's already in our list
            const existingTeamIndex = this.assignedTeams.findIndex(t => t.id === lockedTeam.id);
            if (existingTeamIndex >= 0) {
              // Update locked status if needed
              if (lockedTeam.isLocked) {
                lockedIds.push(lockedTeam.id);
              }
              
              // Keep the existing team in our list
              componentTeams.push(this.assignedTeams[existingTeamIndex]);
            }
            continue;
          }
          
          // Mark this team as loaded
          this.loadedTeamIds.add(lockedTeam.id);
          
          // Create a new Team object
          const team: Team = {
            id: lockedTeam.id,
            name: lockedTeam.name,
            members: [],
            homes: []
          };
          
          // Track locked teams
          if (lockedTeam.isLocked) {
            lockedIds.push(lockedTeam.id);
          }
          
          // Convert Staff to CleaningPerson
          if (lockedTeam.members && lockedTeam.members.length > 0) {
            // Find the corresponding CleaningPerson objects from cleaningStaff
            for (const member of lockedTeam.members) {
              const cleaningPerson = this.cleaningStaff.find(staff => staff.id === member.id);
              if (cleaningPerson) {
                team.members.push(cleaningPerson);
              } else {
                // If not found, create a new CleaningPerson object
                team.members.push({
                  id: member.id,
                  name: member.name,
                  available: true
                });
              }
            }
          }
          
          // Convert Home to MobileHome
          if (lockedTeam.homes && lockedTeam.homes.length > 0) {
            // Find the corresponding MobileHome objects from mobileHomes
            for (const home of lockedTeam.homes) {
              const mobileHome = this.mobileHomes.find(h => 
                h.housename === home.number || h.number === home.number
              );
              if (mobileHome) {
                team.homes.push(mobileHome);
              }
              // If not found, we don't add it since we need the full MobileHome object
            }
          }
          
          componentTeams.push(team);
        }
        
        // Update the teamCounter to be greater than any existing team ID
        const maxTeamId = Math.max(...componentTeams.map(team => parseInt(team.id) || 0), 0);
        this.teamCounter = maxTeamId + 1;
        
        // Set the assignedTeams and locked team IDs
        this.assignedTeams = componentTeams;
        this.lockedTeamIds = lockedIds;
      });
    } catch (error) {
      console.error('Error loading existing teams:', error);
    }
  }

  getTaskIndicators(home: MobileHome): string[] {
    const indicators: string[] = [];
    
    // Add indicators based on home properties
    if (home.housetasks && home.housetasks.length > 0) {
      // Check for specific task types
      home.housetasks.forEach(task => {
        // Using taskTypeName to determine the type of task
        if (task.taskTypeName.toLowerCase().includes('cleaning')) {
          indicators.push('C'); // C for Cleaning
        }
        if (task.taskTypeName.toLowerCase().includes('maintenance')) {
          indicators.push('M'); // M for Maintenance
        }
        if (task.taskTypeName.toLowerCase().includes('inspection')) {
          indicators.push('I'); // I for Inspection
        }
        if (task.taskTypeName.toLowerCase().includes('checkout')) { 
          indicators.push('O'); // O for Checkout
        }
        if (task.taskTypeName.toLowerCase().includes('checkin')) {
          indicators.push('N'); // N for New guests/Check-in
        }
      });
    }
    
    return indicators;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    // Check if the target container belongs to a locked team
    const containerId = event.container.id;
    const teamId = this.getTeamIdFromContainerId(containerId);
    
    if (teamId && this.lockedTeamIds.includes(teamId)) {
      console.warn('Cannot modify a locked team');
      return; // Prevent changes to locked teams
    }
    
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Check if the source container belongs to a locked team
      const prevContainerId = event.previousContainer.id;
      const prevTeamId = this.getTeamIdFromContainerId(prevContainerId);
      
      if (prevTeamId && this.lockedTeamIds.includes(prevTeamId)) {
        console.warn('Cannot modify a locked team');
        return; // Prevent changes to locked teams
      }
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  // Helper method to extract team ID from container ID
  private getTeamIdFromContainerId(containerId: string): string | null {
    // Container IDs are in the format "team-{id}-members" or "team-{id}-homes"
    if (!containerId || !containerId.startsWith('team-')) {
      return null;
    }
    
    const parts = containerId.split('-');
    if (parts.length < 2) {
      return null;
    }
    
    return parts[1];
  }

  async createNewTeam() {
    // Create a new team with the component's Team interface
    const newComponentTeam: Team = {
      id: this.teamCounter.toString(),
      name: `Team ${this.teamCounter}`,
      members: [],
      homes: []
    };
    
    try {
      // Convert to LockedTeam format for the service
      const newLockedTeam: LockedTeam = {
        id: newComponentTeam.id,
        name: newComponentTeam.name,
        members: [], // Empty array as we're creating a new team
        homes: [],   // Empty array as we're creating a new team
        isLocked: false
      };
      
      // Save to Supabase and get the updated team with the correct ID
      const savedTeam = await this.teamsService.createNewTeam(newLockedTeam);
      
      if (savedTeam) {
        // Convert back to component's Team format and add to assigned teams
        const savedComponentTeam: Team = {
          id: savedTeam.id,
          name: savedTeam.name,
          members: [], // Start with empty arrays as the saved team should also have empty arrays
          homes: []
        };
        
        // Add to our tracking set to prevent duplicates when the subscription updates
        this.loadedTeamIds.add(savedTeam.id);
        
        // Add to the assigned teams
        this.assignedTeams.push(savedComponentTeam);
        
        // Update the team counter
        this.teamCounter = Math.max(this.teamCounter, parseInt(savedTeam.id) + 1);
        
        // Refresh teams from Supabase to ensure consistency
        // We don't need to await this as it will update via the subscription
        this.teamsService.refreshTeams();
      } else {
        // Fallback to local-only if Supabase save failed
        this.assignedTeams.push(newComponentTeam);
        console.warn('Team was not saved to Supabase, using local version only');
        this.teamCounter++;
      }
    } catch (error) {
      // Handle error and fallback to local-only
      console.error('Error creating team in Supabase:', error);
      this.assignedTeams.push(newComponentTeam);
      console.warn('Team was not saved to Supabase due to an error, using local version only');
      this.teamCounter++;
    }

    this.loadExistingTeams();
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

  async lockTeams() {
    // Convert component Teams to LockedTeams
    const teamsToLock: LockedTeam[] = this.assignedTeams.map(team => {
      // Convert CleaningPerson[] to Staff[]
      const staffMembers: Staff[] = team.members.map(member => ({
        id: member.id,
        name: member.name
      }));
      
      // Convert MobileHome[] to Home[]
      const homes: Home[] = team.homes.map(home => ({
        number: home.housename || home.number || '',
        status: home.status?.toString() || home.availabilityname || ''
      }));
      
      return {
        id: team.id,
        name: team.name,
        members: staffMembers,
        homes: homes,
        isLocked: true // Set to true when locking teams
      };
    });
    
    // Save to Supabase
    await this.teamsService.saveLockedTeams(teamsToLock);
    
    // Update local locked team IDs
    this.lockedTeamIds = teamsToLock.map(team => team.id);
    
    // Refresh teams from Supabase to ensure consistency
    await this.teamsService.refreshTeams();
    
    console.log('Teams locked and saved to Supabase');
  }

  // Add a method to check if a team is locked
  isTeamLocked(teamId: string): boolean {
    return this.lockedTeamIds.includes(teamId);
  }

  // Add a method to load default teams
  async loadDefaultTeams() {
    try {
      // Load default teams from the service
      const defaultTeams = this.teamsService.loadDefaultTeams();
      
      // Convert LockedTeam objects to the component's Team format
      const componentTeams: Team[] = [];
      
      for (const lockedTeam of defaultTeams) {
        // Create a new Team object
        const team: Team = {
          id: lockedTeam.id,
          name: lockedTeam.name,
          members: [],
          homes: []
        };
        
        // Convert Staff to CleaningPerson
        if (lockedTeam.members && lockedTeam.members.length > 0) {
          // Find the corresponding CleaningPerson objects from cleaningStaff
          for (const member of lockedTeam.members) {
            const cleaningPerson = this.cleaningStaff.find(staff => staff.id === member.id);
            if (cleaningPerson) {
              team.members.push(cleaningPerson);
            } else {
              // If not found, create a new CleaningPerson object
              team.members.push({
                id: member.id,
                name: member.name,
                available: true
              });
            }
          }
        }
        
        // Convert Home to MobileHome
        if (lockedTeam.homes && lockedTeam.homes.length > 0) {
          // Find the corresponding MobileHome objects from mobileHomes
          for (const home of lockedTeam.homes) {
            const mobileHome = this.mobileHomes.find(h => 
              h.housename === home.number || h.number === home.number
            );
            if (mobileHome) {
              team.homes.push(mobileHome);
            }
            // If not found, we don't add it since we need the full MobileHome object
          }
        }
        
        // Add to our tracking set to prevent duplicates
        this.loadedTeamIds.add(lockedTeam.id);
        
        componentTeams.push(team);
      }
      
      // Update the teamCounter to be greater than any existing team ID
      const maxTeamId = Math.max(...componentTeams.map(team => parseInt(team.id) || 0), 0);
      this.teamCounter = maxTeamId + 1;
      
      // Set the assignedTeams
      this.assignedTeams = componentTeams;
      
      console.log('Default teams loaded');
    } catch (error) {
      console.error('Error loading default teams:', error);
    }
  }

  unlockAllTeams(){
    console.log('All teams are unlocked')
  }

  unlockTeam(teamId: string){
    console.log('Team ' + teamId + ' unlocked');
  }

  lockTeam(teamId: string){
    console.log('Team ' + teamId + ' locked')
  }
} 