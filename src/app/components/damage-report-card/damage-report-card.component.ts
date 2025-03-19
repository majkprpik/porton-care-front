import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Profile } from '../../models/profile.interface';
import { TaskService } from '../../services/task.service';
import { WorkGroupService } from '../../services/work-group.service';
import { HouseTask } from '../../models/mobile-home.interface';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-damage-report-card',
  templateUrl: './damage-report-card.component.html',
  styleUrls: ['./damage-report-card.component.scss'],
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class DamageReportCardComponent {
  @Input() houseName: string = '';
  @Input() houseTask!: HouseTask;
  @Input() maintenanceProfiles: Profile[] = [];
  @Output() taskRepaired = new EventEmitter<{ taskId: number, isRepaired: boolean }>();

  selectedTab: string = 'images';
  comment: string = '';
  showTextbox: boolean = false;
  selectedTechnicianId: string = '';
  isMarkedAsRepaired: boolean = false;
  isTechnicianSubmitted: boolean = false;
  workGroupProfile: any;

  constructor(
    private taskService: TaskService,
    private workGroupService: WorkGroupService
  ) {}

  async ngOnInit() {
    this.showTextbox = !this.isCommented(this.houseTask.description);
    this.selectedTechnicianId = await this.getSelectedTechnicianId();
    this.checkIfRepaired();
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
    this.workGroupProfile = await this.workGroupService.getWorkGroupProfileByWorkGroupId(workGroupTask.work_group_id);

    if(!this.workGroupProfile[0].profile_id){
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
    this.taskService.updateTask(this.houseTask);
    this.workGroupService.lockWorkGroup(workGroupTasks.work_group_id);
    
    this.isTechnicianSubmitted = true;
  }

  markAsRepaired(){
    this.taskService.setTaskProgress(this.houseTask.taskId, 'Završeno');
    this.isMarkedAsRepaired = true;
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
}