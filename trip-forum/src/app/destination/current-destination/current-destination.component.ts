import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
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
  destination: destination | undefined;
  userId: string = '';
  counts: any;
  destinationId: string = this.activatedRoute.snapshot.params['destinationId'];
  isLikeButtonDisabled: boolean = false;

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private destinationService: DestinationService
  ) {}

  ngOnInit(): void {
    this.fetchDestination();
    this.userId = this.userService.user?._id;
    this.getLikes(this.destinationId);
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

  getLikes(destinationId: string): any {
    this.destinationService
      .getDestinationLikes(destinationId)
      .subscribe((likesList) => {
        console.log(likesList);
      });
  }

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
