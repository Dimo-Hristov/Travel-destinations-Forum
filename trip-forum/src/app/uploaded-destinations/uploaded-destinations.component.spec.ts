import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadedDestinationsComponent } from './uploaded-destinations.component';

describe('UploadedDestinationsComponent', () => {
  let component: UploadedDestinationsComponent;
  let fixture: ComponentFixture<UploadedDestinationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UploadedDestinationsComponent]
    });
    fixture = TestBed.createComponent(UploadedDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
