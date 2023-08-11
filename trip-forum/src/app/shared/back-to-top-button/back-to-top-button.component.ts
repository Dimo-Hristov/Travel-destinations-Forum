import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-back-to-top-button',
  templateUrl: './back-to-top-button.component.html',
  styleUrls: ['./back-to-top-button.component.css'],
})
export class BackToTopButtonComponent {
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
