import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { UserService } from '../user.service';
import { destination } from '../../types/destination';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScrollService } from '../../destination/scroll.service';
import { Like } from 'src/app/types/like';
import { DestinationService } from 'src/app/destination/destination.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  constructor(
    private destinationService: DestinationService,
    private apiService: ApiService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private scrollService: ScrollService
  ) {}

  lastTenLikes: Like[] = [];
  userId = this.userService.user._id;
  likedDestinations: destination[] = [];
  myDestinations: destination[] = [];

  ngOnInit(): void {
    this.getMyLikes();
    this.getMyPosts();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  private onScroll = (): void => {
    const scrollPosition = window.scrollY;
    this.scrollService.setLastScrollPosition(scrollPosition);
  };

  getMyLikes() {
    this.destinationService.getLikes().subscribe({
      next: (res: any) => {
        this.likedDestinations = res;
      },
      error: (err) => {
        alert(err.message);
      },
    });
  }

  getMyPosts() {
    this.apiService.getDestinations().subscribe(
      (destinations) => {
        for (const destination of destinations) {
          if (destination._ownerId === this.userId) {
            this.myDestinations.push(destination);
          }
        }
        // reverse the array to get the last added at the top
        this.myDestinations.reverse();
      },
      (error) => {
        alert(error.message);
      }
    );
  }

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
