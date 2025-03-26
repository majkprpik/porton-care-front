import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-design-system',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, MatButtonModule],
  templateUrl: './design-system.component.html',
  styleUrls: ['./design-system.component.scss']
})
export class DesignSystemComponent {
  // Colors used in the application
  colors = [
    { name: 'Primary', value: '#1976d2' },
    { name: 'Secondary', value: '#424242' },
    { name: 'Success', value: '#4caf50' },
    { name: 'Warning', value: '#ff9800' },
    { name: 'Error', value: '#f44336' },
    { name: 'Background', value: '#f5f5f5' },
    { name: 'Text', value: '#212121' }
  ];

  // Common icons used in the application
  icons = [
    'dashboard',
    'build',
    'people',
    'person',
    'report_problem',
    'playlist_add',
    'menu',
    'close',
    'logout'
  ];

  // Typography styles
  typography = [
    { name: 'Heading 1', class: 'h1', example: 'PortonCare' },
    { name: 'Heading 2', class: 'h2', example: 'Section Title' },
    { name: 'Body Text', class: 'body', example: 'Regular text content' },
    { name: 'Button Text', class: 'button', example: 'Click me' }
  ];
}
