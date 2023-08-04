import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private lastScrollPosition: number = 0;
  private previousUrl: string = '/';

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = event.url;
      }
    });
  }

  setLastScrollPosition(position: number): void {
    this.lastScrollPosition = position;
  }

  getLastScrollPosition(): number {
    return this.lastScrollPosition;
  }

  goBackWithAnimation(): void {
    const lastScrollPosition = this.lastScrollPosition;

    // Store the current URL before navigating back
    const currentUrl = this.router.url;

    // Navigate back to the previous URL using Location service
    this.location.back();

    // Wait for the back navigation to complete before starting the scroll animation
    const checkNavigationCompleted = setInterval(() => {
      if (this.router.url !== currentUrl) {
        clearInterval(checkNavigationCompleted);

        const duration = 500; // Time in milliseconds for the transition
        const startTime = performance.now();

        const scrollAnimation = (currentTime: number) => {
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const ease = this.easeOutCubic(progress);
          const newPosition = lastScrollPosition * ease;
          window.scrollTo(0, newPosition);

          if (timeElapsed < duration) {
            requestAnimationFrame(scrollAnimation);
          }
        };

        requestAnimationFrame(scrollAnimation);
      }
    }, 10);
  }

  // Easing function for smoother animation (Cubic Out)
  private easeOutCubic(t: number): number {
    return --t * t * t + 1;
  }
}
