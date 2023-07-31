import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { destination } from 'src/app/types/destination';
import { UserService } from 'src/app/user/user.service';

@Component({
  selector: 'app-current-destination',
  templateUrl: './current-destination.component.html',
  styleUrls: ['./current-destination.component.css'],
})
export class CurrentDestinationComponent implements OnInit {
  destination: destination | undefined;
  userId: string = '';

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.fetchDestination();
    this.userId = this.userService.user?._id;
  }

  fetchDestination(): void {
    const id = this.activatedRoute.snapshot.params['destinationId'];
    this.apiService.getDestination(id).subscribe((destination) => {
      this.destination = destination;
    });
  }

  likeDestinationHandler(): void {}

  sanitizeImageUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
