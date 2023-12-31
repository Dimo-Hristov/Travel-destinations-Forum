import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDestinationComponent } from './edit-destination.component';

describe('EditDestinationComponent', () => {
  let component: EditDestinationComponent;
  let fixture: ComponentFixture<EditDestinationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditDestinationComponent]
    });
    fixture = TestBed.createComponent(EditDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
