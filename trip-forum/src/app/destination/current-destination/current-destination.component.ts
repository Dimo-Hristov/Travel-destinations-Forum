import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { destination } from 'src/app/types/destination';
import { UserService } from 'src/app/user/user.service';
import { DestinationService } from '../destination.service';

@Component({
  selector: 'app-current-destination',
  templateUrl: './current-destination.component.html',
  styleUrls: ['./current-destination.component.css'],
})
export class CurrentDestinationComponent implements OnInit {
  public destination: destination | undefined;
  userId: string = '';
  counts: any;
  destinationId: string = this.activatedRoute.snapshot.params['destinationId'];
  isLikeButtonDisabled: boolean = false;

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private destinationService: DestinationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchDestination();
    this.userId = this.userService.user?._id;
    this.getLikesList(this.destinationId);
  }

  fetchDestination(): void {
    this.apiService
      .getDestination(this.destinationId)
      .subscribe((destination) => {
        this.destination = destination;
      });
  }

  likeDestinationHandler(): void {
    this.destinationService
      .likeDestination(this.destinationId)
      .subscribe((res) => {
        this.isLikeButtonDisabled = true;
      });
  }

  getLikesList(destinationId: string): any {
    this.destinationService
      .getDestinationLikesList(destinationId)
      .subscribe((likesList) => {
        console.log(likesList);

        for (const like of likesList) {
          debugger;
          if (like._ownerId === this.destination?._ownerId) {
            this.isLikeButtonDisabled = true;
            return;
          }
        }
      });
  }

  editDestination(): void {
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

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
