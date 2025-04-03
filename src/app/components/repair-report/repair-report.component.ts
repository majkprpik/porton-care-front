import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { TaskService } from '../../services/task.service';
import { WorkGroupService } from '../../services/work-group.service';
import { HelperService } from '../../services/helper.service';
import { StorageService } from '../../services/storage.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-repair-report',
  standalone: true,
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
  templateUrl: './repair-report.component.html',
  styleUrls: ['./repair-report.component.scss']
})
export class RepairReportComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  mobileHomes: MobileHome[] = [];
  report = {
    description: '',
    location: ''
  };
  imageToUpload : any;
  capturedImage: string = '';
  displaySaveImageError: boolean = false;
  saveImageError: string = '';
  imagesToUpload: any[] = [];
  imagesToDisplay: any[] = [];
  openedImage: string = '';
  filteredMobileHomes = [...this.mobileHomes];
  locationFilterCtrl = new FormControl();

  constructor(
    private location: Location,
    private router: Router,
    private mobileHomesService: MobileHomesService,
    private taskService: TaskService,
    private workGroupService: WorkGroupService,
    private helperService: HelperService,
    private storageService: StorageService
  ) {}

  ngOnInit(){
    const today = new Date().toISOString().split('T')[0];

    // Real implementation for later:
    this.mobileHomesService.getHomesForDate(today)
      .then(homes => {
        this.mobileHomes = homes;
        this.filteredMobileHomes = [...this.mobileHomes];
      });

    this.locationFilterCtrl.valueChanges.subscribe((search) => {
      if (!search) {
        this.filteredMobileHomes = [...this.mobileHomes];
        return;
      }
      this.filteredMobileHomes = this.mobileHomes.filter((home) =>
        home.housename.toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  async onSubmit() {
    if (this.report.description && this.report.location) {
      let createdTask = await this.createRepairTaskForHouse();
      if(createdTask && this.imagesToUpload.length > 0){
        this.uploadImages(createdTask);
      }
      this.router.navigate(['/']);
    }
  }

  async createRepairTaskForHouse(){
    let createdTask = await this.taskService.createTaskForHouse(this.report.location, this.report.description, 'Popravak', false);
    let createdWorkGroup = await this.workGroupService.createWorkGroup();
    let createdWorkGroupTask = await this.workGroupService.createWorkGroupTask(createdWorkGroup.work_group_id, createdTask.task_id);

    if(createdTask && createdWorkGroup && createdWorkGroupTask){
      return createdTask;
    }
  }

  goBack() {
    this.location.back();
  }

  handleImageCapture(event: any){
    this.imageToUpload = event.target.files[0];
    if (this.imageToUpload) {
      const reader = new FileReader();
      reader.onload = () => {
        this.capturedImage = reader.result as string; 
      };
      reader.readAsDataURL(this.imageToUpload);
    }
  }

  openCamera() {
    this.fileInput.nativeElement.click();
  }

  saveImage(){
    this.imagesToUpload.push(this.imageToUpload);
    this.imagesToDisplay.push(this.capturedImage);
    this.capturedImage = '';
    this.displaySaveImageError = false;
    this.saveImageError = '';
  }

  discardImage(){
    this.capturedImage = '';
    this.displaySaveImageError = false;
    this.saveImageError = '';
  }

  openImage(imageUrl: string){
    this.openedImage = imageUrl;
    this.helperService.dimBackground.next(true);
  }

  closeImage(){
    this.openedImage = '';
    this.helperService.dimBackground.next(false);
  }

  uploadImages(createdTask: any){
    if(this.imagesToUpload.length > 0 && createdTask){
      this.storageService.storeImagesForTask(this.imagesToUpload, createdTask.task_id)
      .then(result => {
        if ('error' in result) {  
          this.displaySaveImageError = true;
          this.saveImageError = result.error;
          this.taskService.deleteTaskForHouse(createdTask.task_id);
        } else {
          this.capturedImage = '';
          this.displaySaveImageError = false;   
          this.saveImageError = '';
        }
      })
      .catch(error => {
        console.error('Unexpected error:', error);
        this.displaySaveImageError = true;
        this.saveImageError = "An unexpected error occurred.";
        this.taskService.deleteTaskForHouse(createdTask.task_id);
      });
    } else{
      console.log("No images to upload or incorrect task id");
    }
  }
} 