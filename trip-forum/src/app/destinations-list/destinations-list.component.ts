import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { destination } from '../types/destination';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../user/user.service';
import { DestinationService } from '../destination/destination.service';
import { sortDestinationsByLikes } from '../shared/sort-destinations/sort-by-likes.utill';
import { ActivatedRoute } from '@angular/router';
import { filterDestinationsByType } from '../shared/filter-destinations/filter-by-type.until';

@Component({
  selector: 'app-destinations-list',
  templateUrl: './destinations-list.component.html',
  styleUrls: ['./destinations-list.component.css'],
})
export class DestinationsListComponent implements OnInit {
  destinationList: destination[] = [];
  isLoading: boolean = true;
  destinationType: string | undefined;

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private destinationService: DestinationService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.destinationType =
      this.activatedRoute.snapshot.params['destinationType'];
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

          // filter destinations if type is choosen
          if (this.destinationType) {
            this.destinationList = filterDestinationsByType(
              this.destinationList,
              this.destinationType
            );
          }

          if (!this.destinationType) {
            this.destinationType = 'place';
          }

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
