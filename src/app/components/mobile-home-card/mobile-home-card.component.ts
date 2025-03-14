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
}
