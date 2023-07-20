import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestinationsListComponent } from './destinations-list.component';

describe('DestinationsListComponent', () => {
  let component: DestinationsListComponent;
  let fixture: ComponentFixture<DestinationsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DestinationsListComponent]
    });
    fixture = TestBed.createComponent(DestinationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
