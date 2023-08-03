import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { destination } from '../types/destination';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../user/user.service';
import { DestinationService } from '../destination/destination.service';
import { sortDestinationsByLikes } from '../shared/sort-destinations/sort-by-likes.utill';

@Component({
  selector: 'app-destinations-list',
  templateUrl: './destinations-list.component.html',
  styleUrls: ['./destinations-list.component.css'],
})
export class DestinationsListComponent implements OnInit {
  destinationList: destination[] = [];
  isLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private destinationService: DestinationService
  ) {}

  ngOnInit(): void {
    this.getSortedDestinations();
  }

  getSortedDestinations() {
    this.apiService.getDestinations().subscribe({
      next: (destinations) => {
        sortDestinationsByLikes(
          destinations,
          this.destinationService
        ).subscribe((sortedDestinations) => {
          this.destinationList = sortedDestinations;
          this.isLoading = false;
        });
      },
      error: (err) => {
        this.isLoading = false;
        alert(err);
      },
    });
  }

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get isLogged(): boolean {
    return this.userService.isLogged;
  }

  setLikes(destinations: destination[]) {
    for (const destination of destinations) {
      this.destinationService
        .getDestinationLikesCount(destination._id)
        .subscribe((res) => {
          destination.likes = res;
        });
    }
  }
}
