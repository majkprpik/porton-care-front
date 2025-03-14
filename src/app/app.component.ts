import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'PortonCare';
  isMenuOpen = false;
  username: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getUsername().subscribe(username => {
      this.username = username;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }

  openRepairReportModal() {
    // const modalRef = this.modalService.open(RepairReportModalComponent);
    // modalRef.result.then(
    //   (result) => {
    //     // Handle the submitted report here
    //     console.log(result);
    //   },
    //   (reason) => {
    //     // Modal dismissed
    //   }
    // );
  }

  openRepairReport() {
    this.router.navigate(['/report-repair']);
  }
}
