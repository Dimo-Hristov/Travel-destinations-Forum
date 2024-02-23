import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { destination } from 'src/app/types/destination';
import { UserService } from 'src/app/user/user.service';
import { DestinationService } from '../destination.service';
import { ScrollService } from '../scroll.service';

@Component({
  selector: 'app-current-destination',
  templateUrl: './current-destination.component.html',
  styleUrls: ['./current-destination.component.css'],
})
export class CurrentDestinationComponent implements OnInit {
  public destination!: destination;
  userId: string = '';
  counts: any;
  destinationId: string = this.activatedRoute.snapshot.params['destinationId'];
  isLiked: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private destinationService: DestinationService,
    private router: Router,
    private scrollService: ScrollService
  ) {}

  ngOnInit(): void {
    this.userId = this.userService.user._id || '';
    this.fetchDestination();
  }

  goBack(): void {
    this.scrollService.goBackWithAnimation();
  }

  fetchDestination(): void {
    this.destinationService.getDestination(this.destinationId).subscribe({
      next: (destination: destination) => {
        this.destination = destination;
        this.isLiked = this.destination.likes.includes(this.userId);
      },
      error: (error) => {
        alert(error.message);
      },
    });
  }

  likeDestinationHandler(): void {
    this.destinationService.likeDestination(this.destinationId).subscribe(
      (res) => {
        this.isLiked = !this.isLiked;
        if (this.isLiked) {
          this.destination?.likes.push(this.userId);
        }
        if (!this.isLiked) {
          this.destination.likes = this.destination?.likes.filter(
            (x) => x !== this.userId
          );
        }
      },
      (error) => {
        alert(error.message);
      }
    );
  }

  public editDestination(): void {
    this.router.navigate(['/edit-destination'], {
      queryParams: {
        destination: this.destination?.destination,
        imageUrl: this.destination?.imageUrl,
        description: this.destination?.description,
        type: this.destination?.type,
        _id: this.destinationId,
      },
    });
  }

  public deleteDestination() {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this destination?'
    );

    if (isConfirmed) {
      this.destinationService.deleteDestination(this.destinationId).subscribe(
        (res) => {
          this.router.navigate(['/profile']);
        },
        (error) => {
          alert(error.message);
        }
      );
    }
  }

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
