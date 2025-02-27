import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileHomeStatus } from '../../models/mobile-home-status.enum';

@Component({
  selector: 'app-mobile-home-card',
  templateUrl: './mobile-home-card.component.html',
  styleUrls: ['./mobile-home-card.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MobileHomeCardComponent {
  @Input() status: MobileHomeStatus = MobileHomeStatus.READY;
  @Input() homeNumber: string = '';
}
