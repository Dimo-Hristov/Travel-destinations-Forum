import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent {
  @ViewChild('discoverPlaceLink') discoverPlaceLink!: ElementRef;

  scrollToDestination(): void {
    if (this.discoverPlaceLink && this.discoverPlaceLink.nativeElement) {
      this.discoverPlaceLink.nativeElement.scrollIntoView({
        behavior: 'smooth', // Add smooth scrolling effect
        block: 'start', // Scroll to the top of the element
      });
    }
  }
}
