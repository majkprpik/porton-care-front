import { Component } from '@angular/core';
import { MobileHome } from '../../models/mobile-home.interface';
import { CommonModule } from '@angular/common';
import { MobileHomesService } from '../../services/mobile-homes.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.interface';
import { DamageReportCardComponent } from "../damage-report-card/damage-report-card.component";
import { StorageService } from '../../services/storage.service';
import { HelperService } from '../../services/helper.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-damage-reports',
  templateUrl: './damage-reports.component.html',
  styleUrl: './damage-reports.component.scss',
  imports: [CommonModule, FormsModule, MatIconModule, DamageReportCardComponent]
})
export class DamageReportsComponent {
  homesForRepair: any[] = [];
  maintenanceProfiles: Profile[] = [];
  repairedHomes = new Map<number, boolean>();
  openedImage = '';
  isBackgroundDimmed = false;

  constructor(
    private mobileHomesService: MobileHomesService,
    private profileService: ProfileService,
    private storageService: StorageService,
    private helperService: HelperService,
    private router: Router
  ) {
        
  }

  ngOnInit(){
    this.getMobileHomesForRepair();
    this.getAllProfilesByRole('maintenance');
    this.storageService.getAllStoredImagesInBucket('damage-reports-images');
    this.router.events.subscribe(() => {
      this.helperService.dimBackground.next(false);
    });
    this.helperService.dimBackground.subscribe(res => {
        this.isBackgroundDimmed = res;
        if(!res){
          this.openedImage = '';
        }
      }
    );
  }

  async getMobileHomesForRepair(){
    this.homesForRepair = await this.mobileHomesService.getHomesWithRepairTasks(); 
    this.checkIfHomeIsRepaired();
  }

  checkIfHomeIsRepaired(){
    this.homesForRepair.forEach(home => {
      const isRepaired = home.housetasks[0].taskProgressTypeName.includes("Završeno");
      this.repairedHomes.set(home.housetasks[0].taskId, isRepaired);
    })
  }

  async getAllProfilesByRole(role: string){
    this.maintenanceProfiles = await this.profileService.getAllProfilesByRole(role);
    console.log(this.maintenanceProfiles);
  }

  isCommented(comment: string){
    return comment.split('\n')[1] ? true : false;
  }

  taskRepaired(){
    console.log('Task repaired man!!');
  }

  onHouseRepaired(event: { taskId: number; isRepaired: boolean }){
    let home = this.homesForRepair.find(home => home.housetasks[0].taskId == event.taskId);
    
    if (home) {
      this.repairedHomes.set(home.housetasks[0].taskId, event.isRepaired);
    }
  }

  onImageOpened(event: { imageUrl: string }){
    this.openedImage = event.imageUrl;
    this.helperService.dimBackground.next(true);
  }

  closeImage(){
    this.openedImage = '';
    this.helperService.dimBackground.next(false);
  }

  deleteOpenedImageForTask(){
    const imagePath = this.getFilePathFromUrl(this.openedImage);
    if(imagePath){
      this.storageService.deleteStoredImageForTask(imagePath);
      window.location.reload();
    }
  }

  private getFilePathFromUrl(url: string){
    const match = url.match(/damage-reports-images\/(task-\d+\/.+)$/);
    return match ? match[1] : null;
  }
}
