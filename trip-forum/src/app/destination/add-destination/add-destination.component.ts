import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/user/user.service';

@Component({
  selector: 'app-add-destination',
  templateUrl: './add-destination.component.html',
  styleUrls: ['./add-destination.component.css'],
})
export class AddDestinationComponent {
  constructor(private userService: UserService, private router: Router) {}

  addDestinationHandler(form: NgForm): void {
    const formData = form.value;
    const destination = formData.destination;
    const imageUrl = formData.imageUrl;
    const description = formData.description;
    const type = formData.type;
    console.log(destination);
    console.log(imageUrl);
    console.log(description);
    console.log(type);
  }

  get isLoggedIn(): boolean {
    return this.userService.isLogged;
  }
}
