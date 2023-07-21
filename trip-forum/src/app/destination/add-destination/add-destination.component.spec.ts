import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDestinationComponent } from './add-destination.component';

describe('AddDestinationComponent', () => {
  let component: AddDestinationComponent;
  let fixture: ComponentFixture<AddDestinationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddDestinationComponent]
    });
    fixture = TestBed.createComponent(AddDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
