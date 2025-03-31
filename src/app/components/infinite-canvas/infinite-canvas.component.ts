import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-infinite-canvas',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './infinite-canvas.component.html',
  styleUrls: ['./infinite-canvas.component.scss']
})
export class InfiniteCanvasComponent implements OnInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLDivElement>;
  
  // Canvas state
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  
  // Pan state
  isPanning = false;
  startX = 0;
  startY = 0;
  lastX = 0;
  lastY = 0;
  
  // Restrictions
  private readonly MIN_SCALE = 0.75;
  private readonly MAX_PAN_DISTANCE = 2000;
  
  // Viewport dimensions
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  
  // Calculate MAX_SCALE based on viewport
  private get MAX_SCALE(): number {
    // We want the maximum zoom to show exactly one frame
    // The frame size is viewportWidth x viewportHeight
    // So we calculate what scale would make the frame fill the current viewport
    const currentViewportWidth = window.innerWidth;
    const currentViewportHeight = window.innerHeight;
    
    // Calculate scales needed to fit width and height
    const scaleX = currentViewportWidth / this.viewportWidth;
    const scaleY = currentViewportHeight / this.viewportHeight;
    
    // Use the smaller scale to ensure the frame fits in both dimensions
    return Math.min(scaleX, scaleY);
  }

  // Pages configuration
  pages = [
    { id: 'dashboard', name: 'Dashboard', route: 'dashboard', x: 0, y: 0 },
    { id: 'reservations', name: 'Rezervacija', route: 'reservations2', x: this.viewportWidth + 50, y: 0 },
    { id: 'daily-sheet', name: 'Dnevni zadaci', route: 'daily-sheet', x: (this.viewportWidth + 50) * 2, y: 0 },
    { id: 'teams', name: 'Timovi', route: 'teams', x: 0, y: this.viewportHeight + 50 },
    { id: 'profiles', name: 'Profili', route: 'profiles', x: this.viewportWidth + 50, y: this.viewportHeight + 50 },
    { id: 'damage-reports', name: 'Popravci', route: 'damage-reports', x: (this.viewportWidth + 50) * 2, y: this.viewportHeight + 50 }
  ];

  constructor(private router: Router) {
    // Update viewport dimensions on window resize
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.updatePagePositions();
      
      // Ensure current scale doesn't exceed new MAX_SCALE
      if (this.scale > this.MAX_SCALE) {
        this.scale = this.MAX_SCALE;
        this.updateCanvasTransform();
      }
    });
  }

  ngOnInit(): void {
    // Center the canvas on the first page
    this.offsetX = -this.viewportWidth / 2;
    this.offsetY = -this.viewportHeight / 2;
    this.updateCanvasTransform();
    
    // Load all pages initially
    this.loadAllPages();
  }

  // Load all pages into their respective outlets
  private loadAllPages(): void {
    // Create an outlets object for all pages
    const outlets: { [key: string]: string[] } = {};
    this.pages.forEach(page => {
      outlets[page.id] = [page.route];
    });

    // Navigate to infinite canvas with all outlets configured
    this.router.navigate(['/infinite-canvas', { outlets }]);
  }

  // Update page positions when viewport changes
  private updatePagePositions(): void {
    this.pages = this.pages.map((page, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...page,
        x: col * (this.viewportWidth + 50),
        y: row * (this.viewportHeight + 50)
      };
    });
  }

  // Handle mouse down for panning
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Left click only
      this.isPanning = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.lastX = this.offsetX;
      this.lastY = this.offsetY;
      
      if (this.canvas) {
        this.canvas.nativeElement.classList.add('panning');
      }
    }
  }

  // Handle mouse move for panning
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      
      const newX = this.lastX + deltaX;
      const newY = this.lastY + deltaY;
      
      this.offsetX = Math.max(Math.min(newX, this.MAX_PAN_DISTANCE), -this.MAX_PAN_DISTANCE);
      this.offsetY = Math.max(Math.min(newY, this.MAX_PAN_DISTANCE), -this.MAX_PAN_DISTANCE);
      
      this.updateCanvasTransform();
    }
  }

  // Handle mouse up to stop panning
  @HostListener('mouseup')
  onMouseUp(): void {
    this.isPanning = false;
    if (this.canvas) {
      this.canvas.nativeElement.classList.remove('panning');
    }
  }

  // Handle mouse leave to stop panning
  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isPanning = false;
    if (this.canvas) {
      this.canvas.nativeElement.classList.remove('panning');
    }
  }

  // Handle wheel for zooming
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const delta = event.deltaY;
    const scaleFactor = delta > 0 ? 0.98 : 1.02;
    
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    
    const newScale = this.scale * scaleFactor;
    if (newScale < this.MIN_SCALE || newScale > this.MAX_SCALE) return;
    
    this.offsetX = cursorX - (cursorX - this.offsetX) * scaleFactor;
    this.offsetY = cursorY - (cursorY - this.offsetY) * scaleFactor;
    
    this.offsetX = Math.max(Math.min(this.offsetX, this.MAX_PAN_DISTANCE), -this.MAX_PAN_DISTANCE);
    this.offsetY = Math.max(Math.min(this.offsetY, this.MAX_PAN_DISTANCE), -this.MAX_PAN_DISTANCE);
    
    this.scale = newScale;
    this.updateCanvasTransform();
  }

  // Update canvas transform based on current scale and offset
  private updateCanvasTransform(): void {
    if (this.canvas) {
      this.canvas.nativeElement.style.transform = 
        `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }
  }
} 