import { Component, OnInit } from '@angular/core';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="mobile-homes-container">
      <mat-card class="mobile-home-card" *ngFor="let home of mobileHomes">
        <app-mobile-home-card
          [status]="home.status"
          [homeNumber]="home.number">
        </app-mobile-home-card>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 8px;
      padding: 8px;
    }

    .mobile-homes-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      padding: 20px;
    }

    .mobile-home-card {
      transition: all 0.2s ease;
    }
    
    .mobile-home-card.free {
      background-color: #e6f7e6; /* Light green background */
      border-left: 4px solid #4CAF50; /* Green border accent */
    }
    
    /* You might want to keep your existing status colors as well */
    .mobile-home-card.occupied { /* existing style */ }
    .mobile-home-card.in-progress { /* existing style */ }
    .mobile-home-card.urgent { /* existing style */ }
    .mobile-home-card.pending { /* existing style */ }
  `],
  standalone: true,
  imports: [CommonModule, MobileHomeCardComponent, MatCardModule]
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
    // this.mobileHomesService.getMockHomesForDate(today)
    //   .subscribe(homes => {
    //     this.mobileHomes = homes;
    //   });

    // Real implementation for later:
    this.mobileHomesService.getHomesForDate(today)
      .then(homes => {
        console.log('Fetched homes:', homes);
        this.mobileHomes = homes;
      });
  }
} 