import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.interface';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './profile-management.component.html',
  styleUrls: ['./profile-management.component.scss']
})
export class ProfileManagementComponent implements OnInit {
  profiles: Profile[] = [];
  filteredProfiles: Profile[] = [];
  displayedColumns: string[] = ['first_name', 'last_name', 'role', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageIndex = 0;
  
  // Filtering
  searchTerm = '';
  
  // Editing
  editForm: FormGroup;
  editingProfile: Profile | null = null;
  
  // Available roles
  availableRoles: string[] = ['reception', 'admin', 'manager', 'cleaner', 'maintenance'];

  constructor(
    private profileService: ProfileService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.editForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      role: ['', Validators.required],
    //   is_cleaning_staff: [false],
    //   is_available: [true]
    });
  }

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.profileService.getProfiles().subscribe({
      next: (data) => {
        this.profiles = data;
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.snackBar.open('Failed to load profiles', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredProfiles = [...this.profiles];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredProfiles = this.profiles.filter(profile => 
        profile.first_name.toLowerCase().includes(searchTermLower) ||
        profile.last_name.toLowerCase().includes(searchTermLower) ||
        profile.role.toLowerCase().includes(searchTermLower) ||
        profile.id.toString().includes(searchTermLower)
      );
    }
    
    // Reset pagination
    this.pageIndex = 0;
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  onSort(sort: Sort): void {
    const data = [...this.filteredProfiles];
    
    if (!sort.active || sort.direction === '') {
      this.filteredProfiles = data;
      return;
    }

    this.filteredProfiles = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'first_name': return this.compare(a.first_name, b.first_name, isAsc);
        case 'last_name': return this.compare(a.last_name, b.last_name, isAsc);
        case 'role': return this.compare(a.role, b.role, isAsc);
        case 'id': return this.compare(a.id, b.id, isAsc);
        default: return 0;
      }
    });
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getPaginatedData(): Profile[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredProfiles.slice(startIndex, startIndex + this.pageSize);
  }

  startEdit(profile: Profile): void {
    this.editingProfile = profile;
    this.editForm.patchValue({
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
    //   is_cleaning_staff: profile.is_cleaning_staff || false,
    //   is_available: profile.is_available !== false // Default to true if undefined
    });
  }

  cancelEdit(): void {
    this.editingProfile = null;
    this.editForm.reset();
  }

  saveProfile(): void {
    if (this.editForm.invalid || !this.editingProfile) {
      return;
    }

    const updatedProfile: Profile = {
      ...this.editingProfile,
      first_name: this.editForm.value.first_name,
      last_name: this.editForm.value.last_name,
      role: this.editForm.value.role,
    //   is_cleaning_staff: this.editForm.value.is_cleaning_staff,
    //   is_available: this.editForm.value.is_available
    };

    this.profileService.updateProfile(updatedProfile).subscribe({
      next: (profile) => {
        // Update the profile in the local array
        const index = this.profiles.findIndex(p => p.id === profile.id);
        if (index !== -1) {
          this.profiles[index] = profile;
          this.applyFilter();
        }
        
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.snackBar.open('Failed to update profile', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  isEditing(profile: Profile): boolean {
    return this.editingProfile !== null && this.editingProfile.id === profile.id;
  }
} 