import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(private userService: UserService, private router: Router) {}

  loginHandler(form: NgForm): void {
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
