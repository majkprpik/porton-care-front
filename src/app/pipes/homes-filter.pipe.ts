import { Pipe, PipeTransform } from '@angular/core';
import { MobileHome } from '../models/mobile-home.interface';

@Pipe({
  name: 'homesFilterPipe'
})
export class HomesFilterPipe implements PipeTransform {

  transform(
    homes: MobileHome[], 
    showFree: boolean, 
    showFreeWithTasks: boolean, 
    showOccupied: boolean,
    sortBy: string,
  ): MobileHome[] 
  {
    if(!homes){
      return [];
    }

    // First, filter houses based on checkboxes
    let filteredHomes = homes.filter(house => {
      if (showFree && house.availabilityname === 'Free' && house.housetasks.length == 0) return true;
      if (showFreeWithTasks && house.availabilityname === 'Free' && house.housetasks.length > 0) return true;
      if (showOccupied && house.availabilityname === 'Occupied') return true;
      return false;
    });

    // Always sort by category first, then apply other sorts within categories
    return this.sortByCustomOrder(filteredHomes, sortBy);
  }

  // Helper to check if a house has a task in progress
  private hasTaskInProgress(house: MobileHome): boolean {
    return house.housetasks.some(task => 
      task.taskProgressTypeName.toLowerCase().includes('u progresu') ||
      task.taskProgressTypeName.toLowerCase().includes('u tijeku') ||
      task.taskProgressTypeName.toLowerCase().includes('započet')
    );
  }

  // Custom sorting implementation based on the specified order
  private sortByCustomOrder(homes: MobileHome[], secondarySortBy: string): MobileHome[] {
    // Categorize homes
    const freeHomes: MobileHome[] = [];
    const occupiedNoTasksHomes: MobileHome[] = [];
    const inProgressHomes: MobileHome[] = [];
    const othersHomes: MobileHome[] = [];

    // Sort homes into categories
    homes.forEach(house => {
      if (house.availabilityname === 'Free' && house.housetasks.length === 0) {
        // Category 1: Free houses (green)
        freeHomes.push(house);
      } else if (house.availabilityname === 'Occupied' && house.housetasks.length === 0) {
        // Category 2: Occupied houses with no tasks (red)
        occupiedNoTasksHomes.push(house);
      } else if (this.hasTaskInProgress(house)) {
        // Category 3: Houses with tasks in progress
        inProgressHomes.push(house);
      } else {
        // Category 4: All others
        othersHomes.push(house);
      }
    });

    // Apply secondary sorting within each category if needed
    if (secondarySortBy === 'house-number') {
      const sortByHouseNumber = (a: MobileHome, b: MobileHome) => a.housename.localeCompare(b.housename);
      freeHomes.sort(sortByHouseNumber);
      occupiedNoTasksHomes.sort(sortByHouseNumber);
      inProgressHomes.sort(sortByHouseNumber);
      othersHomes.sort(sortByHouseNumber);
    }

    // Combine all categories in the specified order
    return [
      ...freeHomes,
      ...occupiedNoTasksHomes,
      ...inProgressHomes,
      ...othersHomes
    ];
  }
}
