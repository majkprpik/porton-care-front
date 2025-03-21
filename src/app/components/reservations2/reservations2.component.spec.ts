import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reservations2Component } from './reservations2.component';
import { ReservationsService } from '../../services/reservations.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Reservations2Component', () => {
  let component: Reservations2Component;
  let fixture: ComponentFixture<Reservations2Component>;
  let mockReservationsService = jasmine.createSpyObj(['getAvailabilityTypes', 'getHousesWithAvailabilityStatus']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservations2Component],
      providers: [
        { provide: ReservationsService, useValue: mockReservationsService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // To ignore Angular Material components in tests
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Reservations2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 