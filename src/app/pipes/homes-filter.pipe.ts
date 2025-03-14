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

    let filteredHomes = homes.filter(house => {
      if (showFree && house.availabilityname === 'Free' && house.housetasks.length == 0) return true;
      if (showFreeWithTasks && house.availabilityname === 'Free' && house.housetasks.length > 0) return true;
      if (showOccupied && house.availabilityname === 'Occupied') return true;
      return false;
    });

    if (sortBy === 'house-number') {
      filteredHomes.sort((a, b) => a.housename.localeCompare(b.housename));
    } else if (sortBy === 'availability') {
      filteredHomes.sort((a, b) => {
        const availabilityOrder = (home: MobileHome) => {
          if (home.availabilityname === 'Free' && home.housetasks.length === 0) return 0;
          if (home.availabilityname === 'Free' && home.housetasks.length > 0) return 1;
          if (home.availabilityname === 'Occupied') return 2;
          return 3;
        };
        return availabilityOrder(a) - availabilityOrder(b);
      });
    }

    return filteredHomes;
  }
}
