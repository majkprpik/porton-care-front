import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LockedTeam, Staff, Home } from '../interfaces/team.interface';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  // Keep the default teams as a reference, but don't use them by default
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

  // Initialize with an empty array instead of defaultTeams
  private lockedTeams = new BehaviorSubject<LockedTeam[]>([]);
  lockedTeams$ = this.lockedTeams.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Load teams from Supabase when service initializes
    this.loadTeamsFromSupabase();
  }

  private async loadTeamsFromSupabase() {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get all work groups created today
      const { data: workGroups, error: workGroupsError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (workGroupsError) throw workGroupsError;
      if (!workGroups || workGroups.length === 0) {
        // If no teams in Supabase for today, use an empty array
        this.lockedTeams.next([]);
        return;
      }

      // For each work group, get its members and houses
      const teams: LockedTeam[] = [];
      
      for (const workGroup of workGroups) {
        // Get members (profiles) for this work group
        const { data: members, error: membersError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_profiles')
          .select('profile_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (membersError) throw membersError;
        
        // Get profiles details
        const staffMembers: Staff[] = [];
        if (members && members.length > 0) {
          const profileIds = members.map(m => m.profile_id);
          const { data: profiles, error: profilesError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', profileIds);
          
          if (profilesError) throw profilesError;
          
          if (profiles) {
            profiles.forEach(profile => {
              staffMembers.push({
                id: profile.id.toString(),
                name: `${profile.first_name} ${profile.last_name}`
              });
            });
          }
        }
        
        // Get houses for this work group
        const { data: workGroupHouses, error: housesError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_houses')
          .select('house_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (housesError) throw housesError;
        
        // Get house details
        const homes: Home[] = [];
        if (workGroupHouses && workGroupHouses.length > 0) {
          const houseIds = workGroupHouses.map(h => h.house_id);
          const { data: houses, error: housesDetailsError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('houses')
            .select('house_id, house_number, house_name')
            .in('house_id', houseIds);
          
          if (housesDetailsError) throw housesDetailsError;
          
          if (houses) {
            houses.forEach(house => {
              homes.push({
                number: house.house_number || house.house_name || '',
                status: '' // You might want to get this from house_availabilities
              });
            });
          }
        }
        
        // Create the team object
        teams.push({
          id: workGroup.work_group_id.toString(),
          name: `Team ${workGroup.work_group_id}`, // You might want to add a name field to work_groups
          members: staffMembers,
          homes: homes,
          isLocked: workGroup.is_locked || false
        });
      }
      
      // Check if the teams have changed before updating
      const currentTeams = this.lockedTeams.getValue();
      const teamsChanged = this.haveTeamsChanged(currentTeams, teams);
      
      if (teamsChanged) {
        this.lockedTeams.next(teams);
      }
    } catch (error) {
      console.error('Error loading teams from Supabase:', error);
      // Use an empty array instead of default teams on error
      this.lockedTeams.next([]);
    }
  }
  
  // Helper method to check if teams have changed
  private haveTeamsChanged(currentTeams: LockedTeam[], newTeams: LockedTeam[]): boolean {
    // Different number of teams means they've changed
    if (currentTeams.length !== newTeams.length) {
      return true;
    }
    
    // Check each team for changes
    for (let i = 0; i < newTeams.length; i++) {
      const newTeam = newTeams[i];
      const currentTeam = currentTeams.find(t => t.id === newTeam.id);
      
      // If a team doesn't exist in the current list, teams have changed
      if (!currentTeam) {
        return true;
      }
      
      // Check if isLocked status has changed
      if (currentTeam.isLocked !== newTeam.isLocked) {
        return true;
      }
      
      // Check if members have changed
      if (currentTeam.members.length !== newTeam.members.length) {
        return true;
      }
      
      // Check if homes have changed
      if (currentTeam.homes.length !== newTeam.homes.length) {
        return true;
      }
      
      // Could add more detailed comparison if needed
    }
    
    return false;
  }

  async saveLockedTeams(teams: LockedTeam[]) {
    // Check if teams have changed before updating local state
    const currentTeams = this.lockedTeams.getValue();
    const teamsChanged = this.haveTeamsChanged(currentTeams, teams);
    
    if (teamsChanged) {
      this.lockedTeams.next(teams);
    }
    
    // Save to Supabase
    try {
      for (const team of teams) {
        await this.saveTeamToSupabase(team);
      }
    } catch (error) {
      console.error('Error saving teams to Supabase:', error);
    }
  }

  async saveTeamToSupabase(team: LockedTeam) {
    const supabase = this.supabaseService.getClient();
    
    try {
      // Check if team already exists
      const { data: existingTeam, error: checkError } = await supabase
        .schema('porton')
        .from('work_groups')
        .select('*')
        .eq('work_group_id', parseInt(team.id))
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      // We'll use multiple operations instead of a transaction
      // since Supabase doesn't directly support client-side transactions
      
      if (existingTeam) {
        // Update existing team
        const { error: updateError } = await supabase
          .schema('porton')
          .from('work_groups')
          .update({
            is_locked: team.isLocked || false
          })
          .eq('work_group_id', parseInt(team.id));
        
        if (updateError) throw updateError;
      } else {
        // Insert new team
        const { data: newTeam, error: insertError } = await supabase
          .schema('porton')
          .from('work_groups')
          .insert({
            is_locked: team.isLocked || false
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Update the team id with the newly created id
        team.id = newTeam.work_group_id.toString();
      }
      
      // Clear existing members and houses
      const { error: clearMembersError } = await supabase
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', parseInt(team.id));
      
      if (clearMembersError) throw clearMembersError;
      
      const { error: clearHousesError } = await supabase
        .schema('porton')
        .from('work_group_houses')
        .delete()
        .eq('work_group_id', parseInt(team.id));
      
      if (clearHousesError) throw clearHousesError;
      
      // Add members
      if (team.members && team.members.length > 0) {
        const memberInserts = team.members.map(member => ({
          work_group_id: parseInt(team.id),
          profile_id: parseInt(member.id)
        }));
        
        const { error: insertMembersError } = await supabase
          .schema('porton')
          .from('work_group_profiles')
          .insert(memberInserts);
        
        if (insertMembersError) throw insertMembersError;
      }
      
      // Add houses
      if (team.homes && team.homes.length > 0) {
        // First, get house_ids from house_numbers
        const houseNumbers = team.homes.map(home => home.number).filter(Boolean);
        
        if (houseNumbers.length > 0) {
          const { data: houses, error: housesError } = await supabase
            .schema('porton')
            .from('houses')
            .select('house_id, house_number')
            .in('house_number', houseNumbers);
          
          if (housesError) throw housesError;
          
          if (houses && houses.length > 0) {
            const houseInserts = houses.map(house => ({
              work_group_id: parseInt(team.id),
              house_id: house.house_id
            }));
            
            const { error: insertHousesError } = await supabase
              .schema('porton')
              .from('work_group_houses')
              .insert(houseInserts);
            
            if (insertHousesError) throw insertHousesError;
          }
        }
      }
    } catch (error) {
      console.error(`Error saving team ${team.id} to Supabase:`, error);
      throw error;
    }
  }

  async createNewTeam(team: LockedTeam) {
    try {
      // Create a new work group
      const { data: newWorkGroup, error: createError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .insert({
          is_locked: false
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Create a new team with the generated ID
      const newTeam: LockedTeam = {
        id: newWorkGroup.work_group_id.toString(),
        name: team.name || `Team ${newWorkGroup.work_group_id}`,
        members: [],
        homes: [],
        isLocked: false
      };
      
      // Update local state - check if the team already exists to avoid duplicates
      const currentTeams = this.lockedTeams.getValue();
      const existingTeamIndex = currentTeams.findIndex(t => t.id === newTeam.id);
      
      if (existingTeamIndex >= 0) {
        // Team already exists, update it
        currentTeams[existingTeamIndex] = newTeam;
        this.lockedTeams.next([...currentTeams]);
      } else {
        // Team doesn't exist, add it
        this.lockedTeams.next([...currentTeams, newTeam]);
      }

      this.refreshTeams();
      
      return newTeam;
    } catch (error) {
      console.error('Error creating new team in Supabase:', error);
      throw error;
    }
  }

  getLockedTeams() {
    return this.lockedTeams.getValue();
  }

  resetToDefaultTeams() {
    this.saveLockedTeams(this.defaultTeams);
  }

  // Add a public method to refresh teams from Supabase
  async refreshTeams() {
    await this.loadTeamsFromSupabase();
  }

  // Add a method to load default teams if needed
  loadDefaultTeams() {
    this.lockedTeams.next(this.defaultTeams);
    return this.defaultTeams;
  }
} 