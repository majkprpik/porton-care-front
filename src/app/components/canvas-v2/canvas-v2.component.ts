import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservations2Component } from '../reservations2/reservations2.component';
import { DailySheetComponent } from '../daily-sheet/daily-sheet.component';

@Component({
  selector: 'app-canvas-v2',
  standalone: true,
  imports: [CommonModule, Reservations2Component, DailySheetComponent],
  templateUrl: './canvas-v2.component.html',
  styleUrls: ['./canvas-v2.component.scss']
})
export class CanvasV2Component {
  
}
