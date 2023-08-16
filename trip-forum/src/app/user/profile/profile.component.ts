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
    this.getLikes();
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
  //get likesList
  getLikes() {
    let likesList: any;
    this.apiService.getAllLikes().subscribe(
      (res) => {
        likesList = res;
        this.filterLikes(likesList);
      },
      (error) => {
        alert(error.message);
      }
    );
  }
  //get all liked destinations for current user
  filterLikes(likesList: Like[]) {
    for (const like of likesList) {
      if (this.userId === like._ownerId) {
        this.lastTenLikes.push(like);
      }
    }

    this.lastTenLikes = this.lastTenLikes.slice(-10);
    this.getLikedDestinations(this.lastTenLikes);
  }
  // get last 10 liked destinations
  getLikedDestinations(likesArray: Like[]) {
    for (const like of likesArray) {
      this.destinationService.getDestination(like.albumId).subscribe((res) => {
        this.likedDestinations.push(res);
      });
    }
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
