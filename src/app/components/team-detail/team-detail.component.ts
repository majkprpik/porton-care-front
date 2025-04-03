import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeamsService } from '../../services/teams.service';
import { LockedTeam, Staff, Task } from '../../interfaces/team.interface';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { MatIconModule } from '@angular/material/icon';
import { TeamTaskCardComponent } from '../team-task-card/team-task-card.component';
import { TaskService } from '../../services/task.service';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { DataService } from '../../services/data.service';
import { combineLatest } from 'rxjs';

enum TaskProgressType {
  ASSIGNED = 'Dodijeljeno',
  IN_PROGRESS = 'U progresu',
  COMPLETED = 'Završeno',
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule,
    TeamTaskCardComponent
  ],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss'],
})
export class TeamDetailComponent implements OnInit {
  team: LockedTeam | undefined;
  TaskProgressType = TaskProgressType; // Make enum available in template
  teams: any;
  taskTypes: any;
  progressTypes: any;
  houses: any;
  profiles: any;

  constructor(
    private route: ActivatedRoute,
    private teamsService: TeamsService,
    private supabaseService: SupabaseService,
    private taskService: TaskService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    combineLatest([
      this.dataService.taskTypes$,
      this.dataService.taskProgressTypes$,
      this.dataService.houses$,
      this.dataService.profiles$
    ]).subscribe(([taskTypes, progressTypes, houses, profiles]) => {
      this.taskTypes = taskTypes;
      this.progressTypes = progressTypes;
      this.houses = houses;
      this.profiles = profiles
    });

    this.teamsService.lockedTeams$.subscribe((teams) => {
      this.teams = teams;
      this.team = teams.find((t) => t.id === id);
      // Initialize tasks array if it doesn't exist
      if (this.team && !this.team.tasks) {
        this.team.tasks = [];
      }
      // Ensure all tasks have a progressType
      if (this.team?.tasks) {
        this.team.tasks.forEach((task) => {
          if (!task.progressType) {
            task.progressType = TaskProgressType.ASSIGNED;
          }
        });
      }
    });

    this.supabaseService.$workGroupTasksUpdate.subscribe(async res => {
      if(res && res.eventType == 'INSERT'){
        let task = await this.taskService.getTaskByTaskId(res.new.task_id);

        let team = this.teams.find((team: any) => team.id == res.new.work_group_id.toString());
        let houseNumber = this.houses.find((house: any) => house.house_id == task.house_id);
        let taskType = this.taskTypes.find((taskType: any) => taskType.task_type_id == task.task_type_id);
        let progressType = this.progressTypes.find((progressType: any) => progressType.task_progress_type_id == task.task_progress_type_id);

        let newTask: Task = {
          id: task.task_id.toString(),
          number: task.task_id.toString(),
          house: houseNumber.house_number,
          status: '',
          taskType: taskType.task_type_name,
          progressType: progressType.task_progress_type_name,
        }
        
        team.tasks.push(newTask);
      } else if(res && res.eventType == 'DELETE'){
        let team = this.teams.find((team: any) => team.id == res.old.work_group_id.toString());
        if(team){
          team.tasks = team.tasks.filter((task: any) => task.id != res.old.task_id);
        }
      }
    });

    this.supabaseService.$workGroupProfiles.subscribe(res => {
      if(res && res.eventType == 'INSERT'){
        let team = this.teams.find((team: any) => team.id == res.new.work_group_id.toString());
        let profile = this.profiles.find((profile: any) => profile.id == res.new.profile_id);

        let newStaff: Staff = {
          id: res.new.profile_id,
          name: profile.first_name + ' ' + profile.last_name,
        }

        team.members.push(newStaff);
      } else if(res && res.eventType == 'DELETE'){
        let team = this.teams.find((team: any) => team.id == res.old.work_group_id.toString());
        if(team){
          team.members = team.members.filter((member: any) => member.id == res.old.profile_id);
        }
      }
    });

    this.supabaseService.$tasksUpdate.subscribe(async res => {
      if(res){
        let taskProgress = await this.taskService.getTaskProgressTypeByTaskProgressId(res.new.task_progress_type_id);
        if(taskProgress.task_progress_type_name == 'Završeno'){
          for (let team of this.teams) {
            let task = team.tasks.find((task: any) => task.id == res.new.task_id);
            if (task) {
              task.progressType = 'Završeno';
            }
          }
        }
      }
    });
  }
}
