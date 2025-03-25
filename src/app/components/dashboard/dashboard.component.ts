import { Component, OnInit, OnDestroy } from '@angular/core';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';
import { MatCardModule } from '@angular/material/card';
import { HomesFilterPipe } from '../../pipes/homes-filter.pipe';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ExpansionService } from '../../services/expansion.service';
import { Subscription } from 'rxjs';
import { NewsFeedComponent } from '../news-feed/news-feed.component';

// Interface for categorized homes
interface CategorizedHomes {
  freeHomes: MobileHome[];
  occupiedNoTasksHomes: MobileHome[];
  inProgressHomes: MobileHome[];
  othersHomes: MobileHome[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss', 
  standalone: true,
  imports: [
    CommonModule, 
    MobileHomeCardComponent, 
    MatCardModule, 
    // HomesFilterPipe, 
    FormsModule, 
    NewsFeedComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  mobileHomes: MobileHome[] = [];
  filteredMobileHomes: MobileHome[] = [];
  searchQuery: string = '';

  // Layout view type: 'list' (default, categorized) or 'grid' (all rooms by number)
  viewType: 'list' | 'grid' = 'list';
  
  showFreeHouses = true;
  showFreeHousesWithTasks = true;
  showOccupiedHouses = true;
  sortBy = '';
  
  // Subscribe to expansion state
  areTeamBoxesExpanded = false;
  private expansionSubscription: Subscription;
  
  // Side drawer state
  isDrawerCollapsed = false; // Start with drawer collapsed by default
  activeTab = 'tasks'; // Default active tab
  
  getFreeHousesCount(): number {
    return this.mobileHomes.filter(home => home.availabilityname === 'Free').length;
  }
  
  getOccupiedHousesCount(): number {
    return this.mobileHomes.filter(home => home.availabilityname === 'Occupied').length;
  }

  // Search and filter functionality
  filterHouses(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredMobileHomes = [...this.mobileHomes];
      return;
    }
    
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredMobileHomes = this.mobileHomes.filter(home => 
      home.housename.toLowerCase().includes(query)
    );
  }

  // New method to return categorized homes for the template - updated to use filtered homes
  getCategorizedHomes(): CategorizedHomes {
    // Use filtered homes instead of all homes
    let homesToCategorize = this.filteredMobileHomes.length > 0 ? this.filteredMobileHomes : this.mobileHomes;

    // Initialize category arrays
    const freeHomes: MobileHome[] = [];
    const occupiedNoTasksHomes: MobileHome[] = [];
    const inProgressHomes: MobileHome[] = [];
    const othersHomes: MobileHome[] = [];

    // Sort homes into categories
    homesToCategorize.forEach(house => {
      // Filter out punjenje tasks
      const nonPunjenjeTasks = house.housetasks.filter(task => !this.isPunjenjeTask(task));
      
      // Check if the house has any non-punjenje tasks
      if (nonPunjenjeTasks.length === 0) {
        // House has no non-punjenje tasks
        if (house.availabilityname === 'Free') {
          // Category 1: Free houses with no relevant tasks (green)
          freeHomes.push(house);
        } else if (house.availabilityname === 'Occupied') {
          // Category 2: Occupied houses with no relevant tasks (red)
          occupiedNoTasksHomes.push(house);
        }
      } else {
        // House has non-punjenje tasks
        if (this.hasTaskInProgress(house)) {
          // Category 3: Houses with non-punjenje tasks in progress
          inProgressHomes.push(house);
        } else {
          // Category 4: All others with non-punjenje tasks
          othersHomes.push(house);
        }
      }
    });

    // Apply sorting by house number by default
    const sortByHouseNumber = (a: MobileHome, b: MobileHome) => a.housename.localeCompare(b.housename);
    freeHomes.sort(sortByHouseNumber);
    occupiedNoTasksHomes.sort(sortByHouseNumber);
    inProgressHomes.sort(sortByHouseNumber);
    othersHomes.sort(sortByHouseNumber);

    return {
      freeHomes,
      occupiedNoTasksHomes,
      inProgressHomes,
      othersHomes
    };
  }

  // Helper to check if a house has a task in progress
  private hasTaskInProgress(house: MobileHome): boolean {
    return house.housetasks.some(task => 
      !this.isPunjenjeTask(task) && (
        task.taskProgressTypeName.toLowerCase().includes('u progresu') ||
        task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
        task.taskProgressTypeName.toLowerCase().includes('započet')
      )
    );
  }

  // Helper to check if task is of type 'punjenje' (charging)
  private isPunjenjeTask(task: any): boolean {
    return task.taskTypeName.toLowerCase().includes('punjenje');
  }

  // Count total number of tasks in progress
  getTotalTasksInProgress(): number {
    return this.mobileHomes.reduce((count, house) => {
      const inProgressTasksCount = house.housetasks.filter(task => 
        !this.isPunjenjeTask(task) && (
          task.taskProgressTypeName.toLowerCase().includes('u progresu') ||
          task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
          task.taskProgressTypeName.toLowerCase().includes('započet')
        )
      ).length;
      return count + inProgressTasksCount;
    }, 0);
  }

  // Count total number of assigned tasks (not in progress)
  getTotalAssignedTasks(): number {
    return this.mobileHomes.reduce((count, house) => {
      // Count tasks that are assigned but not in progress and not punjenje
      const assignedTasksCount = house.housetasks.filter(task => 
        !this.isPunjenjeTask(task) && !(
          task.taskProgressTypeName.toLowerCase().includes('u progresu') ||
          task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
          task.taskProgressTypeName.toLowerCase().includes('započet')
        )
      ).length;
      return count + assignedTasksCount;
    }, 0);
  }

  // Get count of houses that have assigned tasks (not in progress)
  getHousesWithAssignedTasksCount(): number {
    return this.getCategorizedHomes().othersHomes.length;
  }

  constructor(
    private mobileHomesService: MobileHomesService,
    private taskService: TaskService,
    private expansionService: ExpansionService) {
    // Subscribe to expansion state changes
    this.expansionSubscription = this.expansionService.expansionState$.subscribe(
      expanded => this.areTeamBoxesExpanded = expanded
    );
  }

  ngOnInit() {
    this.loadTodayHomes();
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.expansionSubscription) {
      this.expansionSubscription.unsubscribe();
    }
  }

  private loadTodayHomes() {
    const today = new Date().toISOString().split('T')[0];
    
    // Using mock service for now
    // this.mobileHomesService.getMockHomesForDate(today)
    //   .subscribe(homes => {
    //     this.mobileHomes = homes;
    //   });

    // Real implementation for later:
    this.mobileHomesService.getHomesForDate(today)
      .then(homes => {
        console.log('Fetched homes:', homes);
        this.mobileHomes = homes;
        this.filteredMobileHomes = [...homes]; // Initialize filtered homes
      });
  }

  toggleFreeHouses(){
    this.showFreeHouses = !this.showFreeHouses;
  }

  toggleFreeHousesWithTasks(){
    this.showFreeHousesWithTasks = !this.showFreeHousesWithTasks;
  }

  toggleOccupiedHouses(){
    this.showOccupiedHouses = !this.showOccupiedHouses;
  }

  // Method to toggle team box expansion - now uses service
  toggleTeamBox(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Use the service to toggle the expansion state
    this.expansionService.toggleExpansion();
  }

  // Toggle drawer open/closed state
  toggleDrawer() {
    this.isDrawerCollapsed = !this.isDrawerCollapsed;
  }

  // Set active tab
  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  // Toggle between list and grid view
  toggleViewType() {
    this.viewType = this.viewType === 'list' ? 'grid' : 'list';
  }

  // Get all homes sorted by number for grid view - updated to use filtered homes
  getAllHomesSorted(): MobileHome[] {
    const homesToDisplay = this.filteredMobileHomes.length > 0 ? this.filteredMobileHomes : this.mobileHomes;
    return [...homesToDisplay].sort((a, b) => 
      a.housename.localeCompare(b.housename, undefined, { numeric: true, sensitivity: 'base' })
    );
  }
} 