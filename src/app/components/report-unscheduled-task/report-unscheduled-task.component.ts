import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { TaskService } from '../../services/task.service';
import { WorkGroupService } from '../../services/work-group.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MobileHome } from '../../models/mobile-home.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-report-unscheduled-task',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
    MatOptionModule,
    ReactiveFormsModule
  ],
  templateUrl: './report-unscheduled-task.component.html',
  styleUrl: './report-unscheduled-task.component.scss'
})
export class ReportUnscheduledTaskComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  
  report = {
    description: '',
    location: '',
    taskType: ''
  };
  
  imageToUpload : any;
  capturedImage: string = '';
  displaySaveImageError: boolean = false;
  saveImageError: string = '';
  imagesToUpload: any[] = [];
  imagesToDisplay: any[] = [];
  openedImage: string = '';
  
  mobileHomes: MobileHome[] = [];
  filteredMobileHomes = [...this.mobileHomes];
  locationFilterCtrl = new FormControl();

  taskTypes: any[] = [];
  filteredTaskTypes = [...this.taskTypes];
  taskTypesFilterCtrl = new FormControl();

  constructor(
    private location: Location,
    private router: Router,
    private mobileHomesService: MobileHomesService,
    private taskService: TaskService,
    private workGroupService: WorkGroupService
  ) {}

  ngOnInit(){
    // Real implementation for later:
    this.getMobileHomesForDate();
    this.filterLocations();
    
    this.getAllTaskTypes();
    this.filterTaskTypes();
  }

  async onSubmit() {
    if (this.report.description && this.report.location && this.report.taskType) {
      let createdTask = await this.createTaskForHouse();
      console.log(this.report);
      this.router.navigate(['/']);
    }
  }

  getMobileHomesForDate(){
    const today = new Date().toISOString().split('T')[0];

    this.mobileHomesService.getHomesForDate(today)
    .then(homes => {
      console.log('Fetched homes:', homes);
      this.mobileHomes = homes;
      this.filteredMobileHomes = [...this.mobileHomes];
    });
  }

  filterLocations(){
    this.locationFilterCtrl.valueChanges.subscribe((search: any) => {
      if (!search) {
        this.filteredMobileHomes = [...this.mobileHomes];
        return;
      }
      this.filteredMobileHomes = this.mobileHomes.filter((home) =>
        home.housename.toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  async createTaskForHouse(){
    let createdTask = await this.taskService.createTaskForHouse(this.report.location, this.report.description, this.report.taskType);
    let createdWorkGroup = await this.workGroupService.createWorkGroup();
    let createdWorkGroupTask = await this.workGroupService.createWorkGroupTask(createdWorkGroup.work_group_id, createdTask.task_id);

    if(createdTask && createdWorkGroup && createdWorkGroupTask){
      return createdTask;
    }
  }

  async getAllTaskTypes(){
    this.taskService.getAllTaskTypes()
    .then(taskTypes => {
      console.log('Fetched task types:', taskTypes);
      this.taskTypes = taskTypes.filter(taskType => taskType.task_type_name != 'Punjenje' && taskType.task_type_name != 'Popravak');
      this.filteredTaskTypes = [...this.taskTypes];
    });
  }

  filterTaskTypes(){
    this.taskTypesFilterCtrl.valueChanges.subscribe((search: any) => {
      if (!search) {
        this.filteredTaskTypes = [...this.taskTypes];
        return;
      }
      this.filteredTaskTypes = this.taskTypes.filter((taskType) =>
        taskType.task_type_name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  goBack() {
    this.location.back();
  }
}
