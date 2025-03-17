import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LockedTeam, Staff, Home, Task } from '../interfaces/team.interface';
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
      ],
      tasks: [
        { 
          id: '101', 
          number: '110', 
          status: 'yellow',
          house: '110',
          taskType: 'Cleaning',
          progressType: 'Partially Complete'
        },
        { 
          id: '102', 
          number: '106', 
          status: 'green',
          house: '106',
          taskType: 'Maintenance',
          progressType: 'Completed'
        }
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
      ],
      tasks: [
        { 
          id: '201', 
          number: '109', 
          status: 'green',
          house: '109',
          taskType: 'Cleaning',
          progressType: 'Completed'
        },
        { 
          id: '202', 
          number: '108', 
          status: 'red',
          house: '108',
          taskType: 'Repair',
          progressType: 'Not Started'
        }
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
      ],
      tasks: [
        { 
          id: '301', 
          number: '105', 
          status: 'yellow',
          house: '105',
          taskType: 'Cleaning',
          progressType: 'Partially Complete'
        },
        { 
          id: '302', 
          number: '103', 
          status: 'red',
          house: '103',
          taskType: 'Inspection',
          progressType: 'Not Started'
        },
        { 
          id: '303', 
          number: '102', 
          status: 'yellow',
          house: '102',
          taskType: 'Cleaning',
          progressType: 'Partially Complete'
        }
      ]
    },
    {
      id: '4',
      name: 'Team 4',
      members: [
        { id: '5', name: 'Petra S.' },
        { id: '6', name: 'Josip K.' }
      ],
      homes: [
        { number: '101', status: 'green' },
        { number: '104', status: 'red' }
      ],
      tasks: [
        { 
          id: '401', 
          number: '101', 
          status: 'green',
          house: '101',
          taskType: 'Cleaning',
          progressType: 'Completed'
        },
        { 
          id: '402', 
          number: '104', 
          status: 'red',
          house: '104',
          taskType: 'Repair',
          progressType: 'Not Started'
        }
      ]
    },
    {
      id: '5',
      name: 'Team 5',
      members: [
        { id: '7', name: 'Maja B.' }
      ],
      homes: [
        { number: '107', status: 'yellow' }
      ],
      tasks: [
        { 
          id: '501', 
          number: '107', 
          status: 'yellow',
          house: '107',
          taskType: 'Cleaning',
          progressType: 'Partially Complete'
        }
      ]
    },
    {
      id: '6',
      name: 'Team 6',
      members: [
        { id: '8', name: 'Tomislav H.' },
        { id: '9', name: 'Nina P.' }
      ],
      homes: [],
      tasks: []
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

      // For each work group, get its members and tasks
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
        
        // Get tasks for this work group
        const { data: workGroupTasks, error: tasksError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_tasks')
          .select('task_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (tasksError) throw tasksError;
        
        // Get task details
        const tasks: Task[] = [];
        if (workGroupTasks && workGroupTasks.length > 0) {
          const taskIds = workGroupTasks.map(t => t.task_id);
          
          // Get task details with task_type_id and task_progress_type_id
          const { data: taskDetails, error: taskDetailsError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('tasks')
            .select('task_id, task_type_id, task_progress_type_id, house_id')
            .in('task_id', taskIds);
          
          if (taskDetailsError) throw taskDetailsError;
          
          if (taskDetails && taskDetails.length > 0) {
            // Get all task types
            const taskTypeIds = taskDetails.map(t => t.task_type_id).filter(Boolean);
            let taskTypes: Record<string, string> = {};
            
            if (taskTypeIds.length > 0) {
              const { data: taskTypeData, error: taskTypeError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('task_types')
                .select('task_type_id, task_type_name')
                .in('task_type_id', taskTypeIds);
              
              if (taskTypeError) throw taskTypeError;
              
              if (taskTypeData) {
                // Create a map of task type id to name
                taskTypes = taskTypeData.reduce((acc: Record<string, string>, type) => {
                  acc[type.task_type_id] = type.task_type_name;
                  return acc;
                }, {});
              }
            }
            
            // Get all progress types
            const progressTypeIds = taskDetails.map(t => t.task_progress_type_id).filter(Boolean);
            let progressTypes: Record<string, string> = {};
            
            if (progressTypeIds.length > 0) {
              const { data: progressTypeData, error: progressTypeError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('task_progress_types')
                .select('task_progress_type_id, task_progress_type_name')
                .in('task_progress_type_id', progressTypeIds);
              
              if (progressTypeError) throw progressTypeError;
              
              if (progressTypeData) {
                // Create a map of progress type id to name
                progressTypes = progressTypeData.reduce((acc: Record<string, string>, type) => {
                  acc[type.task_progress_type_id] = type.task_progress_type_name;
                  return acc;
                }, {});
              }
            }
            
            // Get house details for tasks
            const houseIds = taskDetails.map(t => t.house_id).filter(Boolean);
            let houses: Record<string, string> = {};
            
            if (houseIds.length > 0) {
              const { data: houseData, error: houseError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('houses')
                .select('house_id, house_number, house_name')
                .in('house_id', houseIds);
              
              if (houseError) throw houseError;
              
              if (houseData) {
                // Create a map of house id to house number/name
                houses = houseData.reduce((acc: Record<string, string>, house) => {
                  acc[house.house_id] = house.house_number || house.house_name || house.house_id.toString();
                  return acc;
                }, {});
              }
            }
            
            // Map task details with type and progress information
            taskDetails.forEach(task => {
              // Determine status based on progress type
              let status = this.getStatusFromProgressType(task.task_progress_type_id, progressTypes);
              
              tasks.push({
                id: task.task_id.toString(),
                number: task.task_id.toString(),
                status: status,
                house: houses[task.house_id] || task.task_id.toString(),
                taskType: taskTypes[task.task_type_id] || 'Cleaning',
                progressType: progressTypes[task.task_progress_type_id] || this.getProgressTypeFromStatus(status)
              });
            });
          }
        }
        
        // For backward compatibility, also get houses
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
          tasks: tasks,
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
      
      // Check if homes have changed (if both teams have homes)
      if (currentTeam.homes && newTeam.homes && 
          currentTeam.homes.length !== newTeam.homes.length) {
        return true;
      }
      
      // Check if tasks have changed (if both teams have tasks)
      if (currentTeam.tasks && newTeam.tasks && 
          currentTeam.tasks.length !== newTeam.tasks.length) {
        return true;
      }
      
      // Check if one has homes and the other has tasks
      if ((currentTeam.homes && !newTeam.homes) || 
          (!currentTeam.homes && newTeam.homes) ||
          (currentTeam.tasks && !newTeam.tasks) ||
          (!currentTeam.tasks && newTeam.tasks)) {
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
      
      // Clear existing members
      const { error: clearMembersError } = await supabase
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', parseInt(team.id));
      
      if (clearMembersError) throw clearMembersError;
      
      // Clear existing tasks
      const { error: clearTasksError } = await supabase
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', parseInt(team.id));
      
      if (clearTasksError) throw clearTasksError;
      
      // Add members to work_group_profiles
      if (team.members && team.members.length > 0) {
        const memberInserts = team.members.map(member => ({
          work_group_id: parseInt(team.id),
          profile_id: member.id
        }));
        
        const { error: insertMembersError } = await supabase
          .schema('porton')
          .from('work_group_profiles')
          .insert(memberInserts);
        
        if (insertMembersError) throw insertMembersError;
      }
      
      // Add tasks to work_group_tasks
      if (team.tasks && team.tasks.length > 0) {
        // First, we need to get task_type_id and task_progress_type_id for each task
        for (const task of team.tasks) {
          // Get or create task type
          let taskTypeId = null;
          if (task.taskType) {
            const { data: existingTaskType, error: taskTypeError } = await supabase
              .schema('porton')
              .from('task_types')
              .select('task_type_id')
              .ilike('task_type_name', task.taskType)
              .limit(1);
            
            if (taskTypeError) throw taskTypeError;
            
            if (existingTaskType && existingTaskType.length > 0) {
              taskTypeId = existingTaskType[0].task_type_id;
            } else {
              // Create new task type
              const { data: newTaskType, error: createTaskTypeError } = await supabase
                .schema('porton')
                .from('task_types')
                .insert({ task_type_name: task.taskType })
                .select()
                .single();
              
              if (createTaskTypeError) throw createTaskTypeError;
              
              if (newTaskType) {
                taskTypeId = newTaskType.task_type_id;
              }
            }
          }
          
          // Get or create progress type
          let progressTypeId = null;
          if (task.progressType) {
            const { data: existingProgressType, error: progressTypeError } = await supabase
              .schema('porton')
              .from('task_progress_types')
              .select('task_progress_type_id')
              .ilike('task_progress_type_name', task.progressType)
              .limit(1);
            
            if (progressTypeError) throw progressTypeError;
            
            if (existingProgressType && existingProgressType.length > 0) {
              progressTypeId = existingProgressType[0].task_progress_type_id;
            } else {
              // Create new progress type
              const { data: newProgressType, error: createProgressTypeError } = await supabase
                .schema('porton')
                .from('task_progress_types')
                .insert({ task_progress_type_name: task.progressType })
                .select()
                .single();
              
              if (createProgressTypeError) throw createProgressTypeError;
              
              if (newProgressType) {
                progressTypeId = newProgressType.task_progress_type_id;
              }
            }
          }
          
          // Get house_id from house number
          let houseId = null;
          if (task.house) {
            const { data: existingHouse, error: houseError } = await supabase
              .schema('porton')
              .from('houses')
              .select('house_id')
              .or(`house_number.eq.${task.house},house_name.eq.${task.house}`)
              .limit(1);
            
            if (houseError) throw houseError;
            
            if (existingHouse && existingHouse.length > 0) {
              houseId = existingHouse[0].house_id;
            }
          }
          
          // Check if task exists
          const taskId = parseInt(task.id);
          if (!isNaN(taskId)) {
            const { data: existingTask, error: taskError } = await supabase
              .schema('porton')
              .from('tasks')
              .select('*')
              .eq('task_id', taskId)
              .single();
            
            if (taskError && taskError.code !== 'PGRST116') throw taskError;
            
            if (existingTask) {
              // Update existing task
              const { error: updateTaskError } = await supabase
                .schema('porton')
                .from('tasks')
                .update({
                  task_type_id: existingTask.taskTypeId,
                  task_progress_type_id: existingTask.progressTypeId,
                  house_id: existingTask.houseId
                })
                .eq('task_id', taskId);
              
              if (updateTaskError) throw updateTaskError;
            } else {
              // Create new task
              const { error: createTaskError } = await supabase
                .schema('porton')
                .from('tasks')
                .insert({
                  task_id: taskId,
                  task_type_id: existingTask.taskTypeId,
                  task_progress_type_id: existingTask.progressTypeId,
                  house_id: existingTask.houseId
                });
              
              if (createTaskError) throw createTaskError;
            }
          }
        }
        
        // Now add tasks to work_group_tasks
        const taskInserts = team.tasks.map(task => ({
          work_group_id: parseInt(team.id),
          task_id: parseInt(task.id)
        }));
        
        const { error: insertTasksError } = await supabase
          .schema('porton')
          .from('work_group_tasks')
          .insert(taskInserts);
        
        if (insertTasksError) throw insertTasksError;
      }
      // For backward compatibility, also handle homes if tasks are not provided
      else if (team.homes && team.homes.length > 0) {
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
              house_id: house.house_id,
              // date_assigned: new Date().toISOString()
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

  private getProgressTypeFromStatus(status: string): string {
    // Convert status color to a readable progress type
    switch (status) {
      case 'red':
        return 'Not Started';
      case 'orange':
        return 'In Progress';
      case 'yellow':
        return 'Partially Complete';
      case 'green':
        return 'Completed';
      default:
        // For numeric statuses, use a default based on the value
        const statusNum = parseInt(status);
        if (!isNaN(statusNum)) {
          if (statusNum % 4 === 0) return 'Completed';
          if (statusNum % 4 === 1) return 'Not Started';
          if (statusNum % 4 === 2) return 'In Progress';
          if (statusNum % 4 === 3) return 'Partially Complete';
        }
        return 'Unknown';
    }
  }

  private getStatusFromProgressType(progressTypeId: any, progressTypes: Record<string, string>): string {
    if (!progressTypeId) return 'red'; // Default to 'Not Started' if no progress type
    
    const progressTypeName = progressTypes[progressTypeId];
    
    if (!progressTypeName) return 'red';
    
    // Map progress type names to status colors
    switch (progressTypeName.toLowerCase()) {
      case 'not started':
        return 'red';
      case 'in progress':
        return 'orange';
      case 'partially complete':
      case 'partially completed':
        return 'yellow';
      case 'completed':
      case 'complete':
        return 'green';
      default:
        // If we can't determine the status, use a numeric approach
        const progressId = parseInt(progressTypeId);
        if (!isNaN(progressId)) {
          if (progressId % 4 === 0) return 'green';
          if (progressId % 4 === 1) return 'red';
          if (progressId % 4 === 2) return 'orange';
          if (progressId % 4 === 3) return 'yellow';
        }
        return 'red';
    }
  }
} 