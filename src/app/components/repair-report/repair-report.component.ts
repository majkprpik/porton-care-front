import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { MobileHome } from '../../models/mobile-home.interface';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-repair-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './repair-report.component.html',
  styleUrls: ['./repair-report.component.scss']
})
export class RepairReportComponent {
  mobileHomes: MobileHome[] = [];
  report = {
    description: '',
    location: ''
  };

  constructor(
    private location: Location,
    private router: Router,
    private mobileHomesService: MobileHomesService,
    private taskService: TaskService
  ) {}

  ngOnInit(){
    const today = new Date().toISOString().split('T')[0];

    // Real implementation for later:
    this.mobileHomesService.getHomesForDate(today)
      .then(homes => {
        console.log('Fetched homes:', homes);
        this.mobileHomes = homes;
      });
  }

  onSubmit() {
    if (this.report.description && this.report.location) {
      this.taskService.createTaskForHouse(this.report.location, this.report.description);
      console.log(this.report);
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.location.back();
  }
} 