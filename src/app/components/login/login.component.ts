import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {
  email: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin() {
    if (this.email.trim()) {
      this.loading = true;
      this.errorMessage = '';

      try {
        const success = await this.authService.login(this.email.trim());
        if (!success) {
          this.errorMessage = 'Invalid email or password';
        }
      } catch (error) {
        this.errorMessage = 'An error occurred during login';
        console.error('Login error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
} 