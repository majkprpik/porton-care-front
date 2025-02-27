import { Component, OnInit } from '@angular/core';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-grid">
      <app-mobile-home-card
        *ngFor="let home of mobileHomes"
        [status]="home.status"
        [homeNumber]="home.number">
      </app-mobile-home-card>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 8px;
      padding: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, MobileHomeCardComponent]
})
export class DashboardComponent implements OnInit {
  mobileHomes: MobileHome[] = [];

  constructor(private mobileHomesService: MobileHomesService) {}

  ngOnInit() {
    this.loadTodayHomes();
  }

  private loadTodayHomes() {
    const today = new Date().toISOString().split('T')[0];
    
    // Using mock service for now
    this.mobileHomesService.getMockHomesForDate(today)
      .subscribe(homes => {
        this.mobileHomes = homes;
      });

    // Real implementation for later:
    // this.mobileHomesService.getHomesForDate(today)
    //   .then(homes => {
    //     this.mobileHomes = homes;
    //   });
  }
} 