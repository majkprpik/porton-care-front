import { Component } from '@angular/core';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.interface';
import { DamageReportCardComponent } from "../damage-report-card/damage-report-card.component";

@Component({
  selector: 'app-damage-reports',
  templateUrl: './damage-reports.component.html',
  styleUrl: './damage-reports.component.scss',
  imports: [CommonModule, FormsModule, MatIconModule, DamageReportCardComponent]
})
export class DamageReportsComponent {
  homesForRepair: MobileHome[] = [];
  maintenanceProfiles: Profile[] = [];

  constructor(
    private mobileHomesService: MobileHomesService,
    private profileService: ProfileService,
  ) {
        
  }

  ngOnInit(){
    this.getMobileHomesForRepair();
    this.getAllProfilesByRole('maintenance');
  }

  async getMobileHomesForRepair(){
    this.homesForRepair = await this.mobileHomesService.getHomesWithRepairTasks();
  }

  async getAllProfilesByRole(role: string){
    this.maintenanceProfiles = await this.profileService.getAllProfilesByRole(role);
    console.log(this.maintenanceProfiles);
  }

  isCommented(comment: string){
    return comment.split('\n')[1] ? true : false;
  }
}
