import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'username';
  private usernameSubject = new BehaviorSubject<string | null>(this.getStoredUsername());

  constructor(private router: Router) {}

  login(username: string): void {
    localStorage.setItem(this.STORAGE_KEY, username);
    this.usernameSubject.next(username);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.usernameSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getStoredUsername();
  }

  getStoredUsername(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  getUsername() {
    return this.usernameSubject.asObservable();
  }
} 