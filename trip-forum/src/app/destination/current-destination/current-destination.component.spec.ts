import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentDestinationComponent } from './current-destination.component';

describe('CurrentDestinationComponent', () => {
  let component: CurrentDestinationComponent;
  let fixture: ComponentFixture<CurrentDestinationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CurrentDestinationComponent]
    });
    fixture = TestBed.createComponent(CurrentDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
