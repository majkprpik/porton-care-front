import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FilterByTypePipe } from '../../pipes/filter-by-type.pipe';
import { CountPipe } from '../../pipes/count.pipe';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, FilterByTypePipe, CountPipe]
})
export class MainComponent implements OnInit {
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  data$: Observable<any>;

  constructor(private dataService: DataService) {
    this.loading$ = this.dataService.loading$;
    this.error$ = this.dataService.error$;
    
    // Initialize data$ observable
    this.data$ = combineLatest({
      houses: this.dataService.houses$,
      profiles: this.dataService.profiles$,
      tasks: this.dataService.tasks$,
      workGroups: this.dataService.workGroups$,
      houseTypes: this.dataService.houseTypes$,
      taskTypes: this.dataService.taskTypes$,
      taskProgressTypes: this.dataService.taskProgressTypes$,
    }).pipe(
      map(data => ({
        ...data,
        totalHouses: data.houses.length,
        totalProfiles: data.profiles.length,
        totalTasks: data.tasks.length,
        totalWorkGroups: data.workGroups.length
      }))
    );
    
    // Enable debug mode to see data loading logs
    this.dataService.setDebug(true);
  }

  ngOnInit(): void {
    // Data is automatically loaded when the service is initialized
  }

  refresh(): void {
    this.dataService.refreshData();
  }
}
