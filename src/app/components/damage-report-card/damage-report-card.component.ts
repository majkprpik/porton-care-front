import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { WorkGroupService } from '../../services/work-group.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../models/profile.interface';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-damage-report-card',
  templateUrl: './damage-report-card.component.html',
  styleUrls: ['./damage-report-card.component.scss'],
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class DamageReportCardComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  @Input() houseTask!: any;
  @Input() maintenanceProfiles: Profile[] = [];
  @Output() taskRepaired = new EventEmitter<{ taskId: number, isRepaired: boolean }>();
  @Output() openImage = new EventEmitter<{ imageUrl: string }>();
  
  selectedTab: string = 'images';
  comment: string = '';
  showTextbox: boolean = false;
  selectedTechnicianId: string = '';
  isMarkedAsRepaired: boolean = false;
  isTechnicianSubmitted: boolean = false;
  workGroupProfile: any;
  userName: string | null = '';
  capturedImage: string | null = null;
  imageToUpload: any;
  images: any;
  displaySaveImageError = false;
  saveImageError = '';

  constructor(
    private taskService: TaskService,
    private workGroupService: WorkGroupService,
    public authService: AuthService,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    this.showTextbox = !this.isCommented(this.houseTask.description);
    this.selectedTechnicianId = await this.getSelectedTechnicianId();
    this.checkIfRepaired();
    this.authService.userProfile.subscribe((userProfile: any) => {
      if(userProfile){
        this.userName = userProfile.first_name + ' ' + userProfile.last_name;
      }
    });
    this.getStoredImagesForTask();
  }

  async getStoredImagesForTask() {
    try {
        const fetchedImages = await this.storageService.getStoredImagesForTask(this.houseTask.taskId);

        if (!fetchedImages || fetchedImages.length === 0) {
          console.warn('No images found.');
          this.images = [];
          return;
        }

        this.images = await Promise.all(fetchedImages.map(async (image: any) => {
          const url = await this.storageService.getPublicUrlForImage(`task-${this.houseTask.taskId}/${image.name}`);
          console.log('Generated URL:', url); 
          return { name: image.name, url };
        }));
    } catch (error) {
        console.error('Error fetching images:', error);
    }
  }

  setSelectedTab(tab: string) {
    this.selectedTab = tab;
  }

  submitComment() {
    if (!this.comment.trim()) return;

    this.comment = this.comment.trim();

    this.comment = "\nMauro: " + this.comment;
    this.houseTask.description += this.comment;

    this.taskService.uploadCommentForTask(this.houseTask.taskId, this.houseTask.description);
    this.comment = '';
    this.toggleShowTextbox();
  }

  formatDescriptionForTask(description: string) {
    return description.split('\n')[0];
  }

  formatCommentForTask(comment: string): string {
    return comment.split('\n').slice(1).join('\n');
  }

  isCommented(comment: string) {
    return comment.split('\n')[1] ? true : false;
  }

  toggleShowTextbox() {
    this.showTextbox = !this.showTextbox;
  }

  getSelectedTechnicianDetails(): string {
    const technician = this.maintenanceProfiles.find(profile => profile.id === this.selectedTechnicianId);
    return technician ? technician.first_name + ' ' + technician.last_name : '';
  }

  async getSelectedTechnicianId(): Promise<string>{
    let workGroupTask = await this.workGroupService.getWorkGroupTasksByTaskId(this.houseTask.taskId);

    if(!workGroupTask.work_group_id){
      return '';
    }

    this.workGroupProfile = await this.workGroupService.getWorkGroupProfileByWorkGroupId(workGroupTask.work_group_id);

    if(!this.workGroupProfile[0]){
      return '';
    }

    this.isTechnicianSubmitted = true;
    return this.workGroupProfile[0].profile_id;
  }

  async submitTechnicianForRepairTask() {
    let workGroupTasks = await this.workGroupService.getWorkGroupTasksByTaskId(this.houseTask.taskId);
    this.workGroupService.submitTechnicianForRepairTask(workGroupTasks.work_group_id, this.selectedTechnicianId);

    let taskProgressTypeId = await this.taskService.getTaskProgressTypeIdByTaskProgressTypeName("U progresu");
    this.houseTask.taskProgressTypeId = taskProgressTypeId;
    this.houseTask.startTime = this.getFormattedDateTimeNowForSupabase(),
    this.taskService.updateTask(this.houseTask);
    this.workGroupService.lockWorkGroup(workGroupTasks.work_group_id);
    
    this.isTechnicianSubmitted = true;
  }

  markAsRepaired(){
    this.taskService.setTaskProgress(this.houseTask.taskId, 'Završeno');
    this.isMarkedAsRepaired = true;
    this.houseTask.endTime = this.getFormattedDateTimeNowForSupabase();
    this.taskService.updateTask(this.houseTask);
    this.taskRepaired.emit({ taskId: this.houseTask.taskId, isRepaired: true });
  }

  markAsNotRepaired(){
    this.taskService.setTaskProgress(this.houseTask.taskId, 'U progresu');
    this.isMarkedAsRepaired = false;
    this.taskRepaired.emit({ taskId: this.houseTask.taskId, isRepaired: false });
  }

  checkIfRepaired(){
    if(this.houseTask.taskProgressTypeName === "Završeno"){
      this.isMarkedAsRepaired = true;
    }
  }

  getTaskReportedTime() {
    if (!this.houseTask || !this.houseTask.createdAt) {
      return null;
    }
  
    const startTime = new Date(this.houseTask.createdAt);

    return this.formatTimeToHHMMYYYY(startTime);
  }

  formatTimeToHHMMYYYY(time: Date){
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const year = time.getFullYear();

    return hours + ':' + minutes + ' on ' + day + '/' + month + '/' + year;
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
  }

  openCamera() {
    console.log('Opening default camera app...');
    this.fileInput.nativeElement.click();
  }

  handleImageCapture(event: any) {
    this.imageToUpload = event.target.files[0];
    if (this.imageToUpload) {
      const reader = new FileReader();
      reader.onload = () => {
        this.capturedImage = reader.result as string; 
      };
      reader.readAsDataURL(this.imageToUpload);
    }
  }

  saveImage(){
    if(this.imageToUpload && this.houseTask.taskId){
      this.storageService.storeImageForTask(this.imageToUpload, this.houseTask.taskId)
        .then(result => {
          if(!result.error) {
            this.images.push({ name: this.imageToUpload.name, url: result.url });
            this.capturedImage = '';
            this.displaySaveImageError = false;   
            this.saveImageError = '';
          } else {
            this.displaySaveImageError = true;
            this.saveImageError = result.error;
          }
        })  
    } else{
      console.log("Image or id null");
    }
  }

  discardImage(){
    this.capturedImage = '';
    this.displaySaveImageError = false;
    this.saveImageError = '';
  }

  onOpenImage(imageUrl: string){
    this.openImage.emit({
      imageUrl: imageUrl
    });
  }
}