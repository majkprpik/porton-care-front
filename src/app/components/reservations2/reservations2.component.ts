import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { ReservationsService } from '../../services/reservations.service';
import { MobileHome } from '../../models/mobile-home.interface';

interface ReservationRow {
  house_id: number;
  room: string;
  type: string;
  dates: string[];
  reservations: { [key: string]: ReservationInfo };
}

interface ReservationInfo {
  reservationId: string;
  guest: string;
  color: string;
  phone: string;
  adults: number;
  children: number;
  extraBeds: number;
  pets: number;
  notes: string;
  startDay: number;
  startMonth: number;
  endDay: number;
  endMonth: number;
  isFirstDay: boolean;
  isLastDay: boolean;
  house_id: number;
}

// Interface for drag ghost data
interface DragGhostData {
  guest: string;
  startDate: string;
  endDate: string;
  reservationId: string;
  color: string;
}

@Component({
  selector: 'app-reservations2',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    ScrollingModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './reservations2.component.html',
  styleUrl: './reservations2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservations2Component implements OnInit, OnDestroy {
  // Dates for columns
  dates: string[] = [];
  displayedColumns: string[] = ['room'];
  
  // Data for rows
  mobileHomes: MobileHome[] = [];
  reservationRows: ReservationRow[] = [];
  
  // Filtering
  houseTypes: string[] = ['Type 1', 'Type 2', 'Type 3', 'Type 4'];
  currentHouseType: string = 'Type 1';
  
  // Loading state
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Current date for calendar
  currentDate: Date = new Date(2025, 0, 1); // January 1, 2024
  
  // Months to display
  months: { name: string, days: string[] }[] = [];
  
  // Selected reservation
  selectedReservation: ReservationInfo | null = null;
  showPopup: boolean = false;
  popupPosition = { top: '0px', left: '0px' };
  
  // New reservation
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
  showNewReservationPopup: boolean = false;
  newReservationPopupPosition = { top: '0px', left: '0px' };
  
  // Drag selection functionality
  isDragging: boolean = false;
  dragStartDate: string = '';
  dragEndDate: string = '';
  dragHouseId: number | null = null;
  
  // Colors for reservations
  reservationColors = [
    { name: 'Zimak', color: '#f8c9c9' },  // Light red
    { name: 'Simon', color: '#ffffa5' },  // Light yellow
    { name: 'Becker', color: '#d8d8d8' }, // Light gray
    { name: 'Unterrainer', color: '#ffcccc' }, // Light pink
    { name: 'Pressl', color: '#ffffcc' }, // Light yellow
    { name: 'Monde', color: '#ccffff' }   // Light blue
  ];

  // Properties to track highlighted row/column
  activeRowId: number | null = null;
  activeColumnDate: string | null = null;
  
  // Store reference to document click handler for cleanup
  private documentClickHandler: ((event: MouseEvent) => void) | null = null;
  
  // Properties for drag and drop functionality
  draggedReservationId: string | null = null;
  draggedFromHouseId: number | null = null;
  draggedFromDate: string | null = null;
  draggedStartDate: Date | null = null;
  draggedEndDate: Date | null = null;
  draggedDuration: number = 0;
  
  // Ghost element and status message
  dragGhostVisible: boolean = false;
  dragGhostPosition = { top: '0px', left: '0px' };
  dragGhostData: DragGhostData = {
    guest: '',
    startDate: '',
    endDate: '',
    reservationId: '',
    color: ''
  };
  
  // Status message for drag operations
  dragStatusVisible: boolean = false;
  dragStatusMessage: string = '';
  dragStatusSuccess: boolean = true;
  dragStatusTimeoutId: any = null;

  constructor(
    private reservationsService: ReservationsService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.generateYearCalendar();
    this.loadMockData();
    
    // Add document click handler to clear highlighting when clicking outside the reservation grid
    this.documentClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only clear if click is outside the reservation table
      if (!target.closest('.table-container')) {
        this.clearHighlighting();
      }
    };
    
    document.addEventListener('click', this.documentClickHandler);
  }

  generateYearCalendar(): void {
    this.dates = [];
    this.months = [];
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Generate days for Apr-Oct (index 3 to 9)
    const year = this.currentDate.getFullYear();
    
    for (let month = 3; month < 10; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDays: string[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${day}.${month + 1}`;
        this.dates.push(dayStr);
        monthDays.push(dayStr);
      }
      
      this.months.push({
        name: monthNames[month],
        days: monthDays
      });
    }
    
    // Add dates to displayed columns
    this.displayedColumns = ['room', ...this.dates];
  }

  loadMockData(): void {
    this.isLoading = true;
    
    // Generate mock houses (similar to original component)
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
    
    // Generate mock reservations
    const mockReservations: { 
      [key: number]: { [key: string]: ReservationInfo } 
    } = this.generateMockReservations();
    
    // Convert to rows format for virtual table
    this.reservationRows = this.mobileHomes
      .filter(house => house.housetypename === this.currentHouseType)
      .map(house => {
        const reservedDates: string[] = [];
        const houseReservations = mockReservations[house.house_id] || {};
        
        // Add reserved dates to the array
        Object.keys(houseReservations).forEach(date => {
          reservedDates.push(date);
        });
        
        return {
          house_id: house.house_id,
          room: house.housename.split(' ')[1], // Just the number part
          type: house.housetypename,
          dates: reservedDates,
          reservations: houseReservations
        };
      });
    
    this.isLoading = false;
  }

  // Helper method to generate mock reservations with guest details
  generateMockReservations(): { [key: number]: { [key: string]: ReservationInfo } } {
    const reservations: { [key: number]: { [key: string]: ReservationInfo } } = {};
    
    // Create guest names array for more variety
    const guestNames = [
      'Zimak', 'Simon', 'Becker', 'Unterrainer', 'Pressl', 'Monde',
      'Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 
      'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson'
    ];
    
    // Generate random reservations across all houses for relevant months (4-10)
    for (let month = 4; month <= 10; month++) {
      // Get days in this month
      const daysInMonth = new Date(2025, month, 0).getDate();
      
      // Generate multiple reservations per month (about 40% occupancy)
      const totalReservations = Math.floor(this.mobileHomes.length * 0.4);
      
      for (let i = 0; i < totalReservations; i++) {
        // Random house from our array
        const randomHouseIndex = Math.floor(Math.random() * this.mobileHomes.length);
        const house = this.mobileHomes[randomHouseIndex];
        
        // Random start/end dates for this month
        const startDay = Math.floor(Math.random() * (daysInMonth - 7)) + 1; // 1 to (daysInMonth-7)
        const duration = Math.floor(Math.random() * 10) + 3; // 3-12 days
        const endDay = Math.min(startDay + duration, daysInMonth); // Ensure we don't go beyond month
        
        // Random guest details
        const guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
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
        const notes = notesOptions[Math.floor(Math.random() * notesOptions.length)];
        
        // Phone number generation
        const areaCode = Math.floor(Math.random() * 900) + 100;
        const prefix = Math.floor(Math.random() * 900) + 100;
        const lineNum = Math.floor(Math.random() * 9000) + 1000;
        const phone = `${areaCode}-${prefix}-${lineNum}`;
        
        // Only add if this house doesn't already have a reservation for these dates
        let hasOverlap = false;
        
        // Check if this house already has any reservations
        if (reservations[house.house_id]) {
          for (let day = startDay; day <= endDay; day++) {
            const dayStr = `${day}.${month}`;
            if (reservations[house.house_id][dayStr]) {
              hasOverlap = true;
              break;
            }
          }
        }
        
        // Add reservation if no overlap
        if (!hasOverlap) {
          // Generate unique reservation ID
          const reservationId = `res-${house.house_id}-${month}-${startDay}`;
          
          // Find or create color for this guest
          let colorEntry = this.reservationColors.find(c => 
            c.name.toLowerCase() === guestName.toLowerCase()
          );
          
          // If no color found, generate a random pastel color
          if (!colorEntry) {
            const hue = Math.floor(Math.random() * 360);
            const pastelColor = `hsl(${hue}, 70%, 85%)`;
            colorEntry = { name: guestName, color: pastelColor };
          }
          
          // Initialize house reservations if not exists
          if (!reservations[house.house_id]) {
            reservations[house.house_id] = {};
          }
          
          // Add an entry for each day in the range
          for (let day = startDay; day <= endDay; day++) {
            const dayStr = `${day}.${month}`;
            
            reservations[house.house_id][dayStr] = {
              reservationId: reservationId,
              guest: guestName,
              color: colorEntry.color,
              phone: phone,
              adults: adults,
              children: children,
              extraBeds: extraBeds,
              pets: pets,
              notes: notes,
              startDay: startDay,
              startMonth: month,
              endDay: endDay,
              endMonth: month,
              isFirstDay: day === startDay,
              isLastDay: day === endDay,
              house_id: house.house_id
            };
          }
        }
      }
    }
    
    return reservations;
  }

  // Filter houses by type
  changeHouseType(type: string): void {
    this.currentHouseType = type;
    this.loadMockData(); // Reload data with new filter
  }

  // Get reservation details for a specific cell
  getReservation(houseId: number, day: string): ReservationInfo | null {
    const row = this.reservationRows.find(r => r.house_id === houseId);
    if (row && row.reservations[day]) {
      return row.reservations[day];
    }
    return null;
  }

  // Check if a cell has a reservation
  hasReservation(houseId: number, day: string): boolean {
    return this.getReservation(houseId, day) !== null;
  }

  // Check if a cell is being selected by drag
  isDragSelecting(houseId: number, day: string): boolean {
    if (!this.isDragging || this.dragHouseId !== houseId) {
      return false;
    }

    // Handle date comparison for drag selection
    const [startDayNum, startMonthNum] = this.dragStartDate.split('.').map(Number);
    const [endDayNum, endMonthNum] = this.dragEndDate.split('.').map(Number);
    const [dayNum, monthNum] = day.split('.').map(Number);
    
    // Create date objects for comparison
    const startDate = new Date(this.currentDate.getFullYear(), startMonthNum - 1, startDayNum);
    const endDate = new Date(this.currentDate.getFullYear(), endMonthNum - 1, endDayNum);
    const cellDate = new Date(this.currentDate.getFullYear(), monthNum - 1, dayNum);
    
    // Set hours to 0 for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Handle reverse drag direction (if end date is before start date)
    if (endDate < startDate) {
      return cellDate >= endDate && cellDate <= startDate;
    }
    
    // Check if the cell date is within the drag range
    return cellDate >= startDate && cellDate <= endDate;
  }

  // Check if a cell is part of a pending reservation
  isPendingReservation(houseId: number, day: string): boolean {
    if (!this.showNewReservationPopup || this.newReservation.house_id !== houseId) {
      return false;
    }
    
    // If there's no start or end date set, return false
    if (!this.newReservation.start_date || !this.newReservation.end_date) {
      return false;
    }
    
    // Parse the day string
    const [dayNum, monthNum] = day.split('.').map(Number);
    
    // Parse start and end dates from the new reservation
    const startDate = new Date(this.newReservation.start_date);
    const endDate = new Date(this.newReservation.end_date);
    
    // Ensure valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }
    
    // Create a date object for the current cell
    const cellDate = new Date(this.currentDate.getFullYear(), monthNum - 1, dayNum);
    
    // Important: Set time components to 0 for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Check if the cell date is within the reservation range (inclusive)
    return cellDate >= startDate && cellDate <= endDate;
  }

  // Handle mouse down on a reservation cell
  onCellMouseDown(houseId: number, day: string, event: MouseEvent): void {
    // Clear any row/column highlighting when starting a drag operation
    this.clearHighlighting();
    
    // Skip if right-click
    if (event.button !== 0) return;
    
    // If cell has a reservation, handle the click instead
    if (this.hasReservation(houseId, day)) {
      this.onCellClick(houseId, day, event);
      return;
    }
    
    // Skip if cell is part of a pending reservation
    if (this.isPendingReservation(houseId, day)) return;
    
    // Initialize drag operation
    this.isDragging = true;
    this.dragHouseId = houseId;
    this.dragStartDate = day;
    this.dragEndDate = day;
    
    // Add a mouse up handler to the document to catch mouse releases outside the cells
    document.addEventListener('mouseup', this.onDocumentMouseUp);
    
    event.stopPropagation();
    event.preventDefault();
  }

  // Handle cell mousemove for dragging
  onCellMouseMove(houseId: number, day: string, event: MouseEvent): void {
    if (!this.isDragging || this.dragHouseId !== houseId) {
      return;
    }
    
    event.preventDefault();
    this.dragEndDate = day;
  }

  // Handle cell mouseup to end dragging
  onCellMouseUp(houseId: number, day: string, event: MouseEvent): void {
    if (!this.isDragging || this.dragHouseId !== houseId) {
      return;
    }
    
    event.preventDefault();
    this.finalizeDragSelection();
  }

  // Handle document mouseup (in case mouse is released outside the grid)
  onDocumentMouseUp = (event: MouseEvent): void => {
    if (this.isDragging) {
      event.preventDefault();
      this.finalizeDragSelection();
    }
    
    this.resetDragState();
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
  }

  // Update pending reservation visuals when dates change in the form
  updatePendingReservation(): void {
    // Validate dates
    const startDate = new Date(this.newReservation.start_date);
    const endDate = new Date(this.newReservation.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return; // Invalid dates
    }
    
    // Set time components to 0 for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < startDate) {
      // User selected end date before start date - swap them
      const tempDate = this.newReservation.start_date;
      this.newReservation.start_date = this.newReservation.end_date;
      this.newReservation.end_date = tempDate;
    }
    
    // Check for overlap with existing reservations
    let hasOverlap = false;
    const checkDate = new Date(new Date(this.newReservation.start_date));
    checkDate.setHours(0, 0, 0, 0);
    const checkEndDate = new Date(new Date(this.newReservation.end_date));
    checkEndDate.setHours(0, 0, 0, 0);
    
    while (checkDate <= checkEndDate) {
      const day = checkDate.getDate();
      const month = checkDate.getMonth() + 1;
      const dayStr = `${day}.${month}`;
      
      if (this.hasReservation(this.newReservation.house_id, dayStr)) {
        hasOverlap = true;
        break;
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (hasOverlap) {
      alert('Warning: The selected date range overlaps with existing reservations');
    }
    
    // Force update of UI
    this.changeDetectorRef.detectChanges();
  }

  // Finalize the drag selection and open the new reservation popup
  finalizeDragSelection(): void {
    if (!this.isDragging || !this.dragHouseId) {
      return;
    }
    
    // Get start and end dates
    const [startDayNum, startMonthNum] = this.dragStartDate.split('.').map(Number);
    const [endDayNum, endMonthNum] = this.dragEndDate.split('.').map(Number);
    
    // Create date objects for comparison
    const startDate = new Date(this.currentDate.getFullYear(), startMonthNum - 1, startDayNum);
    const endDate = new Date(this.currentDate.getFullYear(), endMonthNum - 1, endDayNum);
    
    // Make sure start date is before end date (in case of dragging backwards)
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (endDate < startDate) {
      finalStartDate = endDate;
      finalEndDate = startDate;
    }
    
    // Check for any overlap with existing reservations
    let hasOverlap = false;
    const checkDate = new Date(finalStartDate);
    
    while (checkDate <= finalEndDate) {
      const day = checkDate.getDate();
      const month = checkDate.getMonth() + 1;
      const dayStr = `${day}.${month}`;
      
      if (this.hasReservation(this.dragHouseId, dayStr)) {
        hasOverlap = true;
        break;
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (hasOverlap) {
      alert('Cannot create reservation: The selected range overlaps with existing reservations');
      this.resetDragState();
      return;
    }
    
    // Format dates for the new reservation form
    const formattedStartDate = `${this.currentDate.getFullYear()}-${(finalStartDate.getMonth() + 1).toString().padStart(2, '0')}-${finalStartDate.getDate().toString().padStart(2, '0')}`;
    const formattedEndDate = `${this.currentDate.getFullYear()}-${(finalEndDate.getMonth() + 1).toString().padStart(2, '0')}-${finalEndDate.getDate().toString().padStart(2, '0')}`;
    
    // Setup new reservation data
    this.newReservation = {
      house_id: this.dragHouseId,
      guest_name: '',
      guest_phone: '',
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      adults: 1,
      children: 0,
      extraBeds: 0,
      pets: 0,
      notes: ''
    };
    
    // Calculate position for the popup (use middle of screen)
    const middleEvent = {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 3
    } as MouseEvent;
    
    // First show the popup, then calculate position to ensure measurements are accurate
    this.showNewReservationPopup = true;
    
    // Use requestAnimationFrame to ensure the DOM has updated before positioning
    requestAnimationFrame(() => {
      this.calculatePopupPosition(middleEvent);
      this.changeDetectorRef.detectChanges();
    });
    
    // Reset drag state
    this.resetDragState();
  }

  // Reset drag state
  resetDragState(): void {
    this.isDragging = false;
    this.dragHouseId = null;
    this.dragStartDate = '';
    this.dragEndDate = '';
  }

  // Modified to handle both reservation functionality and highlighting clearance
  onCellClick(houseId: number, date: string, event: MouseEvent): void {
    // First, clear any active highlighting
    this.clearHighlighting();
    
    // Then continue with any existing click behavior
    if (this.hasReservation(houseId, date)) {
      this.showReservationDetails(houseId, date, event);
    } else if (!this.isDragging) {
      this.createNewReservationAt(houseId, date, event);
    }
  }

  // Show details for an existing reservation
  showReservationDetails(houseId: number, day: string, event: MouseEvent): void {
    event.stopPropagation();
    
    const reservation = this.getReservation(houseId, day);
    
    if (reservation) {
      // Show details for existing reservation
      this.selectedReservation = reservation;
      
      // Close any open new reservation popup
      this.showNewReservationPopup = false;
      
      // Focus on reservation details by showing the popup
      this.showPopup = true;
      
      // Position popup after it appears in DOM
      requestAnimationFrame(() => {
        this.calculatePopupPosition(event);
        this.changeDetectorRef.detectChanges();
      });
    }
    
    // Add a click handler to close popups when clicking outside
    this.setupPopupCloseHandler();
  }

  // Show form to create a new reservation at specified position
  createNewReservationAt(houseId: number, day: string, event: MouseEvent): void {
    this.selectedReservation = null;
    this.showPopup = false;
    
    // Parse day string to get date info
    const [dayNum, monthNum] = day.split('.').map(Number);
    
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
    
    // Show popup first, then position it
    this.showNewReservationPopup = true;
    
    // Position popup after it appears in DOM
    requestAnimationFrame(() => {
      this.calculatePopupPosition(event);
      this.changeDetectorRef.detectChanges();
    });
    
    // Add a click handler to close popups when clicking outside
    this.setupPopupCloseHandler();
  }

  // Helper method to set up popup close handlers
  setupPopupCloseHandler(): void {
    setTimeout(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        const reservationPopup = document.querySelector('.reservation-popup');
        const newReservationPopup = document.querySelector('.new-reservation-popup');
        
        if (
          (reservationPopup && !reservationPopup.contains(e.target as Node)) &&
          (newReservationPopup && !newReservationPopup.contains(e.target as Node))
        ) {
          this.closePopup();
          this.cancelNewReservation();
          document.removeEventListener('click', handleOutsideClick);
        }
      };
      
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  // Calculate popup position based on click location
  calculatePopupPosition(event: MouseEvent): void {
    const offset = 15;
    
    setTimeout(() => {
      const popupSelector = this.showPopup ? '.reservation-popup' : '.new-reservation-popup';
      const popupEl = document.querySelector(popupSelector) as HTMLElement;
      
      if (popupEl) {
        // Ensure element is visible before measuring
        if (this.showPopup || this.showNewReservationPopup) {
          // Let the DOM render the popup before measuring dimensions
          const popupWidth = popupEl.offsetWidth || 400; // Fallback width if measurement fails
          const popupHeight = popupEl.offsetHeight || 300; // Fallback height if measurement fails
          
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          let left = event.clientX + offset;
          let top = event.clientY + offset;
          
          // Ensure popup stays within viewport boundaries
          // Right edge
          if (left + popupWidth > viewportWidth - 20) {
            left = Math.max(20, event.clientX - popupWidth - 5);
          }
          
          // Bottom edge
          if (top + popupHeight > viewportHeight - 20) {
            top = Math.max(20, event.clientY - popupHeight - 5);
          }
          
          // Ensure minimum positioning (no negative values)
          left = Math.max(20, left);
          top = Math.max(20, top);
          
          const position = {
            top: `${top}px`,
            left: `${left}px`
          };
          
          if (this.showPopup) {
            this.popupPosition = position;
          } else {
            this.newReservationPopupPosition = position;
          }
          
          // Force change detection to update the position
          this.changeDetectorRef.detectChanges();
        }
      }
    }, 10); // Slightly increased timeout to ensure DOM updates
  }

  // Get month name for display
  getMonthName(monthIndex: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex - 1];
  }

  // Calculate the number of nights between start and end dates
  getDateDifference(): number {
    if (!this.newReservation.start_date || !this.newReservation.end_date) {
      return 0;
    }
    
    const startDate = new Date(this.newReservation.start_date);
    const endDate = new Date(this.newReservation.end_date);
    
    // Check for valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    
    // Calculate difference in days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  }

  // Add the missing getMonthNumber method
  getMonthNumber(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const index = months.findIndex(m => m === monthName);
    return index !== -1 ? index + 1 : 1; // Return 1-based month number (January = 1)
  }
  
  // Add the missing getMonthDays method
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

  // Close the details popup
  closePopup(): void {
    this.showPopup = false;
    this.selectedReservation = null;
  }

  // Cancel new reservation creation
  cancelNewReservation(): void {
    this.showNewReservationPopup = false;
    
    // Reset new reservation data
    this.newReservation = {
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
  }

  // Create a new reservation
  createNewReservation(): void {
    // Parse dates
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
    
    // Get day and month info
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    
    // Check for overlapping reservations
    let hasOverlap = false;
    const checkDate = new Date(startDate);
    
    while (checkDate <= endDate) {
      const day = checkDate.getDate();
      const month = checkDate.getMonth() + 1;
      const dayStr = `${day}.${month}`;
      
      if (this.hasReservation(this.newReservation.house_id, dayStr)) {
        hasOverlap = true;
        break;
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (hasOverlap) {
      alert('Cannot create reservation: The selected range overlaps with existing reservations');
      return;
    }
    
    // Generate unique reservation ID
    const reservationId = `res-${this.newReservation.house_id}-${startMonth}-${startDay}-${Date.now()}`;
    
    // Get color for guest
    let colorEntry = this.reservationColors.find(c => 
      c.name.toLowerCase() === this.newReservation.guest_name.toLowerCase()
    );
    
    if (!colorEntry) {
      const hue = Math.floor(Math.random() * 360);
      const pastelColor = `hsl(${hue}, 70%, 85%)`;
      colorEntry = { name: this.newReservation.guest_name, color: pastelColor };
    }
    
    // Find the row for this house
    const rowIndex = this.reservationRows.findIndex(r => r.house_id === this.newReservation.house_id);
    
    if (rowIndex !== -1) {
      const row = this.reservationRows[rowIndex];
      
      // Create reservation for each day in the range
      const reservationDate = new Date(startDate);
      while (reservationDate <= endDate) {
        const day = reservationDate.getDate();
        const month = reservationDate.getMonth() + 1;
        const dayStr = `${day}.${month}`;
        
        const isFirstDay = reservationDate.getTime() === startDate.getTime();
        const isLastDay = reservationDate.getTime() === endDate.getTime();
        
        // Add this date to the dates array if not already there
        if (!row.dates.includes(dayStr)) {
          row.dates.push(dayStr);
        }
        
        // Add the reservation info
        row.reservations[dayStr] = {
          reservationId: reservationId,
          guest: this.newReservation.guest_name,
          color: colorEntry.color,
          phone: this.newReservation.guest_phone,
          adults: this.newReservation.adults,
          children: this.newReservation.children,
          extraBeds: this.newReservation.extraBeds,
          pets: this.newReservation.pets,
          notes: this.newReservation.notes,
          startDay: startDay,
          startMonth: startMonth,
          endDay: endDay,
          endMonth: endMonth,
          isFirstDay: isFirstDay,
          isLastDay: isLastDay,
          house_id: this.newReservation.house_id
        };
        
        // Move to the next day
        reservationDate.setDate(reservationDate.getDate() + 1);
      }
      
      // Update the row in the array
      this.reservationRows[rowIndex] = { ...row };
    }
    
    // Close the popup
    this.showNewReservationPopup = false;
    
    // Reset new reservation data
    this.newReservation = {
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
  }

  // Edit an existing reservation
  editReservation(): void {
    if (!this.selectedReservation) return;
    
    // Prepare form with existing data
    this.newReservation = {
      house_id: this.selectedReservation.house_id || 0,
      guest_name: this.selectedReservation.guest || '',
      guest_phone: this.selectedReservation.phone || '',
      start_date: `${this.currentDate.getFullYear()}-${this.selectedReservation.startMonth.toString().padStart(2, '0')}-${this.selectedReservation.startDay.toString().padStart(2, '0')}`,
      end_date: `${this.currentDate.getFullYear()}-${this.selectedReservation.endMonth.toString().padStart(2, '0')}-${this.selectedReservation.endDay.toString().padStart(2, '0')}`,
      adults: this.selectedReservation.adults || 1,
      children: this.selectedReservation.children || 0,
      extraBeds: this.selectedReservation.extraBeds || 0,
      pets: this.selectedReservation.pets || 0,
      notes: this.selectedReservation.notes || ''
    };
    
    // Close details popup and show edit form
    this.showPopup = false;
    
    // Position the edit popup in the same place as the details popup
    this.newReservationPopupPosition = this.popupPosition;
    this.showNewReservationPopup = true;
    
    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
  }

  // Remove an existing reservation
  removeReservation(): void {
    if (!this.selectedReservation || !confirm('Are you sure you want to remove this reservation?')) {
      return;
    }
    
    const reservationId = this.selectedReservation.reservationId;
    
    // Find all entries with this reservation ID and remove them
    this.reservationRows.forEach(row => {
      // Collect days to remove
      const daysToRemove: string[] = [];
      
      // Find all days with this reservation
      Object.keys(row.reservations).forEach(day => {
        if (row.reservations[day].reservationId === reservationId) {
          daysToRemove.push(day);
        }
      });
      
      // Remove the reservation for each day
      daysToRemove.forEach(day => {
        delete row.reservations[day];
        
        // Also remove from dates array
        const dateIndex = row.dates.indexOf(day);
        if (dateIndex !== -1) {
          row.dates.splice(dateIndex, 1);
        }
      });
    });
    
    // Close the popup
    this.closePopup();
  }

  // Clean up event listeners when component is destroyed
  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    
    // Remove document click handler
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }
    
    // Remove any lingering hover effects
    document.querySelectorAll('.reservation-hover').forEach(cell => {
      cell.classList.remove('reservation-hover');
    });
    
    // Clear any row/column highlighting
    this.clearHighlighting();
    
    // Clear any timeout for status messages
    if (this.dragStatusTimeoutId) {
      clearTimeout(this.dragStatusTimeoutId);
    }
  }

  // Get the tooltip text for a cell
  getTooltipText(houseId: number, day: string): string {
    // First check if the cell has a reservation
    if (this.hasReservation(houseId, day)) {
      const reservation = this.getReservation(houseId, day);
      return reservation ? `${reservation.guest} (${reservation.adults} adults, ${reservation.children} children)` : 'Reserved';
    }
    
    // Check if it's part of a pending reservation
    if (this.isPendingReservation(houseId, day)) {
      return 'Pending Reservation';
    }
    
    // Otherwise it's available
    return 'Available';
  }

  // Handle cell hover for highlighting entire reservation
  onCellHover(houseId: number, date: string, event: MouseEvent): void {
    // Skip if not a reservation cell or if we're currently dragging or in pending state
    if (!this.hasReservation(houseId, date) || 
        this.isDragging || 
        this.isPendingReservation(houseId, date)) {
      return;
    }

    const reservation = this.getReservation(houseId, date);
    if (!reservation) return;

    // Find all cells with same reservation ID and add a hover class
    const reservationId = reservation.reservationId;
    document.querySelectorAll(`[data-reservation-id="${reservationId}"]`).forEach(cell => {
      cell.classList.add('reservation-hover');
      
      // If this cell is part of a highlighted row/column, make sure it still stands out
      if (cell.classList.contains('row-highlight') || cell.classList.contains('column-highlight')) {
        cell.classList.add('reservation-highlight-priority');
      }
    });
  }

  // Handle cell leave to remove highlighting
  onCellLeave(houseId: number, date: string, event: MouseEvent): void {
    // Remove hover class from all cells with this reservation ID
    if (!this.hasReservation(houseId, date)) {
      return;
    }

    const reservation = this.getReservation(houseId, date);
    if (!reservation) return;

    const reservationId = reservation.reservationId;
    document.querySelectorAll(`[data-reservation-id="${reservationId}"]`).forEach(cell => {
      cell.classList.remove('reservation-hover', 'reservation-highlight-priority');
    });
  }

  // Handle clicking on a room cell (row header) to highlight a row
  onRoomCellClick(houseId: number, event: MouseEvent): void {
    // If there's already an active row and it's the same one, clear it
    if (this.activeRowId === houseId) {
      this.clearHighlighting();
    } else {
      // Clear any existing highlighting first
      this.clearHighlighting();
      
      // Set the active row
      this.activeRowId = houseId;
      
      // Add highlight class to all cells in this row
      document.querySelectorAll(`.table-row[data-house-id="${houseId}"] .reservation-cell`).forEach(cell => {
        cell.classList.add('row-highlight');
      });
      
      // Mark the row header as active
      const rowHeader = event.currentTarget as HTMLElement;
      rowHeader.classList.add('active-header');
    }
    
    // Prevent event from propagating
    event.stopPropagation();
  }

  // Handle clicking on a date cell (column header) to highlight a column
  onDateCellClick(date: string, event: MouseEvent): void {
    // If there's already an active column and it's the same one, clear it
    if (this.activeColumnDate === date) {
      this.clearHighlighting();
    } else {
      // Clear any existing highlighting first
      this.clearHighlighting();
      
      // Set the active column
      this.activeColumnDate = date;
      
      // Add highlight class to all cells in this column
      document.querySelectorAll(`.reservation-cell[data-date="${date}"]`).forEach(cell => {
        cell.classList.add('column-highlight');
      });
      
      // Mark the column header as active
      const columnHeader = event.currentTarget as HTMLElement;
      columnHeader.classList.add('active-header');
    }
    
    // Prevent event from propagating
    event.stopPropagation();
  }

  // Clear all row and column highlighting
  clearHighlighting(): void {
    // Clear row and column highlighting
    this.activeRowId = null;
    this.activeColumnDate = null;
    
    // Remove all highlighting classes
    document.querySelectorAll('.row-highlight, .column-highlight, .active-header').forEach(element => {
      element.classList.remove('row-highlight', 'column-highlight', 'active-header');
    });
  }

  // Drag and drop methods
  
  // Handle start of dragging a reservation
  onReservationDragStart(houseId: number, date: string, event: DragEvent): void {
    // Only allow dragging from the first day of a reservation
    const reservation = this.getReservation(houseId, date);
    if (!reservation || !reservation.isFirstDay || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    
    // Set drag data
    this.draggedReservationId = reservation.reservationId;
    this.draggedFromHouseId = houseId;
    this.draggedFromDate = date;
    
    // Get the full duration of the reservation
    const startDate = new Date(this.currentDate.getFullYear(), reservation.startMonth - 1, reservation.startDay);
    const endDate = new Date(this.currentDate.getFullYear(), reservation.endMonth - 1, reservation.endDay);
    this.draggedStartDate = startDate;
    this.draggedEndDate = endDate;
    
    // Calculate duration in days
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    this.draggedDuration = Math.round((endDate.getTime() - startDate.getTime()) / oneDay) + 1;
    
    // Add visual feedback that element is being dragged
    document.querySelectorAll(`[data-reservation-id="${reservation.reservationId}"]`).forEach(el => {
      el.classList.add('dragging');
    });
    
    // Set drag ghost data
    this.dragGhostData = {
      guest: reservation.guest,
      startDate: `${reservation.startDay}/${reservation.startMonth}`,
      endDate: `${reservation.endDay}/${reservation.endMonth}`,
      reservationId: reservation.reservationId,
      color: reservation.color
    };
    
    // Create a transparent drag image (we'll use our own ghost element)
    const dragImg = document.createElement('div');
    dragImg.style.opacity = '0';
    dragImg.style.position = 'absolute';
    dragImg.style.top = '-9999px';
    document.body.appendChild(dragImg);
    event.dataTransfer.setDragImage(dragImg, 0, 0);
    
    // Show our custom ghost element
    this.dragGhostVisible = true;
    this.updateDragGhostPosition(event);
    
    // Set data for the drag operation
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', reservation.reservationId);
    
    // Show status message
    this.showStatusMessage('Drag to move reservation', true);
    
    // Force change detection
    this.changeDetectorRef.detectChanges();
  }
  
  // Handle dragging over a potential drop target
  onReservationDragOver(houseId: number, date: string, event: DragEvent): void {
    if (!this.draggedReservationId || !event.dataTransfer) return;
    
    event.preventDefault();
    
    // Check if this would be a valid drop
    const isValid = this.isValidDropTarget(houseId, date);
    
    // Set the drop effect based on validity
    event.dataTransfer.dropEffect = isValid ? 'move' : 'none';
    
    // Update ghost position
    this.updateDragGhostPosition(event);
  }
  
  // Handle entering a potential drop target
  onReservationDragEnter(houseId: number, date: string, event: DragEvent): void {
    if (!this.draggedReservationId) return;
    
    event.preventDefault();
    
    // Check if this would be a valid drop
    const isValid = this.isValidDropTarget(houseId, date);
    
    // Add appropriate visual class
    const cell = event.target as HTMLElement;
    if (isValid) {
      cell.classList.add('drag-over-valid');
      cell.classList.remove('drag-over-invalid');
    } else {
      cell.classList.add('drag-over-invalid');
      cell.classList.remove('drag-over-valid');
    }
  }
  
  // Handle leaving a potential drop target
  onReservationDragLeave(houseId: number, date: string, event: DragEvent): void {
    if (!this.draggedReservationId) return;
    
    // Remove visual feedback classes
    const cell = event.target as HTMLElement;
    cell.classList.remove('drag-over-valid', 'drag-over-invalid');
  }
  
  // Handle dropping a reservation
  onReservationDrop(houseId: number, date: string, event: DragEvent): void {
    if (!this.draggedReservationId || !event.dataTransfer || !this.draggedFromHouseId || 
        !this.draggedStartDate || !this.draggedEndDate) {
      return;
    }
    
    event.preventDefault();
    
    // Check if this is a valid drop target
    if (!this.isValidDropTarget(houseId, date)) {
      this.showStatusMessage('Invalid drop location - Reservation not moved', false);
      return;
    }
    
    // Same house, no need to move
    if (houseId === this.draggedFromHouseId) {
      this.showStatusMessage('Reservation is already in this room', false);
      return;
    }
    
    // Parse the target date
    const [dayNum, monthNum] = date.split('.').map(Number);
    const targetDate = new Date(this.currentDate.getFullYear(), monthNum - 1, dayNum);
    
    // Find the source reservation information
    const sourceReservation = this.findReservationById(this.draggedReservationId);
    if (!sourceReservation) {
      this.showStatusMessage('Error: Reservation not found', false);
      return;
    }
    
    // Calculate new start and end dates, maintaining the same duration
    const newStartDate = new Date(targetDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + this.draggedDuration - 1);
    
    // Check for overlaps in target house
    const newStartDay = newStartDate.getDate();
    const newStartMonth = newStartDate.getMonth() + 1;
    const newEndDay = newEndDate.getDate();
    const newEndMonth = newEndDate.getMonth() + 1;
    
    // Check for overlaps
    if (this.hasOverlappingReservations(houseId, newStartDate, newEndDate)) {
      this.showStatusMessage('Cannot move: Overlaps with existing reservations', false);
      return;
    }
    
    // First remove the reservation from the source house
    this.removeReservationById(this.draggedReservationId);
    
    // Then add it to the target house
    this.addReservationToHouse(
      houseId, 
      this.draggedReservationId,
      newStartDay,
      newStartMonth,
      newEndDay,
      newEndMonth,
      sourceReservation
    );
    
    // Show success message
    this.showStatusMessage('Reservation moved successfully!', true);
    
    // Force UI update
    this.changeDetectorRef.detectChanges();
  }
  
  // Handle end of drag operation
  onReservationDragEnd(event: DragEvent): void {
    // Remove dragging classes from all cells
    document.querySelectorAll('.dragging, .drag-over-valid, .drag-over-invalid').forEach(el => {
      el.classList.remove('dragging', 'drag-over-valid', 'drag-over-invalid');
    });
    
    // Hide ghost element
    this.dragGhostVisible = false;
    
    // Reset drag state
    this.draggedReservationId = null;
    this.draggedFromHouseId = null;
    this.draggedFromDate = null;
    this.draggedStartDate = null;
    this.draggedEndDate = null;
    this.draggedDuration = 0;
    
    // Force UI update
    this.changeDetectorRef.detectChanges();
  }
  
  // Helper method to check if a drop target is valid
  isValidDropTarget(houseId: number, date: string): boolean {
    if (!this.draggedStartDate || !this.draggedEndDate || !this.draggedDuration) {
      return false;
    }
    
    // Parse the target date
    const [dayNum, monthNum] = date.split('.').map(Number);
    const targetDate = new Date(this.currentDate.getFullYear(), monthNum - 1, dayNum);
    
    // Calculate the potential new date range
    const newStartDate = new Date(targetDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + this.draggedDuration - 1);
    
    // Check if the new date range is valid
    return !this.hasOverlappingReservations(houseId, newStartDate, newEndDate, this.draggedReservationId || undefined);
  }
  
  // Check if there are overlapping reservations for a date range in a house
  hasOverlappingReservations(houseId: number, startDate: Date, endDate: Date, excludeReservationId?: string): boolean {
    const row = this.reservationRows.find(r => r.house_id === houseId);
    if (!row) return false;
    
    // Helper function to create a date string
    const formatDateKey = (date: Date) => {
      return `${date.getDate()}.${date.getMonth() + 1}`;
    };
    
    // Check each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatDateKey(currentDate);
      
      // If there's a reservation on this date that isn't the one we're moving, it's an overlap
      if (row.reservations[dateKey] && 
          (!excludeReservationId || row.reservations[dateKey].reservationId !== excludeReservationId)) {
        return true;
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return false;
  }
  
  // Find a reservation by its ID
  findReservationById(reservationId: string): ReservationInfo | null {
    for (const row of this.reservationRows) {
      for (const dateKey of row.dates) {
        if (row.reservations[dateKey] && row.reservations[dateKey].reservationId === reservationId) {
          return row.reservations[dateKey];
        }
      }
    }
    return null;
  }
  
  // Remove a reservation by its ID
  removeReservationById(reservationId: string): void {
    this.reservationRows.forEach(row => {
      // Create a copy of the dates array to avoid issues while iterating
      const datesToRemove = [...row.dates].filter(dateKey => 
        row.reservations[dateKey] && row.reservations[dateKey].reservationId === reservationId
      );
      
      // Remove each matching date
      datesToRemove.forEach(dateKey => {
        delete row.reservations[dateKey];
        const index = row.dates.indexOf(dateKey);
        if (index !== -1) {
          row.dates.splice(index, 1);
        }
      });
    });
  }
  
  // Add a reservation to a house
  addReservationToHouse(
    houseId: number, 
    reservationId: string,
    startDay: number,
    startMonth: number,
    endDay: number,
    endMonth: number,
    sourceReservation: ReservationInfo
  ): void {
    // Find the target row
    const rowIndex = this.reservationRows.findIndex(r => r.house_id === houseId);
    if (rowIndex === -1) return;
    
    const row = this.reservationRows[rowIndex];
    
    // For each day in the range, add a reservation entry
    const startDate = new Date(this.currentDate.getFullYear(), startMonth - 1, startDay);
    const endDate = new Date(this.currentDate.getFullYear(), endMonth - 1, endDay);
    
    // Helper function to format date key
    const formatDateKey = (date: Date) => {
      return `${date.getDate()}.${date.getMonth() + 1}`;
    };
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatDateKey(currentDate);
      
      // Add this date to the dates array if not already there
      if (!row.dates.includes(dateKey)) {
        row.dates.push(dateKey);
      }
      
      const isFirstDay = currentDate.getTime() === startDate.getTime();
      const isLastDay = currentDate.getTime() === endDate.getTime();
      
      // Add the reservation info
      row.reservations[dateKey] = {
        reservationId: reservationId,
        guest: sourceReservation.guest,
        color: sourceReservation.color,
        phone: sourceReservation.phone,
        adults: sourceReservation.adults,
        children: sourceReservation.children,
        extraBeds: sourceReservation.extraBeds,
        pets: sourceReservation.pets,
        notes: sourceReservation.notes,
        startDay: startDay,
        startMonth: startMonth,
        endDay: endDay,
        endMonth: endMonth,
        isFirstDay: isFirstDay,
        isLastDay: isLastDay,
        house_id: houseId
      };
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add animation class to show successful move
    setTimeout(() => {
      document.querySelectorAll(`[data-reservation-id="${reservationId}"]`).forEach(el => {
        el.classList.add('reservation-moved');
        setTimeout(() => el.classList.remove('reservation-moved'), 500);
      });
    }, 50);
  }
  
  // Update the position of the ghost element during drag
  updateDragGhostPosition(event: DragEvent): void {
    if (!this.dragGhostVisible) return;
    
    this.dragGhostPosition = {
      top: `${event.clientY + 15}px`,
      left: `${event.clientX + 15}px`
    };
    
    // Force change detection to update the position
    this.changeDetectorRef.detectChanges();
  }
  
  // Show a status message during drag operations
  showStatusMessage(message: string, isSuccess: boolean): void {
    // Clear any existing timeout
    if (this.dragStatusTimeoutId) {
      clearTimeout(this.dragStatusTimeoutId);
    }
    
    // Update message properties
    this.dragStatusMessage = message;
    this.dragStatusSuccess = isSuccess;
    this.dragStatusVisible = true;
    
    // Force update
    this.changeDetectorRef.detectChanges();
    
    // Hide message after 3 seconds
    this.dragStatusTimeoutId = setTimeout(() => {
      this.dragStatusVisible = false;
      this.changeDetectorRef.detectChanges();
    }, 3000);
  }
} 