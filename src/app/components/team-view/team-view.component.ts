import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-team-view',
  templateUrl: './team-view.component.html',
//   styleUrls: ['./team-view.component.css']
})
export class TeamViewComponent implements OnInit {
  teamId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get the team ID from the route parameters
    this.route.params.subscribe(params => {
      this.teamId = params['id'];
    });
  }
} 