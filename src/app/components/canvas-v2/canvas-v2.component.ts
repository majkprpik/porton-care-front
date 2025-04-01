import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservations2Component } from '../reservations2/reservations2.component';
import { DailySheetComponent } from '../daily-sheet/daily-sheet.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-canvas-v2',
  standalone: true,
  imports: [CommonModule, Reservations2Component, DailySheetComponent, MatIconModule],
  templateUrl: './canvas-v2.component.html',
  styleUrls: ['./canvas-v2.component.scss']
})
export class CanvasV2Component {
  isReservationsSidebarCollapsed = true;

  toggleReservationsSidebar() {
    this.isReservationsSidebarCollapsed = !this.isReservationsSidebarCollapsed;
  }
}
