import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileHome } from '../../models/mobile-home.interface';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent implements OnInit {
  mobileHomes: MobileHome[] = [];
  days: string[] = [];
  numberOfDays: number = 30;
  currentDate: Date = new Date();
  reservations: { [key: string]: { [key: string]: any } } = {};
  
  // Reservation colors (similar to what was shown in Excel)
  reservationColors = [
    { name: 'Zimak', color: '#f8c9c9' },  // Light red
    { name: 'Simon', color: '#ffffa5' },  // Light yellow
    { name: 'Becker', color: '#d8d8d8' }, // Light gray
    { name: 'Unterrainer', color: '#ffcccc' }, // Light pink
    { name: 'Pressl', color: '#ffffcc' }, // Light yellow
    { name: 'Monde', color: '#ccffff' }   // Light blue
  ];

  constructor() {}

  ngOnInit(): void {
    this.generateDays();
    this.loadMockData();
  }

  generateDays(): void {
    this.days = [];
    for (let i = 0; i < this.numberOfDays; i++) {
      const date = new Date(this.currentDate);
      date.setDate(date.getDate() + i);
      // Format: DD.MM
      const day = `${date.getDate()}.${date.getMonth() + 1}`;
      this.days.push(day);
    }
  }

  loadMockData(): void {
    // Mock data for mobile homes
    this.mobileHomes = [
      { house_id: 641, housename: '641', housetype: 1, housetypename: 'Type A', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 642, housename: '642', housetype: 1, housetypename: 'Type A', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 643, housename: '643', housetype: 1, housetypename: 'Type B', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 644, housename: '644', housetype: 1, housetypename: 'Type B', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 645, housename: '645', housetype: 1, housetypename: 'Type C', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 646, housename: '646', housetype: 1, housetypename: 'Type C', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 647, housename: '647', housetype: 1, housetypename: 'Type D', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 648, housename: '648', housetype: 1, housetypename: 'Type D', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 649, housename: '649', housetype: 1, housetypename: 'Type E', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
      { house_id: 650, housename: '650', housetype: 1, housetypename: 'Type E', availabilityid: 1, availabilityname: 'Available', housetasks: [] },
    ];

    // Mock data for reservations
    // Format: reservations[houseId][day] = { guest: 'Name', color: '#color', phone: 'number' }
    this.reservations = {
      '641': {
        '11.5': { guest: 'Zimak', color: '#f8c9c9', phone: '4854017674' }
      },
      '642': {
        '15.5': { guest: 'Simon', color: '#ffffa5', phone: '4479683538' }
      },
      '643': {
        '17.5': { guest: 'Becker', color: '#d8d8d8', phone: '4882311397' },
        '22.5': { guest: 'Unterrainer', color: '#ffcccc', phone: 'PH21584208' }
      },
      '644': {
        '20.5': { guest: 'Pressl', color: '#ffffcc', phone: '4884798844' },
        '25.5': { guest: 'Monde', color: '#ccffff', phone: '4985334450' }
      }
    };
  }

  getReservation(houseId: number, day: string): any {
    return this.reservations[houseId]?.[day] || null;
  }

  hasReservation(houseId: number, day: string): boolean {
    return !!this.getReservation(houseId, day);
  }

  getCellStyle(houseId: number, day: string): any {
    const reservation = this.getReservation(houseId, day);
    if (reservation) {
      return {
        'background-color': reservation.color,
        'cursor': 'pointer'
      };
    }
    return {};
  }

  onCellClick(houseId: number, day: string): void {
    // Here you would open a modal to add/edit a reservation
    console.log(`Clicked on house ${houseId} for day ${day}`);
    // For now, add a mock reservation if no reservation exists
    if (!this.hasReservation(houseId, day)) {
      if (!this.reservations[houseId]) {
        this.reservations[houseId] = {};
      }
      const randomGuest = this.reservationColors[Math.floor(Math.random() * this.reservationColors.length)];
      this.reservations[houseId][day] = {
        guest: randomGuest.name,
        color: randomGuest.color,
        phone: Math.floor(Math.random() * 10000000000).toString()
      };
    }
  }
}
