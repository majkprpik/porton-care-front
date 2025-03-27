import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { CleaningPerson } from '../models/cleaning-person.interface';
import { SupabaseService } from './supabase.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CleaningStaffService {
  constructor(private supabase: SupabaseService) {}

  getCleaningStaff(): Observable<CleaningPerson[]> {
    return from(this.fetchCleaningStaff()).pipe(
      catchError(error => {
        console.error('Error fetching cleaning staff:', error);
        return this.getMockCleaningStaff(); // Fallback to mock data
      })
    );
  }

  private async fetchCleaningStaff(): Promise<CleaningPerson[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['cleaner', 'maintenance']);

      if (error) throw error;

      return data.map(profile => ({
        id: profile.id.toString(),
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        available: true // Default to true if null
      }));
    } catch (error) {
      console.error('Error fetching cleaning staff from Supabase:', error);
      throw error;
    }
  }

  getMockCleaningStaff(): Observable<CleaningPerson[]> {
    const mockStaff: CleaningPerson[] = [
      { id: '1', firstName: 'Ana', lastName: 'K.', role: 'cleaner', available: true },
      { id: '2', firstName: 'Marko', lastName: 'P.', role: 'cleaner', available: true },
      { id: '3', firstName: 'Ivan', lastName: 'M.', role: 'cleaner', available: true },
      { id: '4', firstName: 'Petra', lastName: 'S.', role: 'cleaner', available: false, currentTask: '103' },
      { id: '5', firstName: 'Luka', lastName: 'R.', role: 'cleaner', available: true },
    ];
    return of(mockStaff);
  }
} 