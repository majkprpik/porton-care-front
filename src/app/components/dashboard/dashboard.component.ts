import { Component, OnInit } from '@angular/core';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomeCardComponent } from '../mobile-home-card/mobile-home-card.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss', 
  standalone: true,
  imports: [CommonModule, MobileHomeCardComponent, MatCardModule]
})
export class DashboardComponent implements OnInit {
  mobileHomes: MobileHome[] = [];
  
  getFreeHousesCount(): number {
    return this.mobileHomes.filter(home => home.availabilityname === 'Free').length;
  }
  
  getOccupiedHousesCount(): number {
    return this.mobileHomes.filter(home => home.availabilityname === 'Occupied').length;
  }

  getTaskIndicators(home: MobileHome): string[] {
    const indicators: string[] = [];
    
    // Add indicators based on home properties
    if (home.housetasks && home.housetasks.length > 0) {
      // Check for specific task types
      home.housetasks.forEach(task => {
        // Using taskTypeName to determine the type of task
        if (task.taskTypeName.toLowerCase().includes('cleaning')) {
          indicators.push('C'); // C for Cleaning
        }
        if (task.taskTypeName.toLowerCase().includes('maintenance')) {
          indicators.push('M'); // M for Maintenance
        }
        if (task.taskTypeName.toLowerCase().includes('inspection')) {
          indicators.push('I'); // I for Inspection
        }
        if (task.taskTypeName.toLowerCase().includes('checkout')) {
          indicators.push('O'); // O for Checkout
        }
        if (task.taskTypeName.toLowerCase().includes('checkin')) {
          indicators.push('N'); // N for New guests/Check-in
        }
      });
    }
    
    return indicators;
  }

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