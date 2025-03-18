import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpansionService {
  // BehaviorSubject to track the expansion state
  private expansionState = new BehaviorSubject<boolean>(false);
  
  // Observable that components can subscribe to
  public expansionState$: Observable<boolean> = this.expansionState.asObservable();
  
  constructor() { }
  
  // Toggle the expansion state
  toggleExpansion(): void {
    this.expansionState.next(!this.expansionState.value);
  }
  
  // Get the current expansion state
  getExpansionState(): boolean {
    return this.expansionState.value;
  }
  
  // Set the expansion state to a specific value
  setExpansionState(expanded: boolean): void {
    this.expansionState.next(expanded);
  }
} 