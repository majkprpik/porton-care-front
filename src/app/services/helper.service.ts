import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  dimBackground = new BehaviorSubject<boolean>(false);

  constructor() { }
}
