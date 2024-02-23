import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DestinationService } from '../destination.service';

@Component({
  selector: 'app-add-destination',
  templateUrl: './add-destination.component.html',
  styleUrls: ['./add-destination.component.css'],
})
export class AddDestinationComponent {
  constructor(
    private destinationService: DestinationService,
    private router: Router
  ) {}

  addDestinationHandler(form: NgForm): void {
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

    this.destinationService.addDestination(data).subscribe(
      (data) => {
        this.router.navigate([`/destinations/${data._id}`]);
      },
      (error) => {
        alert(error.message);
      }
    );
  }
}
