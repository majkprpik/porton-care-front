import { Component, OnInit } from '@angular/core';
import { RepairReport, RepairStatus } from '../../interfaces/repair-report.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repair-reports.component.html',
  // styleUrls: ['./repair-reports.component.scss']
})
export class RepairReportsComponent implements OnInit {
  reports: RepairReport[] = [];
  RepairStatus = RepairStatus;

  ngOnInit() {
    // Load reports from your service
  }

  updateStatus(report: RepairReport, status: RepairStatus) {
    report.status = status;
    report.updatedAt = new Date();
    // Update in your service
  }
} 