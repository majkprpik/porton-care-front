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
  locations = ['Room A1', 'Room A2', 'Room B1', 'Room B2', 'Common Area', 'Kitchen', 'Bathroom'];
  report = {
    description: '',
    location: ''
  };

  constructor(
    private location: Location,
    private router: Router
  ) {}

  onSubmit() {
    if (this.report.description && this.report.location) {
      // Handle report submission
      console.log(this.report);
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.location.back();
  }
} 