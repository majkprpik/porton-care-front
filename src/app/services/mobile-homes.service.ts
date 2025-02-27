import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MobileHome } from '../models/mobile-home.interface';
import { MobileHomeStatus } from '../models/mobile-home-status.enum';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileHomesService {
  constructor(private supabase: SupabaseService) {}

  // Real implementation for later use
  async getHomesForDate(date: string): Promise<MobileHome[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('mobile_homes')
        .select('*')
        .eq('date', date);

      if (error) throw error;
      return data as MobileHome[];
    } catch (error) {
      console.error('Error fetching mobile homes:', error);
      return [];
    }
  }

  // Mock implementation for current use
  getMockHomesForDate(date: string): Observable<MobileHome[]> {
    const mockHomes: MobileHome[] = [
      { id: '1', number: '101', status: MobileHomeStatus.READY },
      { id: '2', number: '102', status: MobileHomeStatus.IN_PROGRESS },
      { id: '3', number: '103', status: MobileHomeStatus.URGENT },
      { id: '4', number: '104', status: MobileHomeStatus.OCCUPIED },
      { id: '5', number: '105', status: MobileHomeStatus.PENDING },
      { id: '6', number: '106', status: MobileHomeStatus.READY },
      { id: '7', number: '107', status: MobileHomeStatus.IN_PROGRESS },
      { id: '8', number: '108', status: MobileHomeStatus.OCCUPIED },
      { id: '9', number: '109', status: MobileHomeStatus.READY },
      { id: '10', number: '110', status: MobileHomeStatus.PENDING },
    ];

    return of(mockHomes);
  }
} 