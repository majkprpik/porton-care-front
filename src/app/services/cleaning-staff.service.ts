import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CleaningPerson } from '../models/cleaning-person.interface';

@Injectable({
  providedIn: 'root'
})
export class CleaningStaffService {
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