import { WorkGroupTask } from './../../services/data.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { CleaningStaffService } from '../../services/cleaning-staff.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CleaningPerson } from '../../models/cleaning-person.interface';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Staff, Task } from '../../interfaces/team.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { TaskService } from '../../services/task.service';
import { TasksFilterPipe } from '../../pipes/tasks-filter.pipe';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { StaffRolesPipe } from '../../pipes/staff-roles.pipe';
import { MatDialog } from '@angular/material/dialog';
import { DeleteTeamModalComponent } from '../delete-team-modal/delete-team-modal.component';
import { WorkGroupService } from '../../services/work-group.service';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { DataService } from '../../services/data.service';
import { TasksSortPipe } from '../../pipes/tasks-sort.pipe';

// Create a new interface for task cards
interface TaskCard {
  id: string;
  houseId: number;
  houseName: string;
  houseNumber: string;
  taskId: number;
  taskType: string;
  taskTypeName: string;
  taskProgressType: string;
  startTime: string;
  endTime: string | null;
  status: string;
  mobileHome: MobileHome; // Reference to the parent mobile home
  originalTaskListId: string; // Add this property
  index?: number | null; // Add this property
}

interface Team {
  id: string;
  name: string;
  members: CleaningPerson[];
  tasks: TaskCard[]; // Changed from homes to tasks
  isLocked?: boolean;
}

@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [
    DragDropModule, 
    CommonModule,
    TasksFilterPipe,
    MatIcon,
    FormsModule,       
    MatFormFieldModule,
    MatSelectModule,   
    MatOptionModule,
    StaffRolesPipe,
    TasksSortPipe
  ],
  templateUrl: './daily-sheet.component.html',
  styleUrls: ['./daily-sheet.component.scss']
})
export class DailySheetComponent implements OnInit, OnDestroy {
  taskCards: TaskCard[] = [];
  cleaningStaff: CleaningPerson[] = [];
  assignedTeams: Team[] = [];
  lockedTeamIds: string[] = []; // Track which teams are locked
  private teamCounter = 1;
  private teamsSubscription: Subscription | null = null;
  private loadedTeamIds: Set<string> = new Set(); // Track which team IDs have been loaded

  taskTypes: any[] = [];
  filteredTaskTypes: any[] = [];
  selectedTaskTypes: any[] = [];
  showTaskTypesFilter = false;
  sortAscendingOrDescending = '';
  expandedSections: { [key: string]: boolean } = {};
  teamStatus: { [key: string]: 'created' | 'published' | 'edited' } = {};
  expandedStaffWindows: { [key: string]: boolean } = {};
  listGridView: string = 'list';
  roleIcon: Record<string, string> = {
    'Cleaner': 'cleaning_services',
    'cleaner': 'cleaning_services',
    'Maintenance': 'build',
    'maintenance': 'build',
  };
  taskTypeIcon: Record<string, string> = {
    'Čišćenje kućice': 'cleaning_services',
    'Čišćenje terase': 'deck',
    'Mijenjanje ručnika': 'dry_cleaning',
    'Mijenjanje posteljine': 'bed',
    'Maintenance': 'build',
    'Inspection': 'visibility',
    'Checkout': 'exit_to_app',
    'Checkin': 'input',
  }
  taskProgressTypes: any;
  workGroupTasks: any;

  // Computed property to get available staff (not assigned to any team)
  get availableStaff(): CleaningPerson[] {
    // Get all staff IDs that are already assigned to teams
    const assignedStaffIds = new Set<string>();
    this.assignedTeams.forEach(team => {
      team.members.forEach(member => {
        assignedStaffIds.add(member.id);
      });
    });
    
    // Return only staff members that are not in the assigned set
    return this.cleaningStaff.filter(staff => !assignedStaffIds.has(staff.id));
  }

  constructor(
    private mobileHomesService: MobileHomesService,
    private cleaningStaffService: CleaningStaffService,
    private teamsService: TeamsService,
    private taskService: TaskService,
    private dialog: MatDialog,
    private workGroupService: WorkGroupService,
    private supabaseService: SupabaseService,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    this.dataService.workGroupTasks$.subscribe((workGroupTasks) => {
      this.workGroupTasks = workGroupTasks;
    });

    this.dataService.taskProgressTypes$.subscribe((progressTypes) => {
      this.taskProgressTypes = progressTypes;
    });

    await this.loadTodayData();
    this.loadExistingTeams();
    this.getAllTaskTypes();
    this.availableStaff;

    this.supabaseService.$tasksUpdate.subscribe(res => {
      if(res && res.eventType == 'UPDATE'){
        let task;

        for (let team of this.assignedTeams) {
          task = team.tasks.find((task: any) => task.taskId == res.new.task_id);
          if (task) {
            break;
          }
        }

        if(task){
          let taskProgressType = this.taskProgressTypes.find((taskType: any) => taskType.task_progress_type_id == res.new.task_progress_type_id);
          task.taskProgressType = taskProgressType.task_progress_type_name;
        }
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
    }
  }

  async getAllTaskTypes(){
    this.taskService.getAllTaskTypes()
    .then(taskTypes => {
      this.taskTypes = taskTypes.filter(taskType => taskType.task_type_name != 'Punjenje' && taskType.task_type_name != 'Popravak');
      this.filteredTaskTypes = [...this.taskTypes];
      this.filteredTaskTypes.forEach(taskType => {
        this.selectedTaskTypes.push(taskType.task_type_name);
      });
    });
  }

  onFilterChange(event: any, taskTypeName: string){
    if (event.target.checked) {
      this.selectedTaskTypes.push(taskTypeName);
    } else {
      this.selectedTaskTypes = this.selectedTaskTypes.filter(type => type !== taskTypeName);
    }
  }

  toggleTaskTypesFilter(){
    this.showTaskTypesFilter = !this.showTaskTypesFilter;  
  }

  toggleExpandMinimize(taskTypeName: string) {
    this.expandedSections[taskTypeName] = !this.expandedSections[taskTypeName];
  }

  toggleExpandCollapseStaffWindow(role: string) {
    this.expandedStaffWindows[role] = !this.expandedStaffWindows[role];
  }


  toggleListGridView(view: string){
    this.listGridView = view;
  }

  private async loadTodayData() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const homes = await this.mobileHomesService.getHomesForDate(today);
      // Filter homes with tasks
      const homesWithTasks = homes.filter(home => 
        home.housetasks && home.housetasks.length > 0
      );
      
      // Create task cards for each task in each home
      this.taskCards = [];
      homesWithTasks.forEach(home => {
        if (home.housetasks) {
          home.housetasks.forEach((task, index) => {
            if(task.taskTypeName != 'Punjenje' && task.taskTypeName != 'Popravak'){
              let workGroupTask = this.workGroupTasks.find((workGroupTask: any) => workGroupTask.task_id == task.taskId);

              this.taskCards.push({
                id: `${home.house_id}-${task.taskId}`,
                houseId: home.house_id,
                houseName: home.housename || '',
                houseNumber: home.number || home.housename || '',
                taskId: task.taskId,
                taskType: task.taskTypeId.toString(),
                taskTypeName: task.taskTypeName,
                taskProgressType: task.taskProgressTypeName,
                startTime: task.startTime,
                endTime: task.endTime,
                status: home.status?.toString() || home.availabilityname || '',
                mobileHome: home,
                originalTaskListId: `tasks-list-${task.taskTypeName}`, // Set the original task list ID
                index: workGroupTask ? workGroupTask.index : null // Set the index if available
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error loading mobile homes:', error);
      this.taskCards = [];
    }
  
    // Use the new getCleaningStaff method with fallback to mock data
    this.cleaningStaffService.getCleaningStaff()
      .subscribe(
        staff => this.cleaningStaff = staff,
        error => {
          console.error('Error loading cleaning staff:', error);
          // Fallback to mock data if there's an error
          this.cleaningStaffService.getMockCleaningStaff()
            .subscribe(mockStaff => this.cleaningStaff = mockStaff);
        }
      );
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
            tasks: [], // Changed from homes to tasks
            isLocked: lockedTeam.isLocked
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
                  firstName: member.name,
                  lastName: '',
                  role: 'cleaner',
                  available: true
                });
              }
            }
          }
          
          // First try to convert Task to TaskCard if tasks are available
          if (lockedTeam.tasks && lockedTeam.tasks.length > 0) {
            for (const task of lockedTeam.tasks) {
              // Look for task cards with matching task ID
              const matchingTask = this.taskCards.find(t => t.taskId.toString() === task.id);
              
              if (matchingTask) {
                // Add the matching task to the team
                team.tasks.push(matchingTask);
                
                // Remove this task from the available task cards
                this.taskCards = this.taskCards.filter(t => t.id !== matchingTask.id);
              }
            }
          }
          // Fallback to homes if no tasks are available (backward compatibility)
          else if (lockedTeam.homes && lockedTeam.homes.length > 0) {
            // Convert Home to TaskCard
            for (const home of lockedTeam.homes) {
              // Look for task cards with matching house number
              const matchingTasks = this.taskCards.filter(task => 
                task.houseNumber === home.number
              );
              
              if (matchingTasks.length > 0) {
                // Add all matching tasks to the team
                team.tasks.push(...matchingTasks);
                
                // Remove these tasks from the available task cards
                this.taskCards = this.taskCards.filter(task => 
                  !matchingTasks.some(mt => mt.id === task.id)
                );
              }
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
        this.lockedTeamIds.forEach(teamId => {
          this.teamStatus[teamId] = 'published';
        });
        
        // Force update of availableStaff by triggering change detection
        this.cleaningStaff = [...this.cleaningStaff];
      });
    } catch (error) {
      console.error('Error loading existing teams:', error);
    }
  }

  getTaskIndicator(task: TaskCard): string {
    // Vraća kraticu za vrstu zadatka
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('terase')) {
      return 'deck'; // Čišćenje terase
    }
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('kućice')) {
      return 'cleaning_services'; // Čišćenje kućice
    }
    if (task.taskTypeName.toLowerCase().includes('punjenje')) {
      return 'P'; // Punjenje
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('ručnika')) {
      return 'dry_cleaning'; // Mijenjanje ručnika
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('posteljine')) {
      return 'bed'; // Mijenjanje ručnika
    }
    if (task.taskTypeName.toLowerCase().includes('maintenance')) {
      return 'M'; // Maintenance
    }
    if (task.taskTypeName.toLowerCase().includes('inspection')) {
      return 'I'; // Inspection
    }
    if (task.taskTypeName.toLowerCase().includes('checkout')) { 
      return 'CO'; // Checkout
    }
    if (task.taskTypeName.toLowerCase().includes('checkin')) {
      return 'CI'; // Checkin
    }
    // Ako ne možemo prepoznati tip zadatka, vraćamo prva dva slova
    return task.taskTypeName.substring(0, 2);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    const containerId = event.container.id;
    const teamId = this.getTeamIdFromContainerId(containerId);

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      if(teamId && this.isTeamLocked(teamId)){
        this.teamStatus[teamId] = 'edited'; 
      }
    } else {
      const prevContainerId = event.previousContainer.id;
      const prevTeamId = this.getTeamIdFromContainerId(prevContainerId);

      if (prevTeamId && this.isTeamLocked(prevTeamId)) {
        this.teamStatus[prevTeamId] = 'edited'; 
      }

      if(teamId && this.isTeamLocked(teamId)){
        this.teamStatus[teamId] = 'edited'; 
      }

      // Handle the transfer
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const droppedTask = event.container.data[event.currentIndex];

      // Remove the task from the taskCards array if it was moved to a team
      if (teamId && containerId.includes('team-') && containerId.includes('-tasks')) {
        this.taskCards = this.taskCards.filter(task => task.id !== droppedTask.id);
      }

      // Add the task back to the taskCards array if it was moved back to the main task list
      if (!teamId && (containerId === 'tasks-list' || containerId === droppedTask.originalTaskListId)) {
        this.taskCards.push(droppedTask);
      }

      // Check if the item is a task and was dropped into a locked team
      const isTaskContainer = containerId && containerId.includes('-tasks');
      const isTeamLocked = teamId && this.isTeamLocked(teamId);

      // if (isTaskContainer && teamId) {
      //   // If the task was dropped into a locked team, update its progress type to "Dodijeljeno"
      //   if (isTeamLocked && droppedTask && droppedTask.taskId) {
      //     this.mobileHomesService.updateTaskStatus(droppedTask.taskId, 'Dodijeljeno')
      //       .then(() => {
      //         // Update the local task card's progress type
      //         droppedTask.taskProgressType = 'Dodijeljeno';
      //         console.log(`Task ${droppedTask.taskId} marked as "Dodijeljeno"`);
      //       })
      //       .catch(error => {
      //         console.error(`Error updating task ${droppedTask.taskId} status:`, error);
      //       });
      //   }
      // }

      // If the task was dropped in an invalid container, revert it back to its original position
      if (!teamId && containerId !== 'tasks-list' && containerId !== droppedTask.originalTaskListId && !containerId.includes('staff-list')) {
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
      }

      // Force update of availableStaff by triggering change detection
      this.cleaningStaff = [...this.cleaningStaff];
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
      tasks: [], // Changed from homes to tasks
      isLocked: false
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
          tasks: [],    // Changed from homes to tasks
          isLocked: false
        };
        
        // Add to our tracking set to prevent duplicates when the subscription updates
        this.loadedTeamIds.add(savedTeam.id);
        
        // Update the team counter
        this.teamCounter = Math.max(this.teamCounter, parseInt(savedTeam.id) + 1);
        
        // Force update of availableStaff by triggering change detection
        this.cleaningStaff = [...this.cleaningStaff];
        
        // Refresh teams from Supabase to ensure consistency
        // We don't need to await this as it will update via the subscription
        this.teamsService.refreshTeams();
      } else {
        // Fallback to local-only if Supabase save failed
        this.assignedTeams.push(newComponentTeam);
        console.warn('Team was not saved to Supabase, using local version only');
        this.teamCounter++;
        
        // Force update of availableStaff by triggering change detection
        this.cleaningStaff = [...this.cleaningStaff];
      }
    } catch (error) {
      // Handle error and fallback to local-only
      console.error('Error creating team in Supabase:', error);
      this.assignedTeams.push(newComponentTeam);
      console.warn('Team was not saved to Supabase due to an error, using local version only');
      this.teamCounter++;
      
      // Force update of availableStaff by triggering change detection
      // this.cleaningStaff = [...this.cleaningStaff];
    }
  }

  getConnectedLists(teamId: string): string[] {
    return ['staff-list', 'homes-list', ...this.assignedTeams.map(t => `team-${t.id}`)];
  }

  getTeamDropLists(): string[] {
    return this.assignedTeams.map(t => `team-${t.id}-members`);
  }

  getTeamTaskDropLists(): string[] {
    return ['tasks-list', ...this.assignedTeams.map(t => `team-${t.id}-tasks`)];
  }

  getTeamMemberDropLists(): string[] {
    let staffRoles1 = this.getStaffRoles();
    staffRoles1 = staffRoles1.map(role => `staff-list-${role.charAt(0).toUpperCase()}${role.slice(1)}`);
    return [...staffRoles1, ...this.assignedTeams.map(team => `team-${team.id}-members`)];
  }

  getStaffDropLists(role: string): string[] {
    const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
    return ['staff-list-' + capitalizedRole, ...this.assignedTeams.map(t => `team-${t.id}-members`)];
  }

  getStaffRoles(): string[] {
    const roles = new Set<string>();
    this.cleaningStaff.forEach(staff => {
      if (staff.role) { 
        const capitalizedRole = staff.role.charAt(0).toUpperCase() + staff.role.slice(1);
        roles.add(capitalizedRole);
      }
    });
    return Array.from(roles);
  }

  async publishTeams() {
    // Create teams with tasks for Supabase
    const teamsToPublish: LockedTeam[] = this.assignedTeams.map(team => {
      // Convert CleaningPerson[] to Staff[]
      const staffMembers: Staff[] = team.members.map(member => ({
        id: member.id,
        name: member.firstName
      }));
      
      // Create task objects for each task in the team
      const tasks: Task[] = team.tasks.map(task => ({
        id: task.taskId.toString(),
        number: task.houseNumber,
        status: task.status,
        house: task.houseNumber,
        taskType: task.taskTypeName,
        progressType: task.taskProgressType
      }));
      
      return {
        id: team.id,
        name: team.name,
        members: staffMembers,
        tasks: tasks, // Send tasks instead of homes
        isLocked: true // Set to true to lock the team
      };
    });
    
    try {
      // Save to Supabase
      await this.teamsService.saveLockedTeams(teamsToPublish);
      
      // Update local locked team IDs
      this.lockedTeamIds = teamsToPublish.map(team => team.id);
      
      // Update local team isLocked status
      this.assignedTeams.forEach(team => {
        if (this.lockedTeamIds.includes(team.id)) {
          team.isLocked = true;
        }
      });
      
      // Process all tasks in the published teams
      const updateTaskPromises: Promise<void>[] = [];
      
      for (const team of teamsToPublish) {
        // Get all tasks in the team
        const teamObj = this.assignedTeams.find(t => t.id === team.id);
        if (teamObj && teamObj.tasks) {
          // Update each task's progress type to "Dodijeljeno"
          for (const task of teamObj.tasks) {
            // Update task progress type in Supabase
            if(task.taskProgressType == 'Nije dodijeljeno'){
              const updatePromise = this.mobileHomesService.updateTaskStatus(task.taskId, 'Dodijeljeno')
                .then(() => {
                  // Update local task card's progress type
                  task.taskProgressType = 'Dodijeljeno';
                })
                .catch(error => {
                  console.error(`Error updating task ${task.taskId} status:`, error);
                });
              
              updateTaskPromises.push(updatePromise);
            }
          }
        }
      }
      
      // Wait for all task updates to complete
      await Promise.all(updateTaskPromises);
      
      // Lock all houses in the teams (update house_availabilities)
      for (const team of teamsToPublish) {
        // Get unique house IDs from the tasks
        const uniqueHouseIds = new Set<number>();
        
        if (team.tasks) {
          team.tasks.forEach(task => {
            const houseTask = this.taskCards.find(t => t.taskId === parseInt(task.id));
            if (houseTask) {
              uniqueHouseIds.add(houseTask.houseId);
            }
          });

          this.teamStatus[team.id] = 'published';
          
          // Lock each house
          for (const houseId of uniqueHouseIds) {
            await this.mobileHomesService.lockHouse(houseId);
          }
        }
      }
      
      // Force update of availableStaff by triggering change detection
      this.cleaningStaff = [...this.cleaningStaff];
      
      // Refresh teams from Supabase to ensure consistency
      await this.teamsService.refreshTeams();
      
      // Show success message
      // alert('Successfully published teams and locked all houses!');
    } catch (error) {
      console.error('Error publishing teams:', error);
      alert('Error publishing teams. Please try again.');
    }
  }

  // Add a method to check if a team is locked
  isTeamLocked(teamId: string): boolean {
    // Check if the team ID is in the lockedTeamIds array
    if (this.lockedTeamIds.includes(teamId)) {
      return true;
    }
    
    // Also check if the team has the isLocked property set to true
    const team = this.assignedTeams.find(t => t.id === teamId);
    if (team && (team as any).isLocked === true) {
      return true;
    }
    
    return false;
  }

  getAllDropLists(): string[] {
    const taskLists = this.filteredTaskTypes.map(taskType => `tasks-list-${taskType.task_type_name}`);
    const teamTaskLists = this.assignedTeams.map(team => `team-${team.id}-tasks`);
    return ['tasks-list', ...taskLists, ...teamTaskLists];
  }

  deleteTeam(teamId: string){
    let dialogRef = this.dialog.open(DeleteTeamModalComponent, {
      height: '180px',
      width: '400px',
      data: { teamId: teamId }
    })

    dialogRef.afterClosed().subscribe(async result => {
      if(result){
        let deleteResult = await this.workGroupService.deleteWorkGroup(teamId);
        if(deleteResult){
          window.location.reload();
        }
      }
    });
  }
}