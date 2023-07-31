import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DestinationService } from '../destination.service';

@Component({
  selector: 'app-edit-destination',
  templateUrl: './edit-destination.component.html',
  styleUrls: ['./edit-destination.component.css'],
})
export class EditDestinationComponent implements OnInit {
  destination: any;

  constructor(
    private route: ActivatedRoute,
    private destinationService: DestinationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.destination = params;
    });
  }

  editDestinationhanlder(form: NgForm): void {
    const formData = form.value;
    const destination = formData.destination;
    const imageUrl = formData.imageUrl;
    const description = formData.description;
    const type = formData.type;

    const data = {
      destination: destination,
      description: description,
      imageUrl: imageUrl,
      type: type,
    };

    this.destinationService
      .editDestination(this.destination._id, data)
      .subscribe((res) => {
        this.router.navigate([`destinations/${this.destination._id}`]);
      });
  }
}
