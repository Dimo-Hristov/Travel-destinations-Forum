// scroll.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private lastScrollPosition: number = 0;

  constructor(private router: Router) {}

  setLastScrollPosition(position: number): void {
    this.lastScrollPosition = position;
  }

  getLastScrollPosition(): number {
    return this.lastScrollPosition;
  }

  goBackWithAnimation(): void {
    const lastScrollPosition = this.lastScrollPosition;
    this.router.navigate(['/destinations']);

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

  // Easing function for smoother animation (Cubic Out)
  private easeOutCubic(t: number): number {
    return --t * t * t + 1;
  }
}
