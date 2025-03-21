import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileHome } from '../../models/mobile-home.interface';
import { ReservationsService } from '../../services/reservations.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent implements OnInit {
  mobileHomes: MobileHome[] = [];
  filteredMobileHomes: MobileHome[] = []; // For filtered view
  houses: any[] = []; // Houses from Supabase
  days: string[] = [];
  numberOfDays: number = 365; // Full year
  currentDate: Date = new Date(2024, 0, 1); // January 1, 2024
  reservations: { [key: string]: { [key: string]: any } } = {};
  availabilityTypes: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // House type filtering
  houseTypes: string[] = ['Type 1', 'Type 2', 'Type 3', 'Type 4']; 
  currentHouseType: string = 'Type 1';
  
  // Add months array for organizing month headers
  months: { name: string, days: string[] }[] = [];
  
  // New guest form data
  newReservation = {
    house_id: 0,
    guest_name: '',
    guest_phone: '',
    start_date: '',
    end_date: '',
    adults: 1,
    children: 0,
    extraBeds: 0,
    pets: 0,
    notes: ''
  };
  
  // Reservation colors for different guests
  reservationColors = [
    { name: 'Zimak', color: '#f8c9c9' },  // Light red
    { name: 'Simon', color: '#ffffa5' },  // Light yellow
    { name: 'Becker', color: '#d8d8d8' }, // Light gray
    { name: 'Unterrainer', color: '#ffcccc' }, // Light pink
    { name: 'Pressl', color: '#ffffcc' }, // Light yellow
    { name: 'Monde', color: '#ccffff' }   // Light blue
  ];

  // Add property to control popup visibility
  showPopup: boolean = false;
  selectedReservation: any = null;
  popupPosition = { top: '0px', left: '0px' };

  // Add properties to track the selected empty cell
  selectedEmptyCell: { houseId: number, day: string } | null = null;
  showNewReservationPopup: boolean = false;
  newReservationPopupPosition = { top: '0px', left: '0px' };
  
  // Add drag selection properties
  isDragging: boolean = false;
  dragStartCell: { houseId: number, day: string } | null = null;
  dragEndCell: { houseId: number, day: string } | null = null;
  
  // Add property to track pending reservation range
  pendingReservationRange: { houseId: number, startDay: number, endDay: number, month: number } | null = null;

  constructor(private reservationsService: ReservationsService) {}

  ngOnInit(): void {
    this.generateYearCalendar();
    this.loadMockData();
  }

  generateYearCalendar(): void {
    this.days = [];
    this.months = [];
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Generate days for the entire year, excluding first 3 and last 2 months
    const year = this.currentDate.getFullYear();
    
    // Start from April (index 3) and end at October (index 9, before November)
    for (let month = 3; month < 10; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDays: string[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${day}.${month + 1}`;
        this.days.push(dayStr);
        monthDays.push(dayStr);
      }
      
      this.months.push({
        name: monthNames[month],
        days: monthDays
      });
    }
  }

  // Method to filter houses by type
  changeHouseType(type: string): void {
    this.currentHouseType = type;
    this.filterHouses();
  }

  // Filter houses based on selected type
  filterHouses(): void {
    this.filteredMobileHomes = this.mobileHomes.filter(house => {
      // Use house type to filter
      const houseTypeMap: { [key: number]: string } = {
        1: 'Type 1',
        2: 'Type 2',
        3: 'Type 3',
        4: 'Type 4'
      };
      
      return houseTypeMap[house.housetype] === this.currentHouseType;
    });
  }

  async loadData(): Promise<void> {
    // This is the real implementation that calls Supabase
    // Not using this for now, using loadMockData instead
    try {
      this.isLoading = true;
      
      // Get start and end dates for the query
      const startDate = this.formatDateForSupabase(this.currentDate);
      
      const endDate = this.formatDateForSupabase(new Date(this.currentDate.getTime() + this.numberOfDays * 24 * 60 * 60 * 1000));
      
      // Load availability types
      this.availabilityTypes = await this.reservationsService.getAvailabilityTypes();
      
      // Get houses with availability status
      const housesWithAvailability = await this.reservationsService.getHousesWithAvailabilityStatus(startDate, endDate);
      this.houses = housesWithAvailability;
      
      // Create a mock mapping of mobileHomes for backward compatibility
      this.mobileHomes = this.houses.map(house => ({
        house_id: house.house_id,
        housename: house.house_name,
        housetype: house.house_type_id || 1,
        housetypename: 'Standard', // Default
        availabilityid: 1, // Default
        availabilityname: 'Available', // Default
        housetasks: []
      }));
      
      // Convert availabilities to the format expected by the template
      this.reservations = {};
      
      this.houses.forEach(house => {
        if (house.availabilities && house.availabilities.length > 0) {
          this.reservations[house.house_id] = {};
          
          house.availabilities.forEach((availability: any) => {
            // Find the corresponding availability type
            const availabilityType = this.availabilityTypes.find(
              type => type.house_availability_type_id === availability.availability_type_id
            );
            
            // Get the date range covered by this availability
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            // For each day in the range, add a reservation entry
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              const day = `${currentDate.getDate()}.${currentDate.getMonth() + 1}`;
              
              if (!this.reservations[house.house_id]) {
                this.reservations[house.house_id] = {};
              }
              
              // Find a suitable color based on the guest name
              const colorEntry = this.reservationColors.find(c => 
                c.name.toLowerCase() === (availability.guest_name || '').toLowerCase()
              ) || this.reservationColors[0];
              
              this.reservations[house.house_id][day] = {
                house_availability_id: availability.house_availability_id,
                guest: availability.guest_name || 'Unknown',
                color: colorEntry.color,
                phone: availability.guest_phone || '',
                availability_type_id: availability.availability_type_id,
                availability_name: availabilityType?.house_availability_type_name || 'Unknown'
              };
              
              // Move to the next day
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
        }
      });
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load reservation data. Please try again.';
      this.isLoading = false;
    }
  }

  loadMockData(): void {
    this.isLoading = true;
    
    // Create mock houses (approximately 15 per house type)
    this.mobileHomes = [];
    
    // Generate houses for each type
    const houseTypes = [1, 2, 3, 4]; // House type IDs
    const houseTypeNames = ['Type 1', 'Type 2', 'Type 3', 'Type 4'];
    
    let houseId = 641;
    
    // For each house type, create about 15 houses
    houseTypes.forEach((typeId, typeIndex) => {
      const typeName = houseTypeNames[typeId - 1];
      
      // Create 15 houses of this type
      for (let i = 0; i < 15; i++) {
        this.mobileHomes.push({
          house_id: houseId,
          housename: `Room ${houseId}`,
          housetype: typeId,
          housetypename: typeName,
          availabilityid: 1,
          availabilityname: 'Available',
          housetasks: []
        });
        
        houseId++;
      }
    });
    
    // Initialize filtered homes with all homes
    this.filteredMobileHomes = [...this.mobileHomes];
    
    // Create mock availability types - only "Occupied" now
    this.availabilityTypes = [
      { house_availability_type_id: 63, house_availability_type_name: 'Occupied' }
    ];
    
    // Create mock reservations for all months
    this.reservations = {};
    
    // Create guest names array for more variety
    const guestNames = [
      'Zimak', 'Simon', 'Becker', 'Unterrainer', 'Pressl', 'Monde',
      'Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 
      'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson'
    ];
    
    // Define interface for reservation data
    interface MockReservation {
      house_id: number;
      start_day: number;
      end_day: number;
      month: number;
      guest: string;
      phone: string;
      type_id: number;
      adults: number;
      children: number;
      extraBeds: number;
      pets: number;
      notes: string;
      isMultiMonth?: boolean;
      multiMonthId?: string;
    }
    
    // Create some sample reservations with guest details
    const sampleReservations: MockReservation[] = [];
    
    // Generate random reservations across all houses for all months
    for (let month = 1; month <= 12; month++) {
      // Get days in this month
      const daysInMonth = new Date(2024, month, 0).getDate();
      
      // Generate multiple reservations per month (about 50% occupancy)
      const totalReservations = Math.floor(this.mobileHomes.length * 0.5);
      
      for (let i = 0; i < totalReservations; i++) {
        // Random house from our array
        const randomHouseIndex = Math.floor(Math.random() * this.mobileHomes.length);
        const house = this.mobileHomes[randomHouseIndex];
        
        // Random start/end dates for this month
        const startDay = Math.floor(Math.random() * (daysInMonth - 7)) + 1; // 1 to (daysInMonth-7)
        const duration = Math.floor(Math.random() * 10) + 3; // 3-12 days
        const endDay = Math.min(startDay + duration, daysInMonth); // Ensure we don't go beyond month
        
        // Random guest details
        const guestIndex = Math.floor(Math.random() * guestNames.length);
        const adults = Math.floor(Math.random() * 3) + 1; // 1-3 adults
        const children = Math.floor(Math.random() * 4); // 0-3 children
        const extraBeds = Math.floor(Math.random() * 2); // 0-1 extra beds
        const pets = Math.random() > 0.8 ? 1 : 0; // 20% chance of pets
        
        // Notes options
        const notesOptions = [
          '', '', '', // Empty notes more likely
          'Early check-in requested',
          'Late check-out requested',
          'Anniversary celebration',
          'Birthday during stay',
          'Business trip',
          'Family vacation',
          'Returning guest',
          'Needs extra towels'
        ];
        const notesIndex = Math.floor(Math.random() * notesOptions.length);
        
        // Phone number generation
        const areaCode = Math.floor(Math.random() * 900) + 100;
        const prefix = Math.floor(Math.random() * 900) + 100;
        const lineNum = Math.floor(Math.random() * 9000) + 1000;
        const phone = `${areaCode}-${prefix}-${lineNum}`;
        
        // Only add if it doesn't overlap with an existing reservation
        // Check if this house already has a reservation in this range
        let hasOverlap = false;
        
        // Look for existing reservations for this house in this month
        const existingReservations = sampleReservations.filter(res => 
          res.house_id === house.house_id && res.month === month
        );
        
        // Check for overlaps
        for (const existing of existingReservations) {
          if ((startDay <= existing.end_day && endDay >= existing.start_day)) {
            hasOverlap = true;
            break;
          }
        }
        
        // Add reservation if no overlap
        if (!hasOverlap) {
          sampleReservations.push({
            house_id: house.house_id,
            start_day: startDay,
            end_day: endDay,
            month: month,
            guest: guestNames[guestIndex],
            phone: phone,
            type_id: 63,
            adults: adults,
            children: children,
            extraBeds: extraBeds,
            pets: pets,
            notes: notesOptions[notesIndex]
          });
        }
      }
      
      // Add some multi-month reservations (spanning from this month to next)
      if (month < 12) {
        // Add approximately 10% of houses with multi-month reservations
        const multiMonthCount = Math.floor(this.mobileHomes.length * 0.1);
        
        for (let i = 0; i < multiMonthCount; i++) {
          // Random house from our array that doesn't have a reservation at month end
          let foundValidHouse = false;
          let attempts = 0;
          let house: MobileHome | undefined;
          
          while (!foundValidHouse && attempts < 20) {
            attempts++;
            const randomHouseIndex = Math.floor(Math.random() * this.mobileHomes.length);
            house = this.mobileHomes[randomHouseIndex];
            
            if (!house) continue;
            
            // Check if this house has reservations at the end of current month
            const existingAtMonthEnd = sampleReservations.some(res => 
              res.house_id === house!.house_id && 
              res.month === month && 
              res.end_day > daysInMonth - 5
            );
            
            // Check if this house has reservations at the start of next month
            const existingAtNextMonthStart = sampleReservations.some(res => 
              res.house_id === house!.house_id && 
              res.month === month + 1 && 
              res.start_day < 5
            );
            
            if (!existingAtMonthEnd && !existingAtNextMonthStart) {
              foundValidHouse = true;
            }
          }
          
          // If we found a valid house, add a multi-month reservation
          if (foundValidHouse && house) {
            // Start in last week of current month
            const startDay = daysInMonth - Math.floor(Math.random() * 5) - 2; // Last 1-7 days
            
            // End in first week of next month
            const endDay = Math.floor(Math.random() * 6) + 1; // First 1-7 days of next month
            
            // Random guest details
            const guestIndex = Math.floor(Math.random() * guestNames.length);
            const adults = Math.floor(Math.random() * 3) + 1;
            const children = Math.floor(Math.random() * 4);
            const extraBeds = Math.floor(Math.random() * 2);
            const pets = Math.random() > 0.8 ? 1 : 0;
            
            // Generate phone and notes
            const areaCode = Math.floor(Math.random() * 900) + 100;
            const prefix = Math.floor(Math.random() * 900) + 100;
            const lineNum = Math.floor(Math.random() * 9000) + 1000;
            const phone = `${areaCode}-${prefix}-${lineNum}`;
            
            const notesOptions = [
              '', '', '', 'Extended stay', 'Business travel', 'Vacation'
            ];
            const notes = notesOptions[Math.floor(Math.random() * notesOptions.length)];
            
            // Add current month portion
            sampleReservations.push({
              house_id: house.house_id,
              start_day: startDay,
              end_day: daysInMonth,
              month: month,
              guest: guestNames[guestIndex],
              phone: phone,
              type_id: 63,
              adults: adults,
              children: children,
              extraBeds: extraBeds,
              pets: pets,
              notes: notes,
              isMultiMonth: true,
              multiMonthId: `multi-${month}-${house.house_id}`
            });
            
            // Add next month portion
            sampleReservations.push({
              house_id: house.house_id,
              start_day: 1,
              end_day: endDay,
              month: month + 1,
              guest: guestNames[guestIndex],
              phone: phone,
              type_id: 63,
              adults: adults,
              children: children,
              extraBeds: extraBeds,
              pets: pets,
              notes: notes,
              isMultiMonth: true,
              multiMonthId: `multi-${month}-${house.house_id}`
            });
          }
        }
      }
    }
    
    // Process each reservation
    sampleReservations.forEach((reservation, index) => {
      if (!this.reservations[reservation.house_id]) {
        this.reservations[reservation.house_id] = {};
      }
      
      // Create a unique reservation ID for the entire period
      const reservationId = reservation.multiMonthId || `res-${index + 1}`;
      
      // Find or create color for this guest
      let colorEntry = this.reservationColors.find(c => 
        c.name.toLowerCase() === reservation.guest.toLowerCase()
      );
      
      // If no color found, generate a random pastel color
      if (!colorEntry) {
        const hue = Math.floor(Math.random() * 360);
        const pastelColor = `hsl(${hue}, 70%, 85%)`;
        colorEntry = { name: reservation.guest, color: pastelColor };
      }
      
      // Add an entry for each day in the range
      for (let day = reservation.start_day; day <= reservation.end_day; day++) {
        const dayStr = `${day}.${reservation.month}`; // Format as day.month
        
        // For multi-month reservations, find the min and max months for this ID
        const isFirstDay = day === reservation.start_day;
        const isLastDay = day === reservation.end_day;
        
        let firstDayOfReservation = isFirstDay;
        let lastDayOfReservation = isLastDay;
        
        // For multi-month reservations
        if (reservation.isMultiMonth && reservation.multiMonthId) {
          const allPartsOfReservation = sampleReservations.filter(r => 
            r.multiMonthId === reservation.multiMonthId
          );
          
          const minMonth = Math.min(...allPartsOfReservation.map(r => r.month));
          const maxMonth = Math.max(...allPartsOfReservation.map(r => r.month));
          
          // This is the first day of the whole reservation if it's the first day in the earliest month
          firstDayOfReservation = isFirstDay && reservation.month === minMonth;
          
          // This is the last day of the whole reservation if it's the last day in the latest month
          lastDayOfReservation = isLastDay && reservation.month === maxMonth;
        }
        
        this.reservations[reservation.house_id][dayStr] = {
          house_availability_id: Math.floor(Math.random() * 10000),
          reservationId: reservationId, // Same ID for all days in this reservation
          guest: reservation.guest,
          color: colorEntry.color,
          phone: reservation.phone,
          availability_type_id: reservation.type_id,
          availability_name: 'Occupied',
          isFirstDay: firstDayOfReservation, // Add flag to indicate first day of reservation
          isLastDay: lastDayOfReservation, // Add flag to indicate last day of reservation
          startDay: reservation.start_day,
          startMonth: reservation.month,
          endDay: reservation.end_day,
          endMonth: reservation.month,
          // Add guest details
          adults: reservation.adults,
          children: reservation.children,
          extraBeds: reservation.extraBeds,
          pets: reservation.pets,
          notes: reservation.notes
        };
      }
    });
    
    // After a brief delay, hide loading
    setTimeout(() => {
      this.isLoading = false;
    }, 500); // 500ms delay to simulate loading
  }

  getReservation(houseId: number, day: string): any {
    return this.reservations[houseId]?.[day] || null;
  }

  hasReservation(houseId: number, day: string): boolean {
    return !!this.getReservation(houseId, day);
  }

  // Track which reservation is currently being hovered
  hoveredReservationId: string | null = null;

  onReservationHover(reservationId: string | null): void {
    this.hoveredReservationId = reservationId;
  }

  isReservationHovered(houseId: number, day: string): boolean {
    const reservation = this.getReservation(houseId, day);
    return reservation && this.hoveredReservationId === reservation.reservationId;
  }

  getCellStyle(houseId: number, day: string): any {
    const reservation = this.getReservation(houseId, day);
    
    if (reservation) {
      // All entries are "Occupied" now, so just return the color
      const isHovered = this.isReservationHovered(houseId, day);
      
      let style: any = {
        'background-color': reservation.color,
        'cursor': 'pointer'
      };
      
      // If this reservation is being hovered over, add a border
      if (isHovered) {
        // First day of reservation (left border)
        if (reservation.isFirstDay) {
          style['border-left'] = '2px solid #333';
          style['border-top'] = '2px solid #333';
          style['border-bottom'] = '2px solid #333';
        } 
        // Last day of reservation (right border)
        else if (reservation.isLastDay) {
          style['border-right'] = '2px solid #333';
          style['border-top'] = '2px solid #333';
          style['border-bottom'] = '2px solid #333';
        } 
        // Middle days
        else {
          style['border-top'] = '2px solid #333';
          style['border-bottom'] = '2px solid #333';
        }
      }
      
      return style;
    } else {
      // Empty cell - check if it's selected
      if (this.selectedEmptyCell && 
          this.selectedEmptyCell.houseId === houseId && 
          this.selectedEmptyCell.day === day) {
        return {
          'border': '2px dotted #4285f4',
          'animation': 'pulse-border 1.5s infinite',
          'cursor': 'pointer'
        };
      }
      
      // Check if cell is part of the dragged range
      if (this.isDraggedCell(houseId, day)) {
        return {
          'background-color': 'rgba(66, 133, 244, 0.2)',
          'border': '1px solid #4285f4',
          'cursor': 'pointer'
        };
      }
      
      // Check if cell is part of pending reservation range
      if (this.isPendingReservationCell(houseId, day)) {
        return {
          'border': '2px dotted #4285f4',
          'background-color': 'rgba(66, 133, 244, 0.15)',
          'cursor': 'pointer'
        };
      }
      
      return {
        'cursor': 'pointer'
      };
    }
  }

  // Check if cell is part of the dragged range
  isDraggedCell(houseId: number, day: string): boolean {
    if (!this.isDragging || !this.dragStartCell || !this.dragEndCell) {
      return false;
    }
    
    // Only consider dragging within the same house row
    if (this.dragStartCell.houseId !== houseId || this.dragEndCell.houseId !== houseId) {
      return false;
    }
    
    // Parse day strings to numbers
    const [startDayNum, startMonthNum] = this.dragStartCell.day.split('.').map(Number);
    const [endDayNum, endMonthNum] = this.dragEndCell.day.split('.').map(Number);
    const [cellDayNum, cellMonthNum] = day.split('.').map(Number);
    
    // Modified to allow dragging across different months
    // Calculate date values for comparison
    const startDate = new Date(this.currentDate.getFullYear(), startMonthNum - 1, startDayNum);
    const endDate = new Date(this.currentDate.getFullYear(), endMonthNum - 1, endDayNum);
    const cellDate = new Date(this.currentDate.getFullYear(), cellMonthNum - 1, cellDayNum);
    
    // Determine if this cell is in the dragged range (inclusive)
    const minDate = startDate < endDate ? startDate : endDate;
    const maxDate = startDate > endDate ? startDate : endDate;
    
    return cellDate >= minDate && cellDate <= maxDate;
  }
  
  // Handle mouse down on a cell - start dragging
  onCellMouseDown(houseId: number, day: string, event: MouseEvent): void {
    // Only allow dragging from empty cells
    if (!this.hasReservation(houseId, day)) {
      // Start dragging
      this.dragStartCell = { houseId, day };
      this.dragEndCell = { houseId, day };
      this.isDragging = true;
      
      // Prevent text selection while dragging
      event.preventDefault();
    }
  }
  
  // Handle mouse move over cells - update drag end position
  onCellMouseOver(houseId: number, day: string): void {
    // Only update if we're dragging and on the same house row
    if (this.isDragging && this.dragStartCell && this.dragStartCell.houseId === houseId) {
      this.dragEndCell = { houseId, day };
    }
  }
  
  // Handle mouse up - finalize drag selection
  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    if (this.isDragging && this.dragStartCell && this.dragEndCell) {
      // Only handle drag completion if we have a valid range
      // Extract the house ID
      const houseId = this.dragStartCell.houseId;
      
      // Parse day strings to numbers for comparison
      const [startDayNum, startMonthNum] = this.dragStartCell.day.split('.').map(Number);
      const [endDayNum, endMonthNum] = this.dragEndCell.day.split('.').map(Number);
      
      // Create Date objects for easier comparison
      const year = this.currentDate.getFullYear();
      const startDate = new Date(year, startMonthNum - 1, startDayNum);
      const endDate = new Date(year, endMonthNum - 1, endDayNum);
      
      // Ensure start date is before end date
      let minDate = startDate;
      let maxDate = endDate;
      
      if (startDate > endDate) {
        minDate = endDate;
        maxDate = startDate;
      }
      
      // Check for any existing reservations in the range
      let canCreateReservation = true;
      
      // Iterate through each day in the range
      const iterationDate = new Date(minDate);
      while (iterationDate <= maxDate) {
        const day = iterationDate.getDate();
        const month = iterationDate.getMonth() + 1;
        const dayStr = `${day}.${month}`;
        
        if (this.hasReservation(houseId, dayStr)) {
          canCreateReservation = false;
          break;
        }
        
        // Move to the next day
        iterationDate.setDate(iterationDate.getDate() + 1);
      }
      
      if (canCreateReservation) {
        // Store pending reservation range info
        this.pendingReservationRange = {
          houseId: houseId,
          startDay: minDate.getDate(),
          endDay: maxDate.getDate(),
          month: minDate.getMonth() + 1
        };
        
        // Setup new reservation data with the selected range
        this.newReservation = {
          house_id: houseId,
          guest_name: '',
          guest_phone: '',
          start_date: `${this.currentDate.getFullYear()}-${minDate.getMonth() + 1}-${minDate.getDate()}`,
          end_date: `${this.currentDate.getFullYear()}-${maxDate.getMonth() + 1}-${maxDate.getDate()}`,
          adults: 1,
          children: 0,
          extraBeds: 0,
          pets: 0,
          notes: ''
        };
        
        // Set the mouse event position for popup using the document event
        this.calculatePopupPosition(event);
        
        // Show new reservation popup
        this.showNewReservationPopup = true;
      } else {
        alert('Cannot create a reservation: The selected range overlaps with existing reservations.');
        // Clear the pending reservation if there's an overlap
        this.pendingReservationRange = null;
      }
    }
    
    // Clear drag state
    this.isDragging = false;
    this.dragStartCell = null;
    this.dragEndCell = null;
  }

  async onCellClick(houseId: number, day: string, event: MouseEvent): Promise<void> {
    // Stop propagation to prevent document click handler from firing
    event.stopPropagation();
    
    // If we just finished dragging, don't handle as a click
    // The drag completion will be handled by onDocumentMouseUp
    if (this.isDragging) {
      return;
    }
    
    console.log(`Clicked on house ${houseId} for day ${day}`);
    
    const reservation = this.getReservation(houseId, day);
    
    if (reservation) {
      // For existing reservations, show details popup
      this.showNewReservationPopup = false;
      this.selectedEmptyCell = null;
      this.pendingReservationRange = null;
      
      // Set selected reservation
      this.selectedReservation = reservation;
      
      // Calculate popup position and show it (existing code)
      this.calculatePopupPosition(event);
      this.showPopup = true;
    } else {
      // Empty cell - select it and show new reservation popup
      this.showPopup = false;
      this.selectedReservation = null;
      
      // Toggle selection if clicking on the same cell
      if (this.selectedEmptyCell && 
          this.selectedEmptyCell.houseId === houseId && 
          this.selectedEmptyCell.day === day) {
        this.selectedEmptyCell = null;
        this.showNewReservationPopup = false;
        this.pendingReservationRange = null;
        return;
      }
      
      // Set selected empty cell
      this.selectedEmptyCell = { houseId, day };
      
      // Parse the day string to get date information
      const [dayNum, monthNum] = day.split('.').map(Number);
      
      // Set the pending reservation range for a single day
      this.pendingReservationRange = {
        houseId: houseId,
        startDay: dayNum,
        endDay: dayNum,
        month: monthNum
      };
      
      // Setup new reservation data
      this.newReservation = {
        house_id: houseId,
        guest_name: '',
        guest_phone: '',
        start_date: `${this.currentDate.getFullYear()}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`,
        end_date: `${this.currentDate.getFullYear()}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`,
        adults: 1,
        children: 0,
        extraBeds: 0,
        pets: 0,
        notes: ''
      };
      
      // Calculate and set popup position
      this.calculatePopupPosition(event);
      
      // Show new reservation popup
      this.showNewReservationPopup = true;
    }
  }
  
  // Helper method to calculate popup position
  calculatePopupPosition(event: MouseEvent): void {
    const offset = 15; // Offset from the cursor
    
    // Wait for the next tick to ensure the DOM has been updated before calculating position
    setTimeout(() => {
      // Get target popup element (either existing or new reservation popup)
      const popupSelector = this.showPopup ? '.reservation-popup' : '.new-reservation-popup';
      const popupEl = document.querySelector(popupSelector) as HTMLElement;
      
      if (popupEl) {
        const popupWidth = popupEl.offsetWidth;
        const popupHeight = popupEl.offsetHeight;
        
        // Calculate available space
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // For small row heights, position the popup above the cursor if there's enough space
        let left = event.clientX + offset;
        // Position above if there's not enough space below and enough space above
        let top = event.clientY + popupHeight + offset > viewportHeight && event.clientY > popupHeight + offset 
          ? event.clientY - popupHeight - 5 // 5px gap above cursor
          : event.clientY + offset;
        
        // Adjust if too close to right edge
        if (left + popupWidth > viewportWidth - 20) {
          left = Math.max(20, event.clientX - popupWidth - 5); // 5px gap to the left
        }
        
        // Ensure the popup is not positioned off-screen on the left or top
        left = Math.max(20, left);
        top = Math.max(20, top);
        
        // Apply the position to the appropriate popup
        const position = {
          top: `${top}px`,
          left: `${left}px`
        };
        
        if (this.showPopup) {
          this.popupPosition = position;
        } else {
          this.newReservationPopupPosition = position;
        }
      }
    }, 0);
  }

  // Method to create a new reservation based on form data
  createNewReservation(): void {
    // Parse dates to get the date range
    const startDate = new Date(this.newReservation.start_date);
    const endDate = new Date(this.newReservation.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert('Please enter valid start and end dates');
      return;
    }
    
    if (endDate < startDate) {
      alert('End date cannot be before start date');
      return;
    }
    
    // Get start and end day numbers for the month
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    
    // Remove the month restriction check since we now support all months
    // Check for any existing reservations in the new range
    // But skip checking cells that are part of the current reservation if we're editing
    let canCreateReservation = true;
    let existingReservationId = null;
    
    // If we're editing, get the existing reservation ID to exclude from overlap check
    if (this.selectedReservation) {
      existingReservationId = this.selectedReservation.reservationId;
    }
    
    // Check each day in the range for existing reservations
    const checkDate = new Date(startDate);
    while (checkDate <= endDate) {
      const day = checkDate.getDate();
      const month = checkDate.getMonth() + 1;
      const dayStr = `${day}.${month}`;
      
      const existingReservation = this.getReservation(this.newReservation.house_id, dayStr);
      
      if (existingReservation && (!existingReservationId || existingReservation.reservationId !== existingReservationId)) {
        canCreateReservation = false;
        break;
      }
      
      // Move to the next day
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (!canCreateReservation) {
      alert('Cannot create a reservation: The selected range overlaps with existing reservations.');
      return;
    }
    
    // Create a new reservation entry
    const reservationId = existingReservationId || Math.random().toString(36).substr(2, 9);
    const colorEntry = this.getGuestColorEntry(this.newReservation.guest_name);
      
    // For each day in the range, add a reservation entry
    const reservationDate = new Date(startDate);
    while (reservationDate <= endDate) {
      const day = reservationDate.getDate();
      const month = reservationDate.getMonth() + 1;
      const dayStr = `${day}.${month}`;
      
      const isFirstDay = reservationDate.getTime() === startDate.getTime();
      const isLastDay = reservationDate.getTime() === endDate.getTime();
      
      if (!this.reservations[this.newReservation.house_id]) {
        this.reservations[this.newReservation.house_id] = {};
      }
      
      this.reservations[this.newReservation.house_id][dayStr] = {
        house_availability_id: Math.floor(Math.random() * 10000),
        house_id: this.newReservation.house_id,
        reservationId: reservationId,
        guest: this.newReservation.guest_name || 'New Guest',
        color: colorEntry.color,
        phone: this.newReservation.guest_phone || '',
        availability_type_id: 63, // Default occupied type
        availability_name: 'Occupied',
        isFirstDay: isFirstDay,
        isLastDay: isLastDay,
        startDay: startDay,
        startMonth: startMonth,
        endDay: endDay,
        endMonth: endMonth,
        adults: this.newReservation.adults,
        children: this.newReservation.children,
        extraBeds: this.newReservation.extraBeds,
        pets: this.newReservation.pets,
        notes: this.newReservation.notes
      };
      
      // Move to the next day
      reservationDate.setDate(reservationDate.getDate() + 1);
    }
    
    // Clear selection and close popup
    this.selectedEmptyCell = null;
    this.pendingReservationRange = null;
    this.showNewReservationPopup = false;
    this.selectedReservation = null;
  }
  
  // Method to cancel new reservation creation
  cancelNewReservation(): void {
    this.selectedEmptyCell = null;
    this.pendingReservationRange = null;
    this.showNewReservationPopup = false;
  }

  // Method to close the popup
  closePopup(): void {
    this.showPopup = false;
    this.selectedReservation = null;
  }

  // Method to edit an existing reservation
  editReservation(): void {
    if (!this.selectedReservation) return;
    
    // Prepare the new reservation form with the existing data
    this.newReservation = {
      house_id: this.selectedReservation.house_id || 0,
      guest_name: this.selectedReservation.guest || '',
      guest_phone: this.selectedReservation.phone || '',
      start_date: `${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}-${this.selectedReservation.startDay}`,
      end_date: `${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}-${this.selectedReservation.endDay}`,
      adults: this.selectedReservation.adults || 1,
      children: this.selectedReservation.children || 0,
      extraBeds: this.selectedReservation.extraBeds || 0,
      pets: this.selectedReservation.pets || 0,
      notes: this.selectedReservation.notes || ''
    };
    
    // Set the pending reservation range for highlighting
    this.pendingReservationRange = {
      houseId: this.selectedReservation.house_id,
      startDay: this.selectedReservation.startDay,
      endDay: this.selectedReservation.endDay,
      month: this.currentDate.getMonth() + 1
    };
    
    // Calculate position for new popup
    const popupEl = document.querySelector('.reservation-popup') as HTMLElement;
    if (popupEl) {
      this.newReservationPopupPosition = this.popupPosition;
    }
    
    // Close the details popup and show the edit popup
    this.showPopup = false;
    this.showNewReservationPopup = true;
  }
  
  // Method to remove an existing reservation
  removeReservation(): void {
    if (!this.selectedReservation || !confirm('Are you sure you want to remove this reservation?')) {
      return;
    }
    
    // Get reservation ID to find all days to remove
    const reservationId = this.selectedReservation.reservationId;
    
    // Find all entries with this reservation ID and remove them
    Object.keys(this.reservations).forEach(houseId => {
      const house = this.reservations[houseId];
      Object.keys(house).forEach(day => {
        if (house[day].reservationId === reservationId) {
          delete house[day];
        }
      });
    });
    
    // Close the popup
    this.closePopup();
  }

  formatDateForSupabase(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Add this helper function to get month name for a given index
  getMonthName(monthIndex: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex - 1];
  }

  // Helper method to get the month number from month name
  getMonthNumber(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const index = months.findIndex(m => m === monthName);
    return index !== -1 ? index + 1 : 1; // Return 1-based month number (January = 1)
  }
  
  // Helper method to get the days for a specific month
  getMonthDays(month: { name: string, days: string[] }): number[] {
    // Get the month index (0-based)
    const monthIndex = this.getMonthNumber(month.name) - 1;
    const year = this.currentDate.getFullYear();
    
    // Get number of days in this month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // Create array of day numbers: [1, 2, 3, ..., daysInMonth]
    const dayNumbers: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      dayNumbers.push(i);
    }
    
    return dayNumbers;
  }

  // Add a click outside listener
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // If popup is showing and click is outside the popup, close it
    if (this.showPopup) {
      const popupElement = document.querySelector('.reservation-popup');
      if (popupElement && !popupElement.contains(event.target as Node)) {
        // Don't close if clicking on a reservation cell that triggered the popup
        const target = event.target as HTMLElement;
        if (!target.classList.contains('reservation-cell')) {
          this.closePopup();
        }
      }
    }
    
    // Also handle the new reservation popup
    if (this.showNewReservationPopup) {
      const popupElement = document.querySelector('.new-reservation-popup');
      if (popupElement && !popupElement.contains(event.target as Node)) {
        // Don't close if clicking on the cell that triggered the popup
        const target = event.target as HTMLElement;
        if (!target.classList.contains('reservation-cell')) {
          this.cancelNewReservation();
        }
      }
    }
  }

  // Method to prevent clicks inside the popup from propagating to document
  onPopupClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  // Check if cell is part of pending reservation range
  isPendingReservationCell(houseId: number, day: string): boolean {
    if (!this.pendingReservationRange || this.pendingReservationRange.houseId !== houseId) {
      return false;
    }
    
    // Parse day string
    const [cellDayNum, cellMonthNum] = day.split('.').map(Number);
    
    // Check if the day falls within the pending reservation range
    // and is in the same month
    return (
      cellMonthNum === this.pendingReservationRange.month &&
      cellDayNum >= this.pendingReservationRange.startDay &&
      cellDayNum <= this.pendingReservationRange.endDay
    );
  }

  // Update pending reservation range when form dates change
  onDateInputChange(): void {
    if (this.newReservation.start_date && this.newReservation.end_date) {
      const startDate = new Date(this.newReservation.start_date);
      const endDate = new Date(this.newReservation.end_date);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const monthNum = startDate.getMonth() + 1;
        
        if (this.pendingReservationRange && startDate.getMonth() === endDate.getMonth()) {
          // Update the pending range to match the form dates
          this.pendingReservationRange = {
            ...this.pendingReservationRange,
            startDay: startDay,
            endDay: endDay,
            month: monthNum
          };
        }
      }
    }
  }

  // Add helper function to get color for guest
  getGuestColorEntry(guestName: string): { name: string, color: string } {
    // If no guest name, return a default color
    if (!guestName) {
      return { name: 'Default', color: '#d8d8d8' };
    }
    
    // Try to find a matching guest color
    const existingEntry = this.reservationColors.find(entry => 
      guestName.toLowerCase().includes(entry.name.toLowerCase())
    );
    
    if (existingEntry) {
      return existingEntry;
    }
    
    // If no match, choose a random color
    const randomIndex = Math.floor(Math.random() * this.reservationColors.length);
    return this.reservationColors[randomIndex];
  }
}
