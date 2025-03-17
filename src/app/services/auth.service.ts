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
  ) {
    // this.initializeTestUsers();
  }

  private async initializeTestUsers(): Promise<void> {
    try {
      await this.createTestUsers();
      console.log('Test users initialization completed');
    } catch (error) {
      console.error('Failed to initialize test users:', error);
    }
  }

  async login(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: email,
        password: 'test123' // Fixed password as requested
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

  /**
   * Creates 10 test users in the application
   * @returns Promise that resolves to an array of created user IDs or null if operation failed
   */
  async createTestUsers(): Promise<string[] | null> {
    try {
      const userIds: string[] = [];
      
      // In a real application, you would typically create users through a secure backend API
      // This is a simplified version for demonstration purposes
      for (let i = 1; i <= 10; i++) {
        const email = `User${i}@example.com`;
        
        // Using signUp instead of admin.createUser which requires admin privileges
        const { data, error } = await this.supabaseService.getClient().auth.signUp({
          email: email,
          password: 'test123', // More secure password
          options: {
            data: {
              display_name: `User ${i}`,
              role: i <= 2 ? 'admin' : 'user' // First two users are admins
            }
          }
        });
        
        if (error) {
          console.error(`Error creating user ${i}:`, error);
          continue;
        }
        
        if (data.user) {
          userIds.push(data.user.id);
          console.log(`Created user: ${email}`);
        }
      }
      
      return userIds.length > 0 ? userIds : null;
    } catch (error) {
      console.error('Error creating test users:', error);
      return null;
    }
  }
}