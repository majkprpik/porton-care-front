import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { StatsHeaderComponent } from './components/stats-header/stats-header.component';
import { ProfileService } from './services/profile.service';
import { HelperService } from './services/helper.service';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    // StatsHeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'PortonCare';
  isMenuOpen = false;
  username: string | null = null;
  isBackgroundDimmed = false;
  isCanvasV2Route = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private profileService: ProfileService,
    public helperService: HelperService,
    private supabaseService: SupabaseService
  ) {
    this.router.events.subscribe(() => {
      this.isCanvasV2Route = this.router.url.includes('/infinite-canvas');
    });
  }

  ngOnInit() {
    this.authService.getUsername().subscribe(username => {
      this.username = username;
    });

    localStorage.getItem('userId')

    let profileId = this.authService?.getStoredUserId();

    if(profileId){
      this.profileService.fetchProfileById(profileId).then(profile => {
        this.authService.userProfile.next(profile);
      })
    }

    this.helperService.dimBackground.subscribe(res => {
      this.isBackgroundDimmed = res;
    })

    this.supabaseService.listenToDatabaseChanges();
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

  openUnscheduledTaskReport(){
    this.router.navigate(['/report-unscheduled-task']);
  }

  undimBackground(){
    this.helperService.dimBackground.next(false);
  }
}
