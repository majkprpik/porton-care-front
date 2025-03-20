import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-header.component.html',
  styleUrls: ['./stats-header.component.scss']
})
export class StatsHeaderComponent implements OnInit {
  date: string = '25.03.2025';
  stats: string = '45 KUCICA / 21 SLOBODNA / 24 ZAUZETE / 12 ODLAZAKA / 19 DOLAZAKA(15 OCISCENIH)';
  
  constructor() { }
  
  ngOnInit(): void {
    // You might want to fetch this data from a service in the future
  }
} 