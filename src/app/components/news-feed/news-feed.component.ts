import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Activity interface to define the structure of activities
interface Activity {
  id: number;
  type: 'task-completed' | 'user-arrived' | 'task-assigned' | 'note-added';
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss']
})
export class NewsFeedComponent implements OnInit {
  // Sample activities data
  activities: Activity[] = [
    {
      id: 1,
      type: 'task-completed',
      message: 'Marko Marić completed cleaning for Mobile Home #42',
      timestamp: new Date(Date.now() - 15 * 60000) // 15 minutes ago
    },
    {
      id: 2,
      type: 'user-arrived',
      message: 'Ivana Ivić has arrived to the camp',
      timestamp: new Date(Date.now() - 45 * 60000) // 45 minutes ago
    },
    {
      id: 3,
      type: 'task-assigned',
      message: 'New repair task assigned to Team S1 for Mobile Home #28',
      timestamp: new Date(Date.now() - 120 * 60000) // 2 hours ago
    },
    {
      id: 4,
      type: 'note-added',
      message: 'Reception added a note about guest arrival for Mobile Home #15',
      timestamp: new Date(Date.now() - 180 * 60000) // 3 hours ago
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Fetch initial data
    this.loadActivities();
  }

  // Method to refresh the activity feed
  refreshFeed(): void {
    console.log('Refreshing activity feed...');
    this.loadActivities();
  }

  // Method to load activities from a service (in a real app)
  private loadActivities(): void {
    // In a real app, this would call a service to fetch activities from the backend
    console.log('Loading activities...');
    // For now, we're using the sample data defined above
  }
}
