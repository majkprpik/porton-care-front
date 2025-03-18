import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MobileHomeStatus, MobileHome, HouseTask, Reservation } from '../../models/mobile-home.interface';
import { Subscription } from 'rxjs';
import { ExpansionService } from '../../services/expansion.service';

@Component({
  selector: 'app-mobile-home-card',
  templateUrl: './mobile-home-card.component.html',
  styleUrls: ['./mobile-home-card.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule]
})
export class MobileHomeCardComponent implements OnInit, OnDestroy {
  @Input() mobileHome!: MobileHome;
  
  expanded = false;
  private subscription: Subscription = new Subscription();
  
  constructor(private expansionService: ExpansionService) {}
  
  ngOnInit() {
    // Subscribe to the global expansion state
    this.subscription = this.expansionService.expansionState$.subscribe(
      expanded => this.expanded = expanded
    );
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  
  toggleExpansion(event: Event) {
    event.stopPropagation();
    this.expansionService.toggleExpansion();
  }
  
  // Methods to get occupancy counts with defaults
  getAdultsCount(): number {
    if (this.mobileHome.availabilityname !== 'Occupied') {
      return 0;
    }
    return this.mobileHome.adults || 3; // Default to 2 adults for occupied homes
  }

  getChildrenCount(): number {
    if (this.mobileHome.availabilityname !== 'Occupied') {
      return 0;
    }
    return this.mobileHome.children || 5; // Default to 1 child for occupied homes
  }

  getPetsCount(): number {
    if (this.mobileHome.availabilityname !== 'Occupied') {
      return 0;
    }
    return this.mobileHome.pets || 2; // Default to 0 pets for occupied homes
  }
  
  // Method to return tasks that are not in progress (for expanded view)
  getNonProgressTasks(): HouseTask[] {
    if (!this.mobileHome.housetasks || this.mobileHome.housetasks.length === 0) {
      return [];
    }
    
    return this.mobileHome.housetasks
      .filter(task => !this.isTaskInProgress(task) && !this.isPunjenjeTask(task));
  }
  
  // Method to return non-progress tasks for the icons in top row (limited to 2)
  getTopRowTasks(): HouseTask[] {
    if (!this.mobileHome.housetasks || this.mobileHome.housetasks.length === 0) {
      return [];
    }
    
    return this.mobileHome.housetasks
      .filter(task => !this.isTaskInProgress(task) && !this.isPunjenjeTask(task))
      .slice(0, 2); // Limit to 2 tasks for the top row
  }
  
  // Method to return the in-progress task if one exists
  getInProgressTask(): HouseTask | null {
    if (!this.mobileHome.housetasks || this.mobileHome.housetasks.length === 0) {
      return null;
    }
    
    const inProgressTask = this.mobileHome.housetasks.find(task => 
      !this.isPunjenjeTask(task) && (
        task.taskProgressTypeName.toLowerCase().includes('u progresu') ||
        task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
        task.taskProgressTypeName.toLowerCase().includes('započet')
      )
    );
    
    return inProgressTask || null;
  }
  
  // Method to check if task is in progress
  isTaskInProgress(task: HouseTask): boolean {
    return task.taskProgressTypeName.toLowerCase().includes('u progresu') || 
           task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
           task.taskProgressTypeName.toLowerCase().includes('započet');
  }
  
  // Method to check if task is of type 'punjenje' (charging)
  isPunjenjeTask(task: HouseTask): boolean {
    return task.taskTypeName.toLowerCase().includes('punjenje');
  }
  
  // Task indicator method - used for text abbreviations
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

  // Method to map task types to icon names
  getTaskIcon(task: HouseTask): string {
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('terase')) {
      return 'deck'; // For terrace cleaning - deck icon
    }
    if (task.taskTypeName.toLowerCase().includes('čišćenje') && task.taskTypeName.toLowerCase().includes('kućice')) {
      return 'cleaning_services'; // For house cleaning - broom/cleaning icon
    }
    if (task.taskTypeName.toLowerCase().includes('punjenje')) {
      return 'electrical_services'; // For charging/power related tasks - plug icon
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('ručnika')) {
      return 'dry_cleaning'; // For towel changing - laundry icon
    }
    if (task.taskTypeName.toLowerCase().includes('mijenjanje') && task.taskTypeName.toLowerCase().includes('posteljine')) {
      return 'bed'; // For bedding changes - bed icon
    }
    if (task.taskTypeName.toLowerCase().includes('popravak')) {
      return 'build'; // For repairs - tools icon
    }
    // Default icon if we can't recognize the task type
    return 'task_alt';
  }

  // Get current reservation info for occupied homes (mock data for now)
  getCurrentReservation(): Reservation | null {
    if (this.mobileHome.availabilityname !== 'Occupied') {
      return null;
    }
    
    // In a real implementation, this would come from the mobileHome object
    // For now, returning mock data
    return {
      id: '123',
      startTime: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      endTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),  // 4 days from now
      guestName: 'Gost'
    };
  }
  
  // Get next reservation for free homes
  getNextReservation(): Reservation | null {
    if (this.mobileHome.availabilityname !== 'Free') {
      return null;
    }
    
    // Return the next reservation from the mobile home if it exists
    // Otherwise return mock data for now
    if (this.mobileHome.nextReservation) {
      return this.mobileHome.nextReservation;
    }
    
    // Mock data for demonstration
    return {
      id: '456',
      startTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      endTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),  // 9 days from now
      guestName: 'Budući gost'
    };
  }
  
  // Format date to DD.MM.
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
  }
}


