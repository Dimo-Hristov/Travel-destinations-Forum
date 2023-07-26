import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { destination } from 'src/app/types/destination';

@Component({
  selector: 'app-current-destination',
  templateUrl: './current-destination.component.html',
  styleUrls: ['./current-destination.component.css'],
})
export class CurrentDestinationComponent implements OnInit {
  destination: destination | undefined;

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchDestination();
  }

  fetchDestination(): void {
    const id = this.activatedRoute.snapshot.params['destinationId'];
    this.apiService.getDestination(id).subscribe((destination) => {
      this.destination = destination;
      console.log(destination);
    });
  }
}
