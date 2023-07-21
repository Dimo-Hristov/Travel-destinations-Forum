import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { destination } from '../types/destination';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.apiService.getDestinations().subscribe({
      next: (destinations) => {
        this.destinationList = destinations;
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
}
