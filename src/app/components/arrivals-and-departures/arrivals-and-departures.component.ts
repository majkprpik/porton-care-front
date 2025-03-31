import { Component } from '@angular/core';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-arrivals-and-departures',
  imports: [
    CommonModule
  ],
  templateUrl: './arrivals-and-departures.component.html',
  styleUrl: './arrivals-and-departures.component.scss',
  providers: [
    DatePipe
  ],
})
export class ArrivalsAndDeparturesComponent {
  arrivals: any[] = [];
  departures: any[] = [];
  private subscription: Subscription | undefined;
  currentDateTime: Date = new Date();
  checkedDepartureHouseIds: number[] = [];
  checkedArrivalHouseIds: number[] = [];

  constructor(
    private mobileHomesService: MobileHomesService,
  ) {    
    
  }

  async ngOnInit(){
    this.getTodaysArrivals();
    this.getTodaysDepartures();
    this.subscription = interval(1000).subscribe(() => {
      this.currentDateTime = new Date();
    });
  }

  getTodaysArrivals(){
    this.mobileHomesService.getHomesWithTodaysStartDate().then(async (homes) => {
      this.arrivals = await Promise.all(homes.map(async (home) => {
        console.log('Arrivals: ' + home.house_id + ' ' + home.house_availability_start_date);
        const house_number = await this.mobileHomesService.getHouseNumberByHouseId(home.house_id);
        return { ...home, house_number };
      }));

      // Sort the arrivals array by house_number in ascending order
      this.arrivals.sort((a, b) => {
        if (a.house_number < b.house_number) return -1;
        if (a.house_number > b.house_number) return 1;
        return 0;
      });
    });
  }

  getTodaysDepartures() {
    this.mobileHomesService.getHomesWithYesterdaysEndDate().then(async (homes) => {
      this.departures = await Promise.all(homes.map(async (home) => {
        console.log('Departures: ' + home.house_id + ' ' + home.house_availability_end_date);
        const house_number = await this.mobileHomesService.getHouseNumberByHouseId(home.house_id);
        return { ...home, house_number };
      }));
  
      // Sort the departures array by house_number in ascending order
      this.departures.sort((a, b) => {
        if (a.house_number < b.house_number) return -1;
        if (a.house_number > b.house_number) return 1;
        return 0;
      });
    });
  }

  getTimeFromDate(date: string){
    const dateObj = new Date(date);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async submitDepartures(event: any, houseAvailabilityId: number){
    if(houseAvailabilityId){
      await this.mobileHomesService.setHouseAvailabilityDeparted(houseAvailabilityId, event.target.checked);
    }
  }

  async submitArrivals(event: any, houseAvailabilityId: number){
    if(houseAvailabilityId){
      await this.mobileHomesService.setHouseAvailabilityArrived(houseAvailabilityId, event.target.checked);
    }
  }
}
