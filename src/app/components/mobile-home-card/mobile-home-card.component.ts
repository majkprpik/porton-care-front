import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileHomeStatus, MobileHome, HouseTask } from '../../models/mobile-home.interface';
import { MobileHomesService } from '../../services/mobile-homes.service';
// import { MobileHomeStatus } from '../../models/mobile-home-status.enum';

@Component({
  selector: 'app-mobile-home-card',
  templateUrl: './mobile-home-card.component.html',
  styleUrls: ['./mobile-home-card.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MobileHomeCardComponent implements OnInit {
  @Input() mobileHome!: MobileHome;
  @Input() taskIndicators: string[] = [];
  @Input() status: MobileHomeStatus | undefined = MobileHomeStatus.FREE;
  @Input() homeNumber: string | undefined = '';
  
  constructor(private homesService: MobileHomesService) {}
  
  ngOnInit() {
    // ... existing code ...
  }
  
  getCardClass(): string {
    if (this.mobileHome.availabilityname === 'Free' && !this.hasActiveTasks()) {
      return 'free';
    } else if (this.mobileHome.availabilityname === 'Occupied') {
      return 'occupied';
    }
    // Add other status classes as needed
    return '';
  }
  
  hasActiveTasks(): boolean {
    return this.homesService.hasActiveTasks(this.mobileHome);
  }
  
  getPendingTasks(): HouseTask[] {
    return this.homesService.getPendingTasks(this.mobileHome);
  }

  // Task indicator methods
  getTaskIndicator(task: HouseTask): string {
    // Return abbreviation for task type
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('terase')) {
      return 'ČT'; // Čišćenje terase
    }
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('kućice')) {
      return 'ČK'; // Čišćenje kućice
    }
    if (task.taskTypeName.toLowerCase().includes('punjenje')) {
      return 'P'; // Punjenje
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('ručnika')) {
      return 'MR'; // Mijenjanje ručnika
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('posteljine')) {
      return 'MP'; // Mijenjanje posteljine
    }
    if (task.taskTypeName.toLowerCase().includes('popravak')) {
      return 'P'; // Popravak
    }
    // If we can't recognize the task type, return the first two letters
    return task.taskTypeName.substring(0, 2);
  }

  // Task action methods
  canStartTask(task: HouseTask): boolean {
    // Can start if task is assigned but not started
    return task.taskProgressTypeName === 'Dodijeljeno' && !task.startTime;
  }

  canPauseTask(task: HouseTask): boolean {
    // Can pause if task is in progress
    return task.taskProgressTypeName === 'U tijeku';
  }

  canCompleteTask(task: HouseTask): boolean {
    // Can complete if task is in progress
    return task.taskProgressTypeName === 'U tijeku';
  }

  startTask(task: HouseTask): void {
    // Start the task
    this.homesService.updateTaskStatus(task.taskId, 'U tijeku');
  }

  pauseTask(task: HouseTask): void {
    // Pause the task (return to assigned)
    this.homesService.updateTaskStatus(task.taskId, 'Dodijeljeno');
  }

  completeTask(task: HouseTask): void {
    // Complete the task
    this.homesService.updateTaskStatus(task.taskId, 'Završeno');
  }

  // Legacy methods kept for compatibility
  ifNeedsInitialSetup(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Punjenje'));
  }

  ifNeedsCleaning(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Čišćenje kućice'));
  }

  ifNeedsPorchCleaning(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Čišćenje terase'));
  }

  ifNeedsRepair(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Popravak'));
  }

  ifNeedsTowelChange(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Mijenjanje ručnika'));
  }

  ifNeedsSheetChange(houseTasks: HouseTask[]){
    return houseTasks.some(houseTask => houseTask.taskTypeName.includes('Mijenjanje posteljine'));
  }
}
