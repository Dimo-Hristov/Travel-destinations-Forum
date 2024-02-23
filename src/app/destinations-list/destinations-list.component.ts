import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../api.service';
import { destination } from '../types/destination';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserService } from '../user/user.service';
import { ActivatedRoute } from '@angular/router';
import { filterDestinationsByType } from '../shared/filter-destinations/filter-by-type.until';
import { ScrollService } from '../destination/scroll.service';

@Component({
  selector: 'app-destinations-list',
  templateUrl: './destinations-list.component.html',
  styleUrls: ['./destinations-list.component.css'],
})
export class DestinationsListComponent implements OnInit, OnDestroy {
  destinationList: destination[] = [];
  isLoading: boolean = true;
  destinationType: string | undefined;
  @ViewChild('discoverPlaceLink') discoverPlaceLink!: ElementRef;

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private scrollService: ScrollService
  ) {}

  ngOnInit(): void {
    this.destinationType =
      this.activatedRoute.snapshot.params['destinationType'];
    this.getSortedDestinations();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  private onScroll = (): void => {
    const scrollPosition = window.scrollY;
    this.scrollService.setLastScrollPosition(scrollPosition);
  };

  scrollToDestination(): void {
    if (this.discoverPlaceLink && this.discoverPlaceLink.nativeElement) {
      this.discoverPlaceLink.nativeElement.scrollIntoView({
        behavior: 'smooth', // Add smooth scrolling effect
        block: 'start', // Scroll to the top of the element
      });
    }
  }

  getSortedDestinations() {
    this.apiService.getDestinations().subscribe({
      next: (destinations: destination[]) => {
        this.destinationList = destinations;

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
}
