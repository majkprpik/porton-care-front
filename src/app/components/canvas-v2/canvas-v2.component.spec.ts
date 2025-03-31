import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasV2Component } from './canvas-v2.component';

describe('CanvasV2Component', () => {
  let component: CanvasV2Component;
  let fixture: ComponentFixture<CanvasV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanvasV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
