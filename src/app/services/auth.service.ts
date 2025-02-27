import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'username';
  private usernameSubject = new BehaviorSubject<string | null>(this.getStoredUsername());

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async login(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: email,
        password: 'test' // Fixed password as requested
      });

      if (error) throw error;

      if (data.user) {
        localStorage.setItem(this.STORAGE_KEY, email);
        this.usernameSubject.next(email);
        // Wait for navigation to complete
        await this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.getClient().auth.signOut();
      localStorage.removeItem(this.STORAGE_KEY);
      this.usernameSubject.next(null);
      // Wait for navigation to complete
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to login even if signOut fails
      await this.router.navigate(['/login']);
    }
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