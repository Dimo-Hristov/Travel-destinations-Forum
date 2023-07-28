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
    const email = form.value.email;
    const password = form.value.password;

    this.userService.login(email, password).subscribe(
      (res) => {
        localStorage.setItem('user', JSON.stringify(res));
        this.router.navigate(['/home']);
        this.userService.user = res;
      },
      (error) => {
        if (error.status === 403) {
          alert('Invalid email or password!');
        } else {
          alert(error.message);
        }
      }
    );
  }

  get isLoggedIn(): boolean {
    return this.userService.isLogged;
  }
}
