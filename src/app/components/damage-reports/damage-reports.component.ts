import { Component } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-damage-reports',
  templateUrl: './damage-reports.component.html',
  styleUrl: './damage-reports.component.scss',
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class DamageReportsComponent {
  homesForRepair: MobileHome[] = [];
  selectedTabs: { [key: number]: string } = {};
  comments: { [taskId: number]: string } = {};
  showTextbox: { [taskId: number]: boolean } = {};

  constructor(
    private mobileHomesService: MobileHomesService,
    private taskService: TaskService,
  ) {
        
  }

  ngOnInit(){
    this.getMobileHomesForRepair();
  }

  async getMobileHomesForRepair(){
    this.homesForRepair = await this.mobileHomesService.getHomesWithRepairTasks();
    this.homesForRepair.forEach(home => {
      home.housetasks.forEach(task => {
          this.selectedTabs[task.taskId] = 'images';
          this.showTextbox[task.taskId] = !this.isCommented(task.description);
      });
    });
  }

  setSelectedTab(taskId: number, selectedTab: string){
    this.selectedTabs[taskId] = selectedTab;
  }

  submitComment(houseTask: any){
    if (!this.comments[houseTask.taskId].trim()) return;

    this.comments[houseTask.taskId] = "\nMauro: " + this.comments[houseTask.taskId];
    houseTask.description = houseTask.description + this.comments[houseTask.taskId];

    this.taskService.uploadCommentForTask(houseTask.taskId, houseTask.description);
    this.comments[houseTask.taskId] = "";
    this.toggleShowTextbox(houseTask.taskId);
  }

  formatDescriptionForTask(description: string){
    return description.split('\n')[0];
  }

  formatCommentForTask(comment: string): string {
    return comment.split('\n').slice(1).join('\n');
  }

  isCommented(comment: string){
    return comment.split('\n')[1] ? true : false;
  }

  toggleShowTextbox(taskId: number) {
    this.showTextbox[taskId] = !this.showTextbox[taskId];
  }

  isTextboxVisible(taskId: number): boolean {
    return this.showTextbox[taskId] ? true : false;
  }
}
