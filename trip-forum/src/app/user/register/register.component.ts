import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  constructor(private userService: UserService, private router: Router) {}

  registerHandler(form: NgForm): void {
    const email = form.value.email;
    const password = form.value.password;
    const rePassword = form.value.rePassword;

    this.userService.register(email, password).subscribe((res) => {
      this.router.navigate(['/login']);
    });
  }
}
