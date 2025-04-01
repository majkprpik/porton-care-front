import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, AfterContentInit } from '@angular/core';
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
import { MobileHomeCardComponent } from '../../components/mobile-home-card/mobile-home-card.component';

export interface ReservationRow {
  house_id: number;
  room: string;
  type: string;
  dates: string[];
  reservations: { [key: string]: ReservationInfo };
}

export interface ReservationInfo {
  reservationId: string;
  guest: string;
  lastName: string;
  reservationNumber: string;
  reservationLength: number;
  color: string;
  colorTheme: number;
  colorTint: number;
  phone: string;
  adults: number;
  babies: number;
  cribs: number;
  dogsSmall: number;
  dogsMedium: number;
  dogsLarge: number;
  notes: string;
  startDay: number;
  startMonth: number;
  endDay: number;
  endMonth: number;
  isFirstDay: boolean;
  isLastDay: boolean;
  house_id: number;
  hasArrived: boolean;
  hasDeparted: boolean;
  prevConnected: boolean;
  nextConnected: boolean;
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
    MatRadioModule,
    MobileHomeCardComponent
  ],
  templateUrl: './reservations2.component.html',
  styleUrl: './reservations2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservations2Component implements OnInit, OnDestroy, AfterContentInit {
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
    last_name: '',
    guest_phone: '',
    reservation_number: '',
    start_date: '',
    end_date: '',
    adults: 1,
    babies: 0,
    cribs: 0,
    dogs_small: 0,
    dogs_medium: 0,
    dogs_large: 0,
    notes: '',
    has_arrived: false,
    has_departed: false,
    prev_connected: false,
    next_connected: false,
    color_theme: 0,
    color_tint: 0
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
  time = new Date();

  constructor(
    private reservationsService: ReservationsService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterContentInit(): void {
    console.log("Time diff: ");
    console.log(new Date().getMilliseconds() - this.time.getMilliseconds())
  }

  ngOnInit(): void {
    this.generateYearCalendar();
    this.initializeData();
    
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

  private async initializeData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // Get the date range for the current year
      const startDate = new Date(this.currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = new Date(this.currentDate.getFullYear(), 11, 31).toISOString().split('T')[0];
      
      // Fetch houses and their availability status
      const houses = await this.reservationsService.getHousesWithAvailabilityStatus(startDate, endDate);
      
      // Convert houses to mobile homes format
      this.mobileHomes = houses.map(house => ({
        house_id: house.house_id,
        housename: house.house_name,
        housetype: house.house_type_id,
        housetypename: house.house_type_name,
        availabilityid: house.availabilityid,
        availabilityname: house.availabilityname,
        housetasks: []
      }));

      // Convert mobile homes to reservation rows
      this.reservationRows = this.mobileHomes
        .filter(house => house.housetypename === this.currentHouseType)
        .map(home => ({
          house_id: home.house_id,
          room: home.housename.split(' ')[1], // Just the number part
          type: home.housetypename,
          dates: [],
          reservations: {}
        }));

      // Process availabilities to create reservations
      this.processAvailabilities(houses);
      
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load reservation data. Please try again.';
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private processAvailabilities(houses: any[]): void {
    houses.forEach(house => {
      if (house.availabilities) {
        house.availabilities.forEach((availability: any) => {
          // Only process occupied availabilities
          if (availability.house_availability_type_name === 'Occupied') {
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            // Generate a unique reservation ID
            const reservationId = `res-${house.house_id}-${availability.house_availability_id}`;
            
            // Find or create color for this guest
            let colorEntry = this.reservationColors.find(c => 
              c.name.toLowerCase() === (availability.guest_name || 'Unknown').toLowerCase()
            );
            
            // If no color found, generate a random pastel color
            if (!colorEntry) {
              const hue = Math.floor(Math.random() * 360);
              const pastelColor = `hsl(${hue}, 70%, 85%)`;
              colorEntry = { name: availability.guest_name || 'Unknown', color: pastelColor };
            }
            
            // Add reservation for each day in the range
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              const day = currentDate.getDate();
              const month = currentDate.getMonth() + 1;
              const dayStr = `${day}.${month}`;
              
              const isFirstDay = currentDate.getTime() === startDate.getTime();
              const isLastDay = currentDate.getTime() === endDate.getTime();
              
              // Find the row for this house
              const row = this.reservationRows.find(r => r.house_id === house.house_id);
              if (row) {
                // Add this date to the dates array if not already there
                if (!row.dates.includes(dayStr)) {
                  row.dates.push(dayStr);
                }
                
                // Add the reservation info
                row.reservations[dayStr] = {
                  reservationId: reservationId,
                  guest: availability.guest_name || 'Unknown',
                  lastName: availability.last_name || '',
                  reservationNumber: availability.reservation_number || '',
                  reservationLength: availability.reservation_length || 0,
                  color: colorEntry.color,
                  colorTheme: availability.color_theme || 0,
                  colorTint: availability.color_tint || 0,
                  phone: availability.guest_phone || '',
                  adults: availability.adults || 1,
                  babies: availability.babies || 0,
                  cribs: availability.cribs || 0,
                  dogsSmall: availability.dogs_d || 0,
                  dogsMedium: availability.dogs_s || 0,
                  dogsLarge: availability.dogs_b || 0,
                  notes: availability.notes || '',
                  startDay: startDate.getDate(),
                  startMonth: startDate.getMonth() + 1,
                  endDay: endDate.getDate(),
                  endMonth: endDate.getMonth() + 1,
                  isFirstDay: isFirstDay,
                  isLastDay: isLastDay,
                  house_id: house.house_id,
                  hasArrived: availability.has_arrived || false,
                  hasDeparted: availability.has_departed || false,
                  prevConnected: availability.prev_connected || false,
                  nextConnected: availability.next_connected || false
                };
              }
              
              // Move to the next day
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });
      }
    });
  }

  // Update the changeHouseType method to use real data
  async changeHouseType(type: string): Promise<void> {
    this.currentHouseType = type;
    await this.initializeData();
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
      last_name: '',
      guest_phone: '',
      reservation_number: '',
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      adults: 1,
      babies: 0,
      cribs: 0,
      dogs_small: 0,
      dogs_medium: 0,
      dogs_large: 0,
      notes: '',
      has_arrived: false,
      has_departed: false,
      prev_connected: false,
      next_connected: false,
      color_theme: 0,
      color_tint: 0
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
      last_name: '',
      guest_phone: '',
      reservation_number: '',
      start_date: `${this.currentDate.getFullYear()}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`,
      end_date: `${this.currentDate.getFullYear()}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`,
      adults: 1,
      babies: 0,
      cribs: 0,
      dogs_small: 0,
      dogs_medium: 0,
      dogs_large: 0,
      notes: '',
      has_arrived: false,
      has_departed: false,
      prev_connected: false,
      next_connected: false,
      color_theme: 0,
      color_tint: 0
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
      last_name: '',
      guest_phone: '',
      reservation_number: '',
      start_date: '',
      end_date: '',
      adults: 1,
      babies: 0,
      cribs: 0,
      dogs_small: 0,
      dogs_medium: 0,
      dogs_large: 0,
      notes: '',
      has_arrived: false,
      has_departed: false,
      prev_connected: false,
      next_connected: false,
      color_theme: 0,
      color_tint: 0
    };
  }

  async createNewReservation(): Promise<void> {
    if (!this.newReservation.start_date || !this.newReservation.end_date || !this.newReservation.house_id) {
      return;
    }

    try {
      // Get the availability type for "Occupied"
      const availabilityTypes = await this.reservationsService.getAvailabilityTypes();
      const occupiedType = availabilityTypes.find(type => type.house_availability_type_name === 'Occupied');
      
      if (!occupiedType) {
        throw new Error('Could not find Occupied availability type');
      }

      // Create the reservation in the database
      const reservation = await this.reservationsService.createReservation({
        house_id: this.newReservation.house_id,
        availability_type_id: occupiedType.house_availability_type_id,
        start_date: this.newReservation.start_date,
        end_date: this.newReservation.end_date,
        guest_name: this.newReservation.guest_name,
        last_name: this.newReservation.last_name,
        guest_phone: this.newReservation.guest_phone,
        reservation_number: this.newReservation.reservation_number,
        adults: this.newReservation.adults,
        babies: this.newReservation.babies,
        cribs: this.newReservation.cribs,
        dogs_d: this.newReservation.dogs_small,
        dogs_s: this.newReservation.dogs_medium,
        dogs_b: this.newReservation.dogs_large,
        notes: this.newReservation.notes,
        has_arrived: this.newReservation.has_arrived,
        has_departed: this.newReservation.has_departed,
        prev_connected: this.newReservation.prev_connected,
        next_connected: this.newReservation.next_connected,
        color_theme: this.newReservation.color_theme,
        color_tint: this.newReservation.color_tint
      });

      // Reload the data to show the new reservation
      await this.initializeData();

      // Close the popup
      this.showNewReservationPopup = false;
      
      // Reset new reservation data
      this.newReservation = {
        house_id: 0,
        guest_name: '',
        last_name: '',
        guest_phone: '',
        reservation_number: '',
        start_date: '',
        end_date: '',
        adults: 1,
        babies: 0,
        cribs: 0,
        dogs_small: 0,
        dogs_medium: 0,
        dogs_large: 0,
        notes: '',
        has_arrived: false,
        has_departed: false,
        prev_connected: false,
        next_connected: false,
        color_theme: 0,
        color_tint: 0
      };
    } catch (error) {
      console.error('Error creating reservation:', error);
      // You might want to show an error message to the user here
    }
  }

  async removeReservation(): Promise<void> {
    if (!this.selectedReservation || !confirm('Are you sure you want to remove this reservation?')) {
      return;
    }
    
    try {
      // Extract the reservation ID from the format "res-{houseId}-{availabilityId}"
      const reservationId = parseInt(this.selectedReservation.reservationId.split('-')[2]);
      
      // Delete the reservation from the database
      await this.reservationsService.deleteReservation(reservationId);
      
      // Reload the data to reflect the deletion
      await this.initializeData();
      
      // Close the popup
      this.closePopup();
    } catch (error) {
      console.error('Error removing reservation:', error);
      // You might want to show an error message to the user here
    }
  }

  // Edit an existing reservation
  editReservation(): void {
    if (!this.selectedReservation) return;
    
    // Prepare form with existing data
    this.newReservation = {
      house_id: this.selectedReservation.house_id || 0,
      guest_name: this.selectedReservation.guest || '',
      last_name: this.selectedReservation.lastName || '',
      guest_phone: this.selectedReservation.phone || '',
      reservation_number: this.selectedReservation.reservationNumber || '',
      start_date: `${this.currentDate.getFullYear()}-${this.selectedReservation.startMonth.toString().padStart(2, '0')}-${this.selectedReservation.startDay.toString().padStart(2, '0')}`,
      end_date: `${this.currentDate.getFullYear()}-${this.selectedReservation.endMonth.toString().padStart(2, '0')}-${this.selectedReservation.endDay.toString().padStart(2, '0')}`,
      adults: this.selectedReservation.adults || 1,
      babies: this.selectedReservation.babies || 0,
      cribs: this.selectedReservation.cribs || 0,
      dogs_small: this.selectedReservation.dogsSmall || 0,
      dogs_medium: this.selectedReservation.dogsMedium || 0,
      dogs_large: this.selectedReservation.dogsLarge || 0,
      notes: this.selectedReservation.notes || '',
      has_arrived: this.selectedReservation.hasArrived || false,
      has_departed: this.selectedReservation.hasDeparted || false,
      prev_connected: this.selectedReservation.prevConnected || false,
      next_connected: this.selectedReservation.nextConnected || false,
      color_theme: this.selectedReservation.colorTheme || 0,
      color_tint: this.selectedReservation.colorTint || 0
    };
    
    // Close details popup and show edit form
    this.showPopup = false;
    
    // Position the edit popup in the same place as the details popup
    this.newReservationPopupPosition = this.popupPosition;
    this.showNewReservationPopup = true;
    
    // Force change detection to update the UI
    this.changeDetectorRef.detectChanges();
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
      return reservation ? `${reservation.guest} (${reservation.adults} adults, ${reservation.babies} babies)` : 'Reserved';
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
    console.log('Drag start event triggered', houseId, date);
    
    // Only allow dragging from the first day of a reservation
    const reservation = this.getReservation(houseId, date);
    if (!reservation || !reservation.isFirstDay || !event.dataTransfer) {
      console.log('Drag prevented: not first day or no dataTransfer', reservation);
      event.preventDefault();
      return;
    }
    
    console.log('Valid drag start for reservation', reservation.reservationId);
    
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
    // Always prevent default to allow drop
    event.preventDefault();
    
    if (!this.draggedReservationId || !event.dataTransfer) return;
    
    // Check if this would be a valid drop
    const isValid = this.isValidDropTarget(houseId, date);
    
    // Set the drop effect based on validity
    event.dataTransfer.dropEffect = isValid ? 'move' : 'none';
    
    // Update ghost position
    this.updateDragGhostPosition(event);
  }
  
  // Handle entering a potential drop target
  onReservationDragEnter(houseId: number, date: string, event: DragEvent): void {
    event.preventDefault();
    
    if (!this.draggedReservationId) return;
    
    // Check if this would be a valid drop
    const isValid = this.isValidDropTarget(houseId, date);
    console.log('Drag enter', { houseId, date, isValid });
    
    // Add appropriate visual class
    const cell = event.target as HTMLElement;
    
    // First remove both classes
    cell.classList.remove('drag-over-valid', 'drag-over-invalid');
    
    // Then add the appropriate one
    if (isValid) {
      cell.classList.add('drag-over-valid');
    } else {
      cell.classList.add('drag-over-invalid');
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
  async onReservationDrop(targetHouseId: number, targetDate: string, event: DragEvent): Promise<void> {
    event.preventDefault();
    
    if (!this.draggedReservationId || !this.draggedFromHouseId || !this.draggedFromDate) {
      return;
    }

    try {
      // Extract the original reservation ID from the format "res-{houseId}-{availabilityId}"
      const originalReservationId = parseInt(this.draggedReservationId.split('-')[2]);
      
      // Get the target date components
      const [day, month] = targetDate.split('.').map(Number);
      const year = this.currentDate.getFullYear();
      
      // Create new dates
      const newStartDate = new Date(year, month - 1, day);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + this.draggedDuration);
      
      // Update the reservation in the database
      await this.reservationsService.updateReservation(originalReservationId, {
        house_id: targetHouseId,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0]
      });
      
      // Reload the data to show the updated reservation
      await this.initializeData();
      
      // Show success message
      this.showDragStatus('Reservation moved successfully', true);
    } catch (error) {
      console.error('Error moving reservation:', error);
      this.showDragStatus('Failed to move reservation', false);
    } finally {
      this.resetDragState();
    }
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
      console.log('Invalid drop: missing drag data');
      return false;
    }
    
    // Parse the target date
    const [dayNum, monthNum] = date.split('.').map(Number);
    const targetDate = new Date(this.currentDate.getFullYear(), monthNum - 1, dayNum);
    
    // Calculate the potential new date range
    const newStartDate = new Date(targetDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + this.draggedDuration - 1);
    
    // Same house as origin? (not invalid, but no point in allowing it)
    if (houseId === this.draggedFromHouseId) {
      console.log('Same house drop - not invalid but not useful');
      return false;
    }
    
    // Check if the new date range is valid
    const hasOverlap = this.hasOverlappingReservations(houseId, newStartDate, newEndDate, this.draggedReservationId || undefined);
    console.log('Drop target validation:', { houseId, date, hasOverlap, draggedDuration: this.draggedDuration });
    return !hasOverlap;
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
      const datesToRemove: string[] = [];
      
      // Find all days with this reservation
      Object.keys(row.reservations).forEach(day => {
        if (row.reservations[day].reservationId === reservationId) {
          datesToRemove.push(day);
        }
      });
      
      // Remove the reservation for each day
      datesToRemove.forEach(day => {
        delete row.reservations[day];
        
        // Also remove from dates array
        const dateIndex = row.dates.indexOf(day);
        if (dateIndex !== -1) {
          row.dates.splice(dateIndex, 1);
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
        lastName: sourceReservation.lastName,
        reservationNumber: sourceReservation.reservationNumber,
        reservationLength: sourceReservation.reservationLength,
        color: sourceReservation.color,
        colorTheme: sourceReservation.colorTheme,
        colorTint: sourceReservation.colorTint,
        phone: sourceReservation.phone,
        adults: sourceReservation.adults,
        babies: sourceReservation.babies,
        cribs: sourceReservation.cribs,
        dogsSmall: sourceReservation.dogsSmall,
        dogsMedium: sourceReservation.dogsMedium,
        dogsLarge: sourceReservation.dogsLarge,
        notes: sourceReservation.notes,
        startDay: startDay,
        startMonth: startMonth,
        endDay: endDay,
        endMonth: endMonth,
        isFirstDay: isFirstDay,
        isLastDay: isLastDay,
        house_id: houseId,
        hasArrived: sourceReservation.hasArrived,
        hasDeparted: sourceReservation.hasDeparted,
        prevConnected: sourceReservation.prevConnected,
        nextConnected: sourceReservation.nextConnected
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
    
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      this.dragGhostPosition = {
        top: `${event.clientY + 15}px`,
        left: `${event.clientX + 15}px`
      };
      
      // Force change detection to update the position
      this.changeDetectorRef.detectChanges();
    });
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

  // Get the MobileHome object for a given ReservationRow
  getMobileHomeForRow(row: ReservationRow): MobileHome {
    return this.mobileHomes.find(home => home.house_id === row.house_id) || {
      house_id: row.house_id,
      housename: row.room,
      housetype: 1,
      housetypename: row.type,
      availabilityid: 1,
      availabilityname: row.dates.length > 0 ? 'Occupied' : 'Free',
      housetasks: []
    };
  }

  private showDragStatus(message: string, success: boolean): void {
    this.dragStatusMessage = message;
    this.dragStatusSuccess = success;
    this.dragStatusVisible = true;
    
    // Clear any existing timeout
    if (this.dragStatusTimeoutId) {
      clearTimeout(this.dragStatusTimeoutId);
    }
    
    // Hide the message after 3 seconds
    this.dragStatusTimeoutId = setTimeout(() => {
      this.dragStatusVisible = false;
    }, 3000);
  }
} 