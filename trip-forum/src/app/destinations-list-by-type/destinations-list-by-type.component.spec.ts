import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestinationsListByTypeComponent } from './destinations-list-by-type.component';

describe('DestinationsListByTypeComponent', () => {
  let component: DestinationsListByTypeComponent;
  let fixture: ComponentFixture<DestinationsListByTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DestinationsListByTypeComponent]
    });
    fixture = TestBed.createComponent(DestinationsListByTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
