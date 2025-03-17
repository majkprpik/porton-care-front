import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { CleaningPerson } from '../models/cleaning-person.interface';
import { SupabaseService } from './supabase.service';
import { map, catchError } from 'rxjs/operators';

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
        .select('id, first_name, last_name');
        // .eq('is_cleaning_staff', true);

      if (error) throw error;

      return data.map(profile => ({
        id: profile.id.toString(),
        name: `${profile.first_name} ${profile.last_name}`,
        available: true // Default to true if null
      }));
    } catch (error) {
      console.error('Error fetching cleaning staff from Supabase:', error);
      throw error;
    }
  }

  getMockCleaningStaff(): Observable<CleaningPerson[]> {
    const mockStaff: CleaningPerson[] = [
      { id: '1', name: 'Ana K.', available: true },
      { id: '2', name: 'Marko P.', available: true },
      { id: '3', name: 'Ivan M.', available: true },
      { id: '4', name: 'Petra S.', available: false, currentTask: '103' },
      { id: '5', name: 'Luka R.', available: true },
    ];
    return of(mockStaff);
  }
} 