import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-report-modal.component.html',
})
export class RepairReportModalComponent {
  locations = ['Room A1', 'Room A2', 'Room B1', 'Room B2', 'Common Area', 'Kitchen', 'Bathroom'];
  report = {
    description: '',
    location: ''
  };

  constructor() {}

  onSubmit() {
    // if (this.report.description && this.report.location) {
    //   this.activeModal.close(this.report);
    // }
  }
} 